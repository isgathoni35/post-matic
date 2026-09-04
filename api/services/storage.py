"""Supabase Storage manager for persistent video hosting and rolling buffer lifecycle."""
from datetime import datetime, timezone, timedelta
import logging
from pathlib import Path
from typing import List, Optional

from api.db import get_supabase_client

logger = logging.getLogger("postmatic.storage")

VIDEOS_BUCKET = "videos"
MAX_VIDEO_FILE_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB max per clip


def ensure_videos_bucket_exists() -> bool:
    """Ensure the public 'videos' storage bucket exists in Supabase."""
    client = get_supabase_client()
    if not client:
        logger.warning("Supabase client unavailable. Cannot verify storage bucket.")
        return False

    try:
        buckets = client.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        if VIDEOS_BUCKET not in bucket_names:
            logger.info("Creating public storage bucket '%s'...", VIDEOS_BUCKET)
            client.storage.create_bucket(
                id=VIDEOS_BUCKET,
                name=VIDEOS_BUCKET,
                options={
                    "public": True,
                    "file_size_limit": MAX_VIDEO_FILE_SIZE_BYTES,
                    "allowed_mime_types": ["video/mp4"],
                },
            )
            logger.info("Storage bucket '%s' created successfully.", VIDEOS_BUCKET)
        return True
    except Exception as exc:
        logger.exception("Failed to ensure storage bucket '%s': %s", VIDEOS_BUCKET, exc)
        return False


def upload_video_to_supabase(video_path: Path, job_id: str) -> Optional[str]:
    """Upload a rendered .mp4 file to Supabase Storage and return its public CDN URL.

    Args:
        video_path: Local Path to the rendered .mp4 file.
        job_id: Unique UUID or identifier for the video job.

    Returns:
        Public HTTPS URL to stream or download the video, or None if failed.
    """
    client = get_supabase_client()
    if not client:
        logger.warning("Supabase client unavailable. Skipping video storage upload.")
        return None

    if not video_path.exists():
        logger.error("Video file does not exist at: %s", video_path)
        return None

    try:
        ensure_videos_bucket_exists()

        destination_name = f"video_{job_id}.mp4"
        logger.info("Uploading %s to Supabase Storage (%s)...", video_path.name, destination_name)

        with open(video_path, "rb") as f:
            client.storage.from_(VIDEOS_BUCKET).upload(
                path=destination_name,
                file=f,
                file_options={"content-type": "video/mp4", "upsert": "true"},
            )

        public_url = client.storage.from_(VIDEOS_BUCKET).get_public_url(destination_name)
        logger.info("Video successfully uploaded! Public CDN URL: %s", public_url)
        return public_url
    except Exception as exc:
        logger.exception("Failed uploading video '%s' to Supabase Storage: %s", video_path, exc)
        return None


def prune_expired_storage_videos(max_age_days: int = 7, max_videos: int = 20) -> int:
    """Purge old or excess video files from the storage bucket to protect the 1 GB free quota.

    Args:
        max_age_days: Maximum age in days before an unpinned video file is purged.
        max_videos: Maximum total number of videos to retain in the bucket.

    Returns:
        Number of purged video files.
    """
    client = get_supabase_client()
    if not client:
        return 0

    try:
        objects = client.storage.from_(VIDEOS_BUCKET).list()
        if not objects:
            return 0

        now = datetime.now(timezone.utc)
        cutoff_date = now - timedelta(days=max_age_days)

        # Sort files by creation date (oldest first)
        def parse_created_at(obj):
            created_str = obj.get("created_at")
            if not created_str:
                return datetime.min.replace(tzinfo=timezone.utc)
            try:
                return datetime.fromisoformat(created_str.replace("Z", "+00:00"))
            except Exception:
                return datetime.min.replace(tzinfo=timezone.utc)

        sorted_objects = sorted(objects, key=parse_created_at)

        files_to_delete: List[str] = []

        # 1. Identify files older than cutoff
        for obj in sorted_objects:
            obj_name = obj.get("name")
            if not obj_name:
                continue
            created_at = parse_created_at(obj)
            if created_at < cutoff_date:
                files_to_delete.append(obj_name)

        # 2. If remaining count still exceeds max_videos, prune the oldest remaining
        remaining = [obj for obj in sorted_objects if obj.get("name") not in files_to_delete]
        if len(remaining) > max_videos:
            excess_count = len(remaining) - max_videos
            for obj in remaining[:excess_count]:
                name = obj.get("name")
                if name and name not in files_to_delete:
                    files_to_delete.append(name)

        if files_to_delete:
            logger.info(
                "Lifecycle Prune: Removing %d expired/excess video files from '%s'...",
                len(files_to_delete),
                VIDEOS_BUCKET,
            )
            client.storage.from_(VIDEOS_BUCKET).remove(files_to_delete)
            return len(files_to_delete)

        return 0
    except Exception as exc:
        logger.warning("Failed pruning expired storage videos: %s", exc)
        return 0
