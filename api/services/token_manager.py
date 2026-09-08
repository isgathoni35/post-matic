"""OAuth 2.0 Token Expiration Verification and Auto-Refresh Utility."""
from datetime import datetime, timedelta, timezone
import logging
from typing import Any, Dict, List, Optional, Tuple
import httpx

from api.db import get_social_accounts, upsert_social_account
from engine.config import (
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    META_APP_ID,
    META_APP_SECRET,
    TIKTOK_CLIENT_KEY,
    TIKTOK_CLIENT_SECRET,
)

logger = logging.getLogger("postmatic.token_manager")
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/"
META_TOKEN_URL = "https://graph.facebook.com/v20.0/oauth/access_token"


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


async def refresh_tiktok_access_token(
    refresh_token: str,
    client_key: Optional[str] = None,
    client_secret: Optional[str] = None,
) -> Dict[str, Any]:
    """Exchange a TikTok refresh token for a fresh access token.

    Args:
        refresh_token: The persistent refresh token from previous OAuth grant.
        client_key: Optional override for TikTok Client Key.
        client_secret: Optional override for TikTok Client Secret.

    Returns:
        dict: Contains 'access_token', 'refresh_token', 'token_expires_at', 'expires_in'.
    """
    c_key = client_key or TIKTOK_CLIENT_KEY
    c_sec = client_secret or TIKTOK_CLIENT_SECRET

    if not c_key or not c_sec:
        raise ValueError("TIKTOK_CLIENT_KEY or TIKTOK_CLIENT_SECRET is missing from environment.")
    if not refresh_token:
        raise ValueError("Cannot refresh TikTok access token: refresh_token is missing.")

    payload = {
        "client_key": c_key,
        "client_secret": c_sec,
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
    }
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post(TIKTOK_TOKEN_URL, data=payload, headers=headers)
        if res.status_code != 200:
            logger.error("TikTok token refresh failed (HTTP %d): %s", res.status_code, res.text)
            raise RuntimeError(f"TikTok token refresh failed: {res.text}")

        res_json = res.json()
        data = res_json.get("data") or res_json
        access_token = data.get("access_token")
        if not access_token:
            err_msg = res_json.get("error_description") or res_json.get("message") or str(res_json)
            raise RuntimeError(f"TikTok token refresh returned no access_token: {err_msg}")

        expires_in = data.get("expires_in", 86400)
        new_refresh_token = data.get("refresh_token") or refresh_token
        token_expires_at = (
            datetime.now(timezone.utc) + timedelta(seconds=expires_in)
        ).isoformat()

        logger.info("Successfully refreshed TikTok access token (expires in %ds)", expires_in)
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_expires_at": token_expires_at,
            "expires_in": expires_in,
        }


async def refresh_meta_access_token(
    current_token: str,
    client_id: Optional[str] = None,
    client_secret: Optional[str] = None,
) -> Dict[str, Any]:
    """Exchange or extend a Meta/Instagram user access token for a 60-day long-lived token.

    Args:
        current_token: The current access token or stored long-lived token.
        client_id: Optional override for Meta App ID.
        client_secret: Optional override for Meta App Secret.

    Returns:
        dict: Contains 'access_token', 'token_expires_at', 'expires_in'.
    """
    c_id = client_id or META_APP_ID
    c_sec = client_secret or META_APP_SECRET

    if not c_id or not c_sec:
        raise ValueError("META_APP_ID or META_APP_SECRET is missing from environment.")
    if not current_token:
        raise ValueError("Cannot refresh Meta access token: current_token is missing.")

    params = {
        "grant_type": "fb_exchange_token",
        "client_id": c_id,
        "client_secret": c_sec,
        "fb_exchange_token": current_token,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.get(META_TOKEN_URL, params=params)
        if res.status_code != 200:
            logger.error("Meta token refresh failed (HTTP %d): %s", res.status_code, res.text)
            raise RuntimeError(f"Meta token refresh failed: {res.text}")

        data = res.json()
        access_token = data.get("access_token")
        if not access_token:
            raise RuntimeError(f"Meta token refresh returned no access_token: {data}")

        expires_in = data.get("expires_in", 5184000)  # Default ~60 days
        token_expires_at = (
            datetime.now(timezone.utc) + timedelta(seconds=expires_in)
        ).isoformat()

        logger.info("Successfully refreshed Meta/Instagram access token (expires in %ds)", expires_in)
        return {
            "access_token": access_token,
            "token_expires_at": token_expires_at,
            "expires_in": expires_in,
        }


async def ensure_valid_access_token(account: Dict[str, Any]) -> Tuple[str, bool]:
    """Ensure the given social account record has a valid, non-expired access token.

    If expired, refreshes token via platform-specific OAuth provider and updates the Supabase record.

    Args:
        account: Social account database record dict.

    Returns:
        tuple[str, bool]: (access_token, was_refreshed)
    """
    current_token = account.get("access_token", "")
    expires_at = account.get("token_expires_at")
    refresh_tok = account.get("refresh_token")
    platform = (account.get("platform") or "youtube").lower()

    if not is_token_expired(expires_at) and current_token:
        return current_token, False

    logger.info("Access token for account '%s' (platform: %s) is expired or needs refresh.", account.get("id"), platform)

    if platform == "youtube":
        if not refresh_tok:
            if current_token:
                logger.warning("YouTube token for account '%s' is expired with no refresh token.", account.get("id"))
                return current_token, False
            raise ValueError(f"No access token or refresh token available for account {account.get('id')}")

        refresh_result = await refresh_google_access_token(refresh_tok)
        new_access_token = refresh_result["access_token"]
        new_expires_at = refresh_result["token_expires_at"]
        new_refresh_token = refresh_tok

    elif platform == "tiktok":
        if not refresh_tok:
            if current_token:
                logger.warning("TikTok token for account '%s' is expired with no refresh token.", account.get("id"))
                return current_token, False
            raise ValueError(f"No access token or refresh token available for account {account.get('id')}")

        refresh_result = await refresh_tiktok_access_token(refresh_tok)
        new_access_token = refresh_result["access_token"]
        new_expires_at = refresh_result["token_expires_at"]
        new_refresh_token = refresh_result.get("refresh_token") or refresh_tok

    elif platform == "instagram":
        tok_to_exchange = refresh_tok or current_token
        if not tok_to_exchange:
            raise ValueError(f"No token available to refresh Instagram account {account.get('id')}")

        refresh_result = await refresh_meta_access_token(tok_to_exchange)
        new_access_token = refresh_result["access_token"]
        new_expires_at = refresh_result["token_expires_at"]
        new_refresh_token = new_access_token  # Meta long-lived token stored as both

    else:
        raise ValueError(f"Unsupported social platform for token refresh: {platform}")

    # Persist updated token to Supabase / in-memory
    upsert_social_account(
        platform=platform,
        account_name=account.get("account_name") or "Connected Account",
        access_token=new_access_token,
        refresh_token=new_refresh_token,
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
