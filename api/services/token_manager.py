"""OAuth 2.0 Token Expiration Verification and Auto-Refresh Utility."""
from datetime import datetime, timedelta, timezone
import logging
from typing import Any, Dict, List, Optional, Tuple
import httpx

from api.db import get_social_accounts, upsert_social_account
from engine.config import (
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
)

logger = logging.getLogger("postmatic.token_manager")
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"


def parse_iso_datetime(dt_str: Optional[str]) -> Optional[datetime]:
    """Parse ISO 8601 string to timezone-aware UTC datetime."""
    if not dt_str:
        return None
    try:
        clean_str = dt_str.replace("Z", "+00:00")
        dt = datetime.fromisoformat(clean_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception as e:
        logger.warning("Failed to parse datetime '%s': %s", dt_str, e)
        return None


def is_token_expired(
    token_expires_at: Optional[str],
    buffer_seconds: int = 300,
) -> bool:
    """Check if an access token is expired or within the expiration buffer window.

    Args:
        token_expires_at: ISO timestamp string of token expiration.
        buffer_seconds: Safety buffer window in seconds (default: 5 minutes / 300s).

    Returns:
        bool: True if expired or expiring within buffer_seconds, False otherwise.
    """
    if not token_expires_at:
        return True

    exp_dt = parse_iso_datetime(token_expires_at)
    if not exp_dt:
        return True

    now_utc = datetime.now(timezone.utc)
    return (now_utc + timedelta(seconds=buffer_seconds)) >= exp_dt


async def refresh_google_access_token(
    refresh_token: str,
    client_id: Optional[str] = None,
    client_secret: Optional[str] = None,
) -> Dict[str, Any]:
    """Exchange a Google OAuth refresh token for a fresh access token.

    Args:
        refresh_token: The persistent refresh token.
        client_id: Optional override for Google Client ID.
        client_secret: Optional override for Google Client Secret.

    Returns:
        dict: Contains 'access_token', 'token_expires_at', 'expires_in'.
    """
    c_id = client_id or GOOGLE_CLIENT_ID
    c_sec = client_secret or GOOGLE_CLIENT_SECRET

    if not c_id or not c_sec:
        raise ValueError("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing from environment.")
    if not refresh_token:
        raise ValueError("Cannot refresh access token: refresh_token is missing.")

    payload = {
        "client_id": c_id,
        "client_secret": c_sec,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post(GOOGLE_TOKEN_URL, data=payload)
        if res.status_code != 200:
            logger.error("Google token refresh failed (HTTP %d): %s", res.status_code, res.text)
            raise RuntimeError(f"Google token refresh failed: {res.text}")

        data = res.json()
        access_token = data.get("access_token")
        if not access_token:
            raise RuntimeError(f"Google token refresh returned no access_token: {data}")

        expires_in = data.get("expires_in", 3600)
        token_expires_at = (
            datetime.now(timezone.utc) + timedelta(seconds=expires_in)
        ).isoformat()

        logger.info("Successfully refreshed Google access token (expires in %ds)", expires_in)
        return {
            "access_token": access_token,
            "token_expires_at": token_expires_at,
            "expires_in": expires_in,
        }


async def ensure_valid_access_token(account: Dict[str, Any]) -> Tuple[str, bool]:
    """Ensure the given social account record has a valid, non-expired access token.

    If expired, refreshes token via Google OAuth and updates the Supabase record.

    Args:
        account: Social account database record dict.

    Returns:
        tuple[str, bool]: (access_token, was_refreshed)
    """
    current_token = account.get("access_token", "")
    expires_at = account.get("token_expires_at")
    refresh_tok = account.get("refresh_token")
    platform = account.get("platform", "youtube")

    if not is_token_expired(expires_at) and current_token:
        return current_token, False

    if not refresh_tok:
        if current_token:
            logger.warning(
                "Access token for account '%s' is expired and no refresh token is stored.",
                account.get("id"),
            )
            return current_token, False
        raise ValueError(f"No access token or refresh token available for account {account.get('id')}")

    logger.info("Access token for account '%s' is expired. Refreshing token...", account.get("id"))
    refresh_result = await refresh_google_access_token(refresh_tok)
    new_access_token = refresh_result["access_token"]
    new_expires_at = refresh_result["token_expires_at"]

    # Persist updated token to Supabase
    upsert_social_account(
        platform=platform,
        account_name=account.get("account_name") or "Connected Account",
        access_token=new_access_token,
        refresh_token=refresh_tok,
        token_expires_at=new_expires_at,
        user_id=account.get("user_id"),
    )

    return new_access_token, True


async def verify_and_refresh_user_accounts(
    user_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Scan all connected social accounts and refresh any expired access tokens."""
    accounts = get_social_accounts(user_id=user_id)
    refreshed_summaries = []

    for acc in accounts:
        acc_id = acc.get("id")
        platform = acc.get("platform")
        try:
            _, was_refreshed = await ensure_valid_access_token(acc)
            refreshed_summaries.append({
                "account_id": acc_id,
                "platform": platform,
                "refreshed": was_refreshed,
                "status": "active",
            })
        except Exception as e:
            logger.error("Failed to verify/refresh token for account %s: %s", acc_id, e)
            refreshed_summaries.append({
                "account_id": acc_id,
                "platform": platform,
                "refreshed": False,
                "status": "error",
                "error": str(e),
            })

    return refreshed_summaries
