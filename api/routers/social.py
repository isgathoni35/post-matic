import base64
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
    META_APP_ID,
    META_APP_SECRET,
    INSTAGRAM_REDIRECT_URI,
    TIKTOK_CLIENT_KEY,
    TIKTOK_CLIENT_SECRET,
    TIKTOK_REDIRECT_URI,
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

# TikTok Login Kit & Content Posting API
TIKTOK_AUTH_BASE_URL = "https://www.tiktok.com/v2/auth/authorize/"
TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/"
TIKTOK_USER_INFO_URL = "https://open.tiktokapis.com/v2/user/info/"
TIKTOK_SCOPES = ["user.info.basic", "video.publish", "video.upload"]

# Meta Graph API (Instagram Reels)
META_AUTH_BASE_URL = "https://www.facebook.com/v20.0/dialog/oauth"
META_TOKEN_URL = "https://graph.facebook.com/v20.0/oauth/access_token"
META_ACCOUNTS_URL = "https://graph.facebook.com/v20.0/me/accounts"
INSTAGRAM_SCOPES = [
    "instagram_basic",
    "instagram_content_publish",
    "pages_show_list",
    "pages_read_engagement",
]


def _encode_oauth_state(payload: dict) -> str:
    """Encode OAuth state payload into URL-safe base64 string."""
    raw_bytes = json.dumps(payload).encode("utf-8")
    return base64.urlsafe_b64encode(raw_bytes).decode("utf-8")


def _decode_oauth_state(state_str: str) -> dict:
    """Decode OAuth state payload from base64url or fallback to plain JSON."""
    if not state_str:
        return {}
    try:
        raw_bytes = base64.urlsafe_b64decode(state_str.encode("utf-8"))
        return json.loads(raw_bytes.decode("utf-8"))
    except Exception:
        try:
            return json.loads(state_str)
        except Exception:
            return {}


@router.get(
    "/youtube/auth-url",
    response_model=SocialAuthUrlResponse,
    summary="Generate Google OAuth 2.0 consent URL for YouTube",
    description="Constructs authorization URL with offline access type and consent prompt to secure a refresh token.",
)
async def get_youtube_auth_url(user_id: Optional[str] = None) -> SocialAuthUrlResponse:
    """Generate the Google OAuth consent URL."""
    if not GOOGLE_CLIENT_ID:
        logger.error("GOOGLE_CLIENT_ID is not configured in backend environment.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GOOGLE_CLIENT_ID is not configured on the backend server. Please add your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment variables.",
        )

    state_token = _encode_oauth_state({"user_id": user_id or "", "platform": "youtube"})
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(YOUTUBE_SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "true",
        "state": state_token,
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
    error_description: Optional[str] = None,
):
    """Callback handler for Google OAuth 2.0."""
    studio_base = f"{FRONTEND_URL.rstrip('/')}/studio"

    if error:
        logger.error("OAuth error received from Google: %s (description: %s)", error, error_description)
        desc = error_description or error
        return RedirectResponse(
            url=f"{studio_base}?error={urllib.parse.quote(error)}&error_description={urllib.parse.quote(desc)}"
        )

    if not code:
        logger.error("No authorization code provided in Google OAuth callback.")
        return RedirectResponse(
            url=f"{studio_base}?error=missing_auth_code&error_description={urllib.parse.quote('Google did not return an authorization code.')}"
        )

    parsed_state = _decode_oauth_state(state or "")
    user_id = parsed_state.get("user_id") or None

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
                logger.error("Token exchange failed (HTTP %d): %s", token_res.status_code, token_res.text)
                return RedirectResponse(
                    url=f"{studio_base}?error=token_exchange_failed&error_description={urllib.parse.quote('Google rejected token exchange. Verify your Client Secret.')}"
                )

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
            has_channel = False
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
                        has_channel = True
                    else:
                        logger.warning("No public YouTube channel associated with this Google account.")
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
            redirect_url = f"{studio_base}?connected=youtube&channel={encoded_name}"
            if not has_channel:
                notice = "No public YouTube channel was found on this Google account. Create a channel on YouTube to enable video uploads."
                redirect_url += f"&warning={urllib.parse.quote(notice)}"

            return RedirectResponse(url=redirect_url)

    except Exception as exc:
        logger.exception("Unexpected exception in OAuth callback: %s", exc)
        return RedirectResponse(
            url=f"{studio_base}?error=internal_oauth_error&error_description={urllib.parse.quote(str(exc))}"
        )


