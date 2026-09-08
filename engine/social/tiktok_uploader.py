"""TikTok Content Posting API Video Uploader."""
from dataclasses import dataclass
import json
import logging
from pathlib import Path
from typing import List, Optional
import httpx

logger = logging.getLogger("postmatic.tiktok_uploader")

TIKTOK_POST_INIT_URL = "https://open.tiktokapis.com/v2/post/publish/video/init/"
TIKTOK_STATUS_FETCH_URL = "https://open.tiktokapis.com/v2/post/publish/status/fetch/"


@dataclass
class TikTokUploadResult:
    """Result payload from TikTok video upload."""
    publish_id: str
    tiktok_url: str
    title: str
    status: str


def upload_video_to_tiktok(
    video_file_path: Path,
    title: str,
    access_token: str,
    privacy_level: str = "PUBLIC_TO_EVERYONE",
    disable_duet: bool = False,
    disable_stitch: bool = False,
    disable_comment: bool = False,
) -> TikTokUploadResult:
    """Upload and publish a video to TikTok via TikTok Content Posting API.

    Args:
        video_file_path: Local Path to the rendered MP4 vertical video.
        title: Post caption/title including hashtags.
        access_token: Valid TikTok creator access token with video.publish scope.
        privacy_level: 'PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', or 'SELF_ONLY'.
        disable_duet: Whether to disable duet interactions.
        disable_stitch: Whether to disable stitch interactions.
        disable_comment: Whether to disable comments on post.

    Returns:
        TikTokUploadResult: Metadata containing the publish_id and TikTok confirmation.
    """
    if not access_token:
        raise ValueError("Cannot upload to TikTok: access_token is missing or empty.")

    if not video_file_path.exists() or video_file_path.stat().st_size == 0:
        raise FileNotFoundError(f"Video file does not exist or is empty: {video_file_path}")

    file_size = video_file_path.stat().st_size
    # TikTok title limit is 150 characters
    formatted_title = title[:150] if len(title) > 150 else title

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json; charset=UTF-8",
    }

    # Step 1: Initialize Video Publish Session
    init_payload = {
        "post_info": {
            "title": formatted_title,
            "privacy_level": privacy_level,
            "disable_duet": disable_duet,
            "disable_stitch": disable_stitch,
            "disable_comment": disable_comment,
            "video_cover_timestamp_ms": 1000,
        },
        "source_info": {
            "source": "FILE_UPLOAD",
            "video_size": file_size,
            "chunk_size": file_size,
            "total_chunk_count": 1,
        },
    }

    logger.info("Initializing TikTok video publish session (size: %d bytes)...", file_size)

    with httpx.Client(timeout=30.0) as client:
        init_res = client.post(TIKTOK_POST_INIT_URL, headers=headers, json=init_payload)

        if init_res.status_code != 200:
            logger.error("TikTok publish init failed (HTTP %d): %s", init_res.status_code, init_res.text)
            raise RuntimeError(f"TikTok upload initialization failed (HTTP {init_res.status_code}): {init_res.text}")

        init_data = init_res.json()
        error_info = init_data.get("error", {})
        if error_info.get("code") != "ok":
            err_msg = error_info.get("message", "Unknown TikTok API error")
            logger.error("TikTok API error on init: %s", err_msg)
            raise RuntimeError(f"TikTok API Error: {err_msg}")

        data = init_data.get("data", {})
        publish_id = data.get("publish_id")
        upload_url = data.get("upload_url")

        if not upload_url or not publish_id:
            raise RuntimeError(f"TikTok API did not return upload_url or publish_id: {init_data}")

        # Step 2: Upload Video File Content via PUT
        logger.info("Uploading video payload to TikTok upload_url...")
        video_bytes = video_file_path.read_bytes()

        put_headers = {
            "Content-Range": f"bytes 0-{file_size - 1}/{file_size}",
            "Content-Type": "video/mp4",
        }

        put_res = client.put(upload_url, content=video_bytes, headers=put_headers, timeout=120.0)

        if put_res.status_code not in (200, 201, 204):
            logger.error("TikTok chunk upload failed (HTTP %d): %s", put_res.status_code, put_res.text)
            raise RuntimeError(f"TikTok video upload failed (HTTP {put_res.status_code}): {put_res.text}")

        logger.info("Successfully uploaded video to TikTok (publish_id=%s)!", publish_id)

        return TikTokUploadResult(
            publish_id=publish_id,
            tiktok_url="https://www.tiktok.com",
            title=formatted_title,
            status="processing",
        )
