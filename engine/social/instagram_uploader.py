"""Instagram Graph API Reels Video Uploader."""
from dataclasses import dataclass
import logging
from pathlib import Path
import time
from typing import Optional
import httpx

from api.services.storage import upload_video_to_supabase

logger = logging.getLogger("postmatic.instagram_uploader")
META_GRAPH_BASE_URL = "https://graph.facebook.com/v20.0"


@dataclass
class InstagramUploadResult:
    """Result payload from Instagram Reels video upload."""
    media_id: str
    instagram_url: str
    caption: str
    status: str


def upload_video_to_instagram(
    video_file_path: Path,
    caption: str,
    access_token: str,
    ig_user_id: Optional[str] = None,
    public_video_url: Optional[str] = None,
    poll_interval_seconds: float = 3.0,
    max_poll_attempts: int = 20,
) -> InstagramUploadResult:
    """Publish a video reel to an Instagram Professional/Creator account via Meta Graph API.

    Args:
        video_file_path: Local Path to the rendered MP4 video.
        caption: Caption text including hashtags.
        access_token: Page access token with instagram_content_publish permission.
        ig_user_id: Instagram Business Account ID. If None, resolved dynamically.
        public_video_url: Publicly accessible URL to the video file. If None, uploads to Supabase CDN.
        poll_interval_seconds: Seconds between status polls.
        max_poll_attempts: Max polling loops before timeout.

    Returns:
        InstagramUploadResult: Metadata containing the published Instagram reel permalink.
    """
    if not access_token:
        raise ValueError("Cannot upload to Instagram: access_token is missing or empty.")

    # 1. Ensure public video URL is available (Instagram requires HTTP/HTTPS public URL)
    video_cdn_url = public_video_url
    if not video_cdn_url:
        logger.info("Uploading video to Supabase Storage CDN for Instagram ingest...")
        video_cdn_url = upload_video_to_supabase(video_file_path)

    if not video_cdn_url:
        raise RuntimeError("Instagram requires a publicly accessible video URL. Failed to upload to storage CDN.")

    logger.info("Ingesting video into Instagram Reels via CDN URL: %s", video_cdn_url)

    with httpx.Client(timeout=30.0) as client:
        resolved_ig_id = ig_user_id

        # If ig_user_id was not explicitly passed, resolve it from the token
        if not resolved_ig_id:
            logger.info("Resolving Instagram Business Account ID from access token...")
            accounts_res = client.get(
                f"{META_GRAPH_BASE_URL}/me/accounts",
                params={"access_token": access_token},
            )
            if accounts_res.status_code == 200:
                pages_data = accounts_res.json().get("data", [])
                for page in pages_data:
                    page_id = page.get("id")
                    page_tok = page.get("access_token", access_token)
                    ig_res = client.get(
                        f"{META_GRAPH_BASE_URL}/{page_id}",
                        params={"fields": "instagram_business_account", "access_token": page_tok},
                    )
                    if ig_res.status_code == 200:
                        ig_biz = ig_res.json().get("instagram_business_account")
                        if ig_biz and "id" in ig_biz:
                            resolved_ig_id = ig_biz["id"]
                            access_token = page_tok
                            break

        if not resolved_ig_id:
            raise RuntimeError(
                "Could not find an Instagram Professional Account linked to this Meta account. "
                "Ensure your Instagram account is Creator/Business and connected to a Facebook Page."
            )

        # Step 2: Create Media Container for Reel
        container_payload = {
            "media_type": "REELS",
            "video_url": video_cdn_url,
            "caption": caption[:2200],  # Instagram limit 2,200 chars
            "share_to_feed": "true",
            "access_token": access_token,
        }

        logger.info("Creating Instagram Reels media container on account %s...", resolved_ig_id)
        container_res = client.post(
            f"{META_GRAPH_BASE_URL}/{resolved_ig_id}/media",
            data=container_payload,
        )

        if container_res.status_code != 200:
            logger.error("Instagram container creation failed (HTTP %d): %s", container_res.status_code, container_res.text)
            raise RuntimeError(f"Instagram media container failed (HTTP {container_res.status_code}): {container_res.text}")

        container_id = container_res.json().get("id")
        if not container_id:
            raise RuntimeError(f"Instagram API did not return container ID: {container_res.json()}")

        logger.info("Created Instagram container ID: %s. Polling processing status...", container_id)

        # Step 3: Poll Container Status until FINISHED
        for attempt in range(max_poll_attempts):
            time.sleep(poll_interval_seconds)
            status_res = client.get(
                f"{META_GRAPH_BASE_URL}/{container_id}",
                params={"fields": "status_code", "access_token": access_token},
            )
            if status_res.status_code == 200:
                status_code = status_res.json().get("status_code")
                logger.info("Container %s status: %s (attempt %d/%d)", container_id, status_code, attempt + 1, max_poll_attempts)
                if status_code == "FINISHED":
                    break
                elif status_code == "ERROR":
                    raise RuntimeError(f"Instagram processing failed: {status_res.text}")
        else:
            logger.warning("Instagram container processing timed out after %ds, proceeding to publish attempt...", int(max_poll_attempts * poll_interval_seconds))

        # Step 4: Publish Container
        logger.info("Publishing container %s to Instagram feed...", container_id)
        publish_res = client.post(
            f"{META_GRAPH_BASE_URL}/{resolved_ig_id}/media_publish",
            data={"creation_id": container_id, "access_token": access_token},
        )

        if publish_res.status_code != 200:
            logger.error("Instagram media publish failed (HTTP %d): %s", publish_res.status_code, publish_res.text)
            raise RuntimeError(f"Instagram publishing failed: {publish_res.text}")

        media_id = publish_res.json().get("id")
        logger.info("Successfully published Reel to Instagram! Media ID: %s", media_id)

        # Step 5: Fetch permalink
        instagram_url = f"https://www.instagram.com/p/{media_id}"
        try:
            perm_res = client.get(
                f"{META_GRAPH_BASE_URL}/{media_id}",
                params={"fields": "permalink", "access_token": access_token},
            )
            if perm_res.status_code == 200:
                permalink = perm_res.json().get("permalink")
                if permalink:
                    instagram_url = permalink
        except Exception as p_err:
            logger.warning("Failed fetching Instagram permalink: %s", p_err)

        return InstagramUploadResult(
            media_id=media_id,
            instagram_url=instagram_url,
            caption=caption,
            status="published",
        )