@router.get(
    "/tiktok/auth-url",
    response_model=SocialAuthUrlResponse,
    summary="Generate TikTok OAuth consent URL",
    description="Constructs TikTok authorization URL requesting user.info.basic, video.publish, and video.upload scopes.",
)
async def get_tiktok_auth_url(user_id: Optional[str] = None) -> SocialAuthUrlResponse:
    """Generate the TikTok OAuth consent URL."""
    if not TIKTOK_CLIENT_KEY:
        logger.error("TIKTOK_CLIENT_KEY is not configured in backend environment.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="TIKTOK_CLIENT_KEY is not configured on the backend server. Please add TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET to your environment variables.",
        )

    state_token = _encode_oauth_state({"user_id": user_id or "", "platform": "tiktok"})
    params = {
        "client_key": TIKTOK_CLIENT_KEY,
        "scope": ",".join(TIKTOK_SCOPES),
        "response_type": "code",
        "redirect_uri": TIKTOK_REDIRECT_URI,
        "state": state_token,
    }
    auth_url = f"{TIKTOK_AUTH_BASE_URL}?{urllib.parse.urlencode(params)}"
    return SocialAuthUrlResponse(auth_url=auth_url, platform="tiktok")


@router.get(
    "/tiktok/callback",
    summary="TikTok OAuth authorization callback",
    description="Exchanges authorization code for TikTok access token and refresh token, and stores them in Supabase.",
)
async def tiktok_oauth_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None,
):
    """Callback handler for TikTok OAuth."""
    studio_base = f"{FRONTEND_URL.rstrip('/')}/studio"

    if error:
        logger.warning("TikTok OAuth error callback received: %s (%s)", error, error_description)
        msg = error_description or error or "TikTok OAuth authorization was denied or canceled."
        return RedirectResponse(
            url=f"{studio_base}?social_error={urllib.parse.quote(msg)}&platform=tiktok"
        )

    if not code:
        logger.error("TikTok OAuth callback received without code parameter.")
        return RedirectResponse(
            url=f"{studio_base}?social_error=Missing+authorization+code&platform=tiktok"
        )

    state_data = _decode_oauth_state(state or "")
    user_id = state_data.get("user_id") or None

    try:
        token_payload = {
            "client_key": TIKTOK_CLIENT_KEY,
            "client_secret": TIKTOK_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": TIKTOK_REDIRECT_URI,
        }
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Cache-Control": "no-cache",
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            token_res = await client.post(
                TIKTOK_TOKEN_URL,
                data=token_payload,
                headers=headers,
            )

            if token_res.status_code != 200:
                logger.error("TikTok token exchange failed (%d): %s", token_res.status_code, token_res.text)
                return RedirectResponse(
                    url=f"{studio_base}?social_error={urllib.parse.quote('TikTok token exchange failed: ' + token_res.text)}&platform=tiktok"
                )

            token_data = token_res.json()
            data = token_data.get("data") or token_data
            access_token = data.get("access_token")
            refresh_token = data.get("refresh_token")
            expires_in = data.get("expires_in", 86400)
            open_id = data.get("open_id", "")

            if not access_token:
                err_msg = token_data.get("error_description") or token_data.get("message") or "No access token returned from TikTok"
                return RedirectResponse(
                    url=f"{studio_base}?social_error={urllib.parse.quote(str(err_msg))}&platform=tiktok"
                )

            token_expires_at = (
                datetime.now(timezone.utc) + timedelta(seconds=expires_in)
            ).isoformat()

            account_name = f"TikTok Creator (@{open_id[:8]})" if open_id else "TikTok Creator"
            try:
                user_headers = {"Authorization": f"Bearer {access_token}"}
                user_params = {"fields": "open_id,display_name,avatar_url"}
                user_res = await client.get(
                    TIKTOK_USER_INFO_URL,
                    headers=user_headers,
                    params=user_params,
                )
                if user_res.status_code == 200:
                    u_json = user_res.json()
                    u_info = (u_json.get("data") or {}).get("user", {})
                    disp = u_info.get("display_name")
                    if disp:
                        account_name = f"@{disp}"
            except Exception as e:
                logger.warning("Could not fetch TikTok user profile info: %s", e)

            upsert_social_account(
                platform="tiktok",
                account_name=account_name,
                access_token=access_token,
                refresh_token=refresh_token,
                token_expires_at=token_expires_at,
                user_id=user_id,
            )

            logger.info("Successfully connected TikTok account '%s' (User: %s)", account_name, user_id)
            encoded_name = urllib.parse.quote(account_name)
            return RedirectResponse(
                url=f"{studio_base}?connected=tiktok&channel={encoded_name}"
            )

    except Exception as exc:
        logger.exception("Unexpected exception in TikTok OAuth callback: %s", exc)
        return RedirectResponse(
            url=f"{studio_base}?social_error={urllib.parse.quote(str(exc))}&platform=tiktok"
        )


