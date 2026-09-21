"""GitHub Actions Cloud Compute Dispatcher Service."""
import logging
from typing import Any, Dict, Optional
import httpx

from engine.config import GITHUB_PAT, GITHUB_REPO

logger = logging.getLogger("postmatic.github_dispatcher")

GITHUB_API_BASE = "https://api.github.com"


def is_github_dispatch_enabled() -> bool:
    """Check if GitHub Actions cloud compute offloading is configured."""
    return bool(GITHUB_PAT and GITHUB_REPO)


async def dispatch_github_render_job(
    job_id: str,
    topic: str,
    duration: int = 25,
    voice: Optional[str] = None,
    user_id: Optional[str] = None,
    publish_youtube: bool = False,
    privacy: str = "public",
    video_format: str = "short",
    target_platform: str = "youtube",
    mode: str = "shorts",
    story_style: str = "anime",
    characters: Optional[Any] = None,
) -> bool:
    """Trigger the GitHub Actions workflow via repository_dispatch to offload heavy rendering.

    Args:
        job_id: Unique Supabase video_job UUID.
        topic: Prompt or theme for the video.
        duration: Target video duration in seconds.
        voice: Neural voice name or alias.
        user_id: UUID of user creating the job.
        publish_youtube: Whether to auto-upload to YouTube Shorts after rendering.
        privacy: YouTube privacy status ('public', 'unlisted', 'private').
        video_format: 'short' (9:16) or 'long' (16:9).
        target_platform: 'youtube', 'tiktok', or 'instagram'.
        mode: 'shorts' or 'story'.
        story_style: 'anime', 'donghua', 'stickman', or '3d_cartoon'.
        characters: Optional list of custom character models or dicts.

    Returns:
        bool: True if dispatch was successfully received by GitHub (HTTP 204).
    """
    if not is_github_dispatch_enabled():
        raise ValueError(
            "GitHub Actions dispatch is not enabled. GITHUB_PAT or GITHUB_REPO is missing from environment."
        )

    dispatch_url = f"{GITHUB_API_BASE}/repos/{GITHUB_REPO}/dispatches"
    headers = {
        "Authorization": f"Bearer {GITHUB_PAT}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "PostMatic-Dispatcher/1.0",
    }

    serialized_characters = []
    if characters:
        for c in characters:
            if hasattr(c, "model_dump"):
                serialized_characters.append(c.model_dump())
            elif isinstance(c, dict):
                serialized_characters.append(c)

    payload = {
        "event_type": "render_video",
        "client_payload": {
            "job_id": job_id,
            "topic": topic,
            "duration": duration,
            "voice": voice or "en-US-ChristopherNeural",
            "user_id": user_id or "",
            "publish_youtube": bool(publish_youtube),
            "privacy": privacy or "public",
            "video_format": video_format or "short",
            "target_platform": target_platform or "youtube",
            "mode": mode or "shorts",
            "story_style": story_style or "anime",
            "characters": serialized_characters,
        },
    }

    logger.info(
        "Dispatching render job '%s' to GitHub Actions (%s, mode: %s, style: %s)...",
        job_id,
        GITHUB_REPO,
        mode,
        story_style,
    )

    async with httpx.AsyncClient(timeout=20.0) as client:
        res = await client.post(dispatch_url, headers=headers, json=payload)

        if res.status_code == 204:
            logger.info("Successfully dispatched job '%s' to GitHub Actions runner!", job_id)
            return True

        logger.error(
            "Failed to dispatch to GitHub (HTTP %d): %s",
            res.status_code,
            res.text,
        )
        raise RuntimeError(
            f"GitHub dispatch failed (HTTP {res.status_code}): {res.text}"
        )
