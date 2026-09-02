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
from api.schemas import PublishVideoRequest, SocialAccountResponse, SocialAuthUrlResponse
from engine.config import (
    FRONTEND_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    OUTPUT_DIR,
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


@router.post(
    "/publish/{job_id}",
    summary="Publish a rendered video to YouTube Shorts",
    description="Uploads a previously rendered video to the user's connected YouTube channel.",
)
async def publish_video_to_social(
    job_id: str,
    payload: PublishVideoRequest = PublishVideoRequest(),
):
    """Publish a completed video to YouTube Shorts."""
    from api.db import get_video_job_record, update_video_job_record, get_social_accounts
    from api.services.token_manager import ensure_valid_access_token
    from engine.social.youtube_uploader import upload_video_to_youtube

    job = get_video_job_record(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video job '{job_id}' not found.",
        )

    if job.status.value != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Video job is not completed yet (current status: {job.status.value}).",
        )

    # Determine video file path
    video_path = None
    if job.video_url:
        if job.video_url.startswith("http") and "youtube.com" in job.video_url:
            return {
                "message": "Video is already published to YouTube!",
                "youtube_url": job.video_url,
                "job_id": job_id,
            }
        filename = job.video_url.split("/")[-1]
        local_candidate = OUTPUT_DIR / filename
        if local_candidate.exists():
            video_path = local_candidate

    if not video_path or not video_path.exists():
        local_candidate = OUTPUT_DIR / f"video_{job_id}.mp4"
        if local_candidate.exists():
            video_path = local_candidate

    if not video_path or not video_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rendered video file not found on disk for upload.",
        )

    effective_user_id = payload.user_id or getattr(job, "user_id", None)
    accounts = get_social_accounts(user_id=effective_user_id)
    yt_acc = next((a for a in accounts if a.get("platform") == "youtube"), None)

    if not yt_acc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No connected YouTube account found. Please connect your YouTube channel first.",
        )

    try:
        access_token, was_refreshed = await ensure_valid_access_token(yt_acc)
        title = job.topic[:100]
        desc = f"{job.topic}\n\n#Shorts #Viral"
        tags = ["shorts", "viral"]

        upload_result = upload_video_to_youtube(
            video_file_path=video_path,
            title=title,
            description=desc,
            tags=tags,
            access_token=access_token,
            privacy_status=payload.privacy,
        )

        # Update video job with the live YouTube URL
        update_video_job_record(
            job_id=job_id,
            status=job.status,
            video_url=upload_result.youtube_url,
        )

        return {
            "status": "success",
            "message": "Video published successfully to YouTube Shorts!",
            "video_id": upload_result.video_id,
            "youtube_url": upload_result.youtube_url,
            "title": upload_result.title,
            "privacy_status": upload_result.privacy_status,
        }
    except Exception as exc:
        logger.exception("Failed to publish video to YouTube: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"YouTube upload failed: {str(exc)}",
        )
