"""FastAPI router for social media OAuth 2.0 and channel integrations."""
from datetime import datetime, timedelta, timezone
import json
import logging
from typing import List, Optional
import urllib.parse
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import RedirectResponse
import httpx

from api.db import delete_social_account, get_social_accounts, upsert_social_account
from api.schemas import SocialAccountResponse, SocialAuthUrlResponse
from engine.config import (
    FRONTEND_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/social", tags=["Social Media Integrations"])

# YouTube Data API v3 OAuth Scopes
YOUTUBE_SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/userinfo.profile",
]
GOOGLE_AUTH_BASE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
YOUTUBE_CHANNELS_API = "https://www.googleapis.com/youtube/v3/channels"


@router.get(
    "/youtube/auth-url",
    response_model=SocialAuthUrlResponse,
    summary="Generate Google OAuth 2.0 consent URL for YouTube",
    description="Constructs authorization URL with offline access type and consent prompt to secure a refresh token.",
)
async def get_youtube_auth_url(user_id: Optional[str] = None) -> SocialAuthUrlResponse:
    """Generate the Google OAuth consent URL."""
    if not GOOGLE_CLIENT_ID:
        # Fallback or informative notice
        logger.warning("GOOGLE_CLIENT_ID is not configured in environment.")

    state_data = json.dumps({"user_id": user_id or "", "platform": "youtube"})
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(YOUTUBE_SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "true",
        "state": state_data,
    }

    auth_url = f"{GOOGLE_AUTH_BASE_URL}?{urllib.parse.urlencode(params)}"
    return SocialAuthUrlResponse(auth_url=auth_url, platform="youtube")


@router.get(
    "/youtube/callback",
    summary="Google OAuth 2.0 authorization callback",
    description="Handles Google OAuth code exchange, fetches channel info, and persists refresh tokens in Supabase.",
)
async def youtube_oauth_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
):
    """Callback handler for Google OAuth 2.0."""
    if error:
        logger.error("OAuth error received from Google: %s", error)
        return RedirectResponse(url=f"{FRONTEND_URL}/?error={urllib.parse.quote(error)}")

    if not code:
        logger.error("No authorization code provided in Google OAuth callback.")
        return RedirectResponse(url=f"{FRONTEND_URL}/?error=missing_auth_code")

    user_id: Optional[str] = None
    if state:
        try:
            parsed_state = json.loads(state)
            user_id = parsed_state.get("user_id") or None
        except Exception:
            pass

    # Exchange authorization code for tokens
    token_payload = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            token_res = await client.post(GOOGLE_TOKEN_URL, data=token_payload)

            if token_res.status_code != 200:
                logger.error("Token exchange failed: %s", token_res.text)
                return RedirectResponse(url=f"{FRONTEND_URL}/?error=token_exchange_failed")

            tokens = token_res.json()
            if hasattr(tokens, "__await__"):
                tokens = await tokens
            access_token = tokens.get("access_token")
            refresh_token = tokens.get("refresh_token")
            expires_in = tokens.get("expires_in", 3600)

            token_expires_at = (
                datetime.now(timezone.utc) + timedelta(seconds=expires_in)
            ).isoformat()

            # Retrieve YouTube Channel profile name
            channel_name = "YouTube Channel"
            try:
                headers = {"Authorization": f"Bearer {access_token}"}
                params = {"part": "snippet", "mine": "true"}
                ch_res = await client.get(YOUTUBE_CHANNELS_API, headers=headers, params=params)
                if ch_res.status_code == 200:
                    ch_data = ch_res.json()
                    if hasattr(ch_data, "__await__"):
                        ch_data = await ch_data
                    items = ch_data.get("items", [])
                    if items and "snippet" in items[0]:
                        channel_name = items[0]["snippet"].get("title", channel_name)
            except Exception as ch_err:
                logger.warning("Failed to fetch channel name from YouTube API: %s", ch_err)

            # Upsert into database
            upsert_social_account(
                platform="youtube",
                account_name=channel_name,
                access_token=access_token,
                refresh_token=refresh_token,
                token_expires_at=token_expires_at,
                user_id=user_id,
            )

            logger.info("Successfully connected YouTube channel '%s' (User: %s)", channel_name, user_id)
            encoded_name = urllib.parse.quote(channel_name)
            return RedirectResponse(url=f"{FRONTEND_URL}/?connected=youtube&channel={encoded_name}")

    except Exception as exc:
        logger.exception("Unexpected exception in OAuth callback: %s", exc)
        return RedirectResponse(url=f"{FRONTEND_URL}/?error=internal_oauth_error")


@router.get(
    "/accounts",
    response_model=List[SocialAccountResponse],
    summary="List connected social media accounts",
    description="Returns all social publishing accounts connected for the given user.",
)
async def list_social_accounts(
    user_id: Optional[str] = Query(None, description="Filter by user UUID"),
) -> List[SocialAccountResponse]:
    """Retrieve connected social accounts."""
    rows = get_social_accounts(user_id=user_id)
    response = []
    for r in rows:
        response.append(
            SocialAccountResponse(
                id=r["id"],
                user_id=r.get("user_id"),
                platform=r["platform"],
                account_name=r.get("account_name"),
                has_refresh_token=bool(r.get("refresh_token")),
                token_expires_at=r.get("token_expires_at"),
                created_at=r.get("created_at", datetime.now(timezone.utc).isoformat()),
                updated_at=r.get("updated_at", datetime.now(timezone.utc).isoformat()),
            )
        )
    return response


@router.delete(
    "/accounts/{account_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Disconnect a social media account",
    description="Removes the OAuth token record and connection from Supabase.",
)
async def disconnect_account(
    account_id: str,
    user_id: Optional[str] = Query(None, description="Owner user UUID"),
):
    """Disconnect and delete a social account."""
    delete_social_account(account_id=account_id, user_id=user_id)
    return None


@router.post(
    "/refresh/{account_id}",
    summary="Manually verify and refresh access token for an account",
    description="Refreshes expired OAuth 2.0 access token using the stored refresh token.",
)
async def refresh_account_token(
    account_id: str,
    user_id: Optional[str] = Query(None, description="Owner user UUID"),
):
    """Refresh token for a specific social account."""
    from api.services.token_manager import ensure_valid_access_token
    accounts = get_social_accounts(user_id=user_id)
    target = next((a for a in accounts if a.get("id") == account_id), None)
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Social account '{account_id}' not found.",
        )

    try:
        token, was_refreshed = await ensure_valid_access_token(target)
        return {
            "account_id": account_id,
            "refreshed": was_refreshed,
            "status": "active",
        }
    except Exception as e:
        logger.error("Token refresh failed for account %s: %s", account_id, e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Token refresh failed: {str(e)}",
        )


@router.post(
    "/verify-tokens",
    summary="Verify and refresh tokens for all connected accounts",
    description="Pre-publishing verification worker checking all accounts for expired tokens.",
)
async def verify_all_tokens(
    user_id: Optional[str] = Query(None, description="Filter by user UUID"),
):
    """Verify and auto-refresh expired tokens across accounts."""
    from api.services.token_manager import verify_and_refresh_user_accounts
    results = await verify_and_refresh_user_accounts(user_id=user_id)
    return {"results": results}