@router.get(
    "/instagram/auth-url",
    response_model=SocialAuthUrlResponse,
    summary="Generate Instagram/Meta OAuth consent URL",
    description="Constructs Meta authorization URL requesting instagram_basic, instagram_content_publish, and pages permissions.",
)
async def get_instagram_auth_url(user_id: Optional[str] = None) -> SocialAuthUrlResponse:
    """Generate the Instagram/Meta OAuth consent URL."""
    if not META_APP_ID:
        logger.error("META_APP_ID is not configured in backend environment.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="META_APP_ID is not configured on the backend server. Please add META_APP_ID and META_APP_SECRET to your environment variables.",
        )

    state_token = _encode_oauth_state({"user_id": user_id or "", "platform": "instagram"})
    params = {
        "client_id": META_APP_ID,
        "redirect_uri": INSTAGRAM_REDIRECT_URI,
        "response_type": "code",
        "scope": ",".join(INSTAGRAM_SCOPES),
        "state": state_token,
    }
    auth_url = f"{META_AUTH_BASE_URL}?{urllib.parse.urlencode(params)}"
    return SocialAuthUrlResponse(auth_url=auth_url, platform="instagram")


@router.get(
    "/instagram/callback",
    summary="Instagram/Meta OAuth authorization callback",
    description="Exchanges code for long-lived Meta token, resolves Instagram Business Account, and stores in Supabase.",
)
async def instagram_oauth_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None,
):
    """Callback handler for Instagram / Meta OAuth."""
    studio_base = f"{FRONTEND_URL.rstrip('/')}/studio"

    if error:
        logger.warning("Meta OAuth error callback received: %s (%s)", error, error_description)
        msg = error_description or error or "Instagram/Meta OAuth authorization was denied or canceled."
        return RedirectResponse(
            url=f"{studio_base}?social_error={urllib.parse.quote(msg)}&platform=instagram"
        )

    if not code:
        logger.error("Instagram OAuth callback received without code parameter.")
        return RedirectResponse(
            url=f"{studio_base}?social_error=Missing+authorization+code&platform=instagram"
        )

    state_data = _decode_oauth_state(state or "")
    user_id = state_data.get("user_id") or None

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            # 1. Exchange code for short-lived user access token
            token_params = {
                "client_id": META_APP_ID,
                "client_secret": META_APP_SECRET,
                "redirect_uri": INSTAGRAM_REDIRECT_URI,
                "code": code,
            }
            token_res = await client.get(META_TOKEN_URL, params=token_params)
            if token_res.status_code != 200:
                logger.error("Meta token exchange failed (%d): %s", token_res.status_code, token_res.text)
                return RedirectResponse(
                    url=f"{studio_base}?social_error={urllib.parse.quote('Meta token exchange failed: ' + token_res.text)}&platform=instagram"
                )

            short_token_data = token_res.json()
            short_lived_token = short_token_data.get("access_token")
            if not short_lived_token:
                return RedirectResponse(
                    url=f"{studio_base}?social_error=No+access+token+returned+from+Meta&platform=instagram"
                )

            # 2. Exchange short-lived token for 60-day long-lived access token
            extend_params = {
                "grant_type": "fb_exchange_token",
                "client_id": META_APP_ID,
                "client_secret": META_APP_SECRET,
                "fb_exchange_token": short_lived_token,
            }
            extend_res = await client.get(META_TOKEN_URL, params=extend_params)
            if extend_res.status_code == 200:
                long_token_data = extend_res.json()
                access_token = long_token_data.get("access_token", short_lived_token)
                expires_in = long_token_data.get("expires_in", 5184000)
            else:
                access_token = short_lived_token
                expires_in = short_token_data.get("expires_in", 7200)

            token_expires_at = (
                datetime.now(timezone.utc) + timedelta(seconds=expires_in)
            ).isoformat()

            # 3. Discover Instagram Business / Professional Account via Facebook Pages
            account_name = "Instagram Account"
            has_ig_business = False
            try:
                pages_res = await client.get(
                    META_ACCOUNTS_URL,
                    params={
                        "access_token": access_token,
                        "fields": "id,name,access_token,instagram_business_account{id,username,name}",
                    },
                )
                if pages_res.status_code == 200:
                    pages_data = pages_res.json().get("data", [])
                    for page in pages_data:
                        ig_account = page.get("instagram_business_account")
                        if ig_account:
                            username = ig_account.get("username") or ig_account.get("name")
                            if username:
                                account_name = f"@{username}"
                            has_ig_business = True
                            if page.get("access_token"):
                                access_token = page["access_token"]
                            break
            except Exception as e:
                logger.warning("Could not fetch Instagram account metadata: %s", e)

            upsert_social_account(
                platform="instagram",
                account_name=account_name,
                access_token=access_token,
                refresh_token=access_token,
                token_expires_at=token_expires_at,
                user_id=user_id,
            )

            logger.info("Successfully connected Instagram account '%s' (User: %s)", account_name, user_id)
            encoded_name = urllib.parse.quote(account_name)
            redirect_url = f"{studio_base}?connected=instagram&channel={encoded_name}"
            if not has_ig_business:
                notice = "No Instagram Business or Creator account was linked to your Facebook Page. Please link your Instagram account to a Facebook Page to enable automated Reels publishing."
                redirect_url += f"&warning={urllib.parse.quote(notice)}"

            return RedirectResponse(url=redirect_url)

    except Exception as exc:
        logger.exception("Unexpected exception in Instagram OAuth callback: %s", exc)
        return RedirectResponse(
            url=f"{studio_base}?social_error={urllib.parse.quote(str(exc))}&platform=instagram"
        )


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
    summary="Publish a rendered video to social platforms",
    description="Uploads a previously rendered video to YouTube Shorts, TikTok, or Instagram Reels.",
)
async def publish_video_to_social(
    job_id: str,
    payload: PublishVideoRequest = PublishVideoRequest(),
):
    """Publish a completed video to YouTube Shorts, TikTok, or Instagram Reels."""
    from api.db import get_video_job_record, update_video_job_record, get_social_accounts
    from api.services.token_manager import ensure_valid_access_token
    from engine.social.youtube_uploader import upload_video_to_youtube
    from engine.social.tiktok_uploader import upload_video_to_tiktok
    from engine.social.instagram_uploader import upload_video_to_instagram

    platform = (payload.platform or "youtube").lower()
    if platform not in ("youtube", "tiktok", "instagram"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported platform '{platform}'. Supported platforms: youtube, tiktok, instagram.",
        )

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
        if job.video_url.startswith("http") and f"{platform}.com" in job.video_url:
            return {
                "message": f"Video is already published to {platform.title()}!",
                "url": job.video_url,
                "job_id": job_id,
                "platform": platform,
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
    target_acc = next((a for a in accounts if a.get("platform") == platform), None)

    if not target_acc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No connected {platform.title()} account found. Please connect your {platform.title()} account first.",
        )

    try:
        access_token, was_refreshed = await ensure_valid_access_token(target_acc)
        title = job.topic[:100]
        desc = f"{job.topic}\n\n#Shorts #Viral"
        tags = ["shorts", "viral"]

        if platform == "youtube":
            upload_result = upload_video_to_youtube(
                video_file_path=video_path,
                title=title,
                description=desc,
                tags=tags,
                access_token=access_token,
                privacy_status=payload.privacy,
            )
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
                "platform": "youtube",
            }

        elif platform == "tiktok":
            privacy_level = "PUBLIC_TO_EVERYONE" if payload.privacy == "public" else "SELF_ONLY"
            upload_result = upload_video_to_tiktok(
                video_file_path=video_path,
                title=title,
                access_token=access_token,
                privacy_level=privacy_level,
            )
            update_video_job_record(
                job_id=job_id,
                status=job.status,
                video_url=upload_result.tiktok_url,
            )
            return {
                "status": "success",
                "message": "Video published successfully to TikTok!",
                "publish_id": upload_result.publish_id,
                "tiktok_url": upload_result.tiktok_url,
                "title": upload_result.title,
                "platform": "tiktok",
            }

        elif platform == "instagram":
            upload_result = upload_video_to_instagram(
                video_file_path=video_path,
                caption=desc,
                access_token=access_token,
            )
            update_video_job_record(
                job_id=job_id,
                status=job.status,
                video_url=upload_result.instagram_url,
            )
            return {
                "status": "success",
                "message": "Video published successfully to Instagram Reels!",
                "media_id": upload_result.media_id,
                "instagram_url": upload_result.instagram_url,
                "caption": upload_result.caption,
                "platform": "instagram",
            }

    except Exception as exc:
        logger.exception("Failed to publish video to %s: %s", platform, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{platform.title()} upload failed: {str(exc)}",
        )
