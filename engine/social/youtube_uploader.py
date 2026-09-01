"""YouTube Data API v3 Video Uploader with Resumable Chunked Upload."""
from dataclasses import dataclass
import json
import logging
from pathlib import Path
from typing import List, Optional
import httpx

logger = logging.getLogger("postmatic.youtube_uploader")

YOUTUBE_UPLOAD_INIT_URL = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status"


@dataclass
class YouTubeUploadResult:
    """Result payload from YouTube video upload."""
    video_id: str
    youtube_url: str
    title: str
    privacy_status: str


def upload_video_to_youtube(
    video_file_path: Path,
    title: str,
    description: str,
    tags: Optional[List[str]] = None,
    access_token: Optional[str] = None,
    privacy_status: str = "public",
    category_id: str = "24",  # 24 = Entertainment, 27 = Education
    chunk_size_bytes: int = 1024 * 1024 * 5,  # 5MB chunks
) -> YouTubeUploadResult:
    """Upload a video file to YouTube via YouTube Data API v3 resumable upload.

    Args:
        video_file_path: Local Path to the rendered MP4 video.
        title: Title of the YouTube Short / Video.
        description: Description including hashtags.
        tags: List of tag strings.
        access_token: Valid Google OAuth access token with youtube.upload scope.
        privacy_status: 'public', 'unlisted', or 'private'.
        category_id: YouTube numeric category ID.
        chunk_size_bytes: Resumable chunk upload size.

    Returns:
        YouTubeUploadResult: Details of the published video.
    """
    if not access_token:
        raise ValueError("Cannot upload to YouTube: access_token is missing or empty.")

    if not video_file_path.exists() or video_file_path.stat().st_size == 0:
        raise FileNotFoundError(f"Video file does not exist or is empty: {video_file_path}")

    file_size = video_file_path.stat().st_size
    tag_list = tags or []

    # Format title to comply with YouTube limits (max 100 chars)
    formatted_title = title[:100] if len(title) > 100 else title

    # Step 1: Initialize Resumable Upload Session
    metadata = {
        "snippet": {
            "title": formatted_title,
            "description": description,
            "tags": tag_list,
            "categoryId": category_id,
        },
        "status": {
            "privacyStatus": privacy_status,
            "selfDeclaredMadeForKids": False,
        },
    }

    init_headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Length": str(file_size),
        "X-Upload-Content-Type": "video/mp4",
    }

    logger.info("Initializing YouTube resumable upload for '%s' (%d bytes)...", formatted_title, file_size)

    with httpx.Client(timeout=30.0) as client:
        init_res = client.post(
            YOUTUBE_UPLOAD_INIT_URL,
            headers=init_headers,
            json=metadata,
        )

        if init_res.status_code != 200:
            logger.error("Failed to initiate YouTube upload session (HTTP %d): %s", init_res.status_code, init_res.text)
            raise RuntimeError(f"YouTube upload initialization failed: {init_res.text}")

        upload_session_url = init_res.headers.get("Location")
        if not upload_session_url:
            raise RuntimeError("YouTube API did not return a resumable Location header.")

        logger.info("Upload session initialized. Uploading video bytes to: %s", upload_session_url)

        # Step 2: Upload File Content (Streaming Chunks)
        with open(video_file_path, "rb") as video_file:
            offset = 0
            while offset < file_size:
                chunk = video_file.read(chunk_size_bytes)
                chunk_len = len(chunk)
                end_byte = offset + chunk_len - 1

                chunk_headers = {
                    "Content-Length": str(chunk_len),
                    "Content-Range": f"bytes {offset}-{end_byte}/{file_size}",
                    "Content-Type": "video/mp4",
                }

                upload_res = client.put(
                    upload_session_url,
                    headers=chunk_headers,
                    content=chunk,
                    timeout=120.0,
                )

                if upload_res.status_code in (200, 201):
                    # Upload complete!
                    response_data = upload_res.json()
                    video_id = response_data.get("id")
                    youtube_url = f"https://www.youtube.com/shorts/{video_id}"
                    logger.info("SUCCESS! Video published to YouTube: %s", youtube_url)
                    return YouTubeUploadResult(
                        video_id=video_id,
                        youtube_url=youtube_url,
                        title=formatted_title,
                        privacy_status=privacy_status,
                    )
                elif upload_res.status_code == 308:
                    # Incomplete chunk, continue next
                    offset += chunk_len
                    logger.debug("Uploaded chunk: %d/%d bytes", offset, file_size)
                else:
                    logger.error("YouTube chunk upload error (HTTP %d): %s", upload_res.status_code, upload_res.text)
                    raise RuntimeError(f"YouTube upload chunk failed: {upload_res.text}")

    raise RuntimeError("YouTube upload loop finished without receiving completion status.")
