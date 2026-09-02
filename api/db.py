"""Database layer for Supabase PostgreSQL integration and fallback job store."""
from datetime import datetime, timezone
import logging
from typing import Any, Dict, Optional
from supabase import Client, create_client

from api.schemas import VideoJobResponse, VideoJobStatus
from engine.config import SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL

logger = logging.getLogger(__name__)

# Singleton Supabase client instance
_supabase_client: Optional[Client] = None

# Fallback in-memory DB when tables do not exist yet or in unit test mode
IN_MEMORY_JOBS: Dict[str, VideoJobResponse] = {}


def get_supabase_client() -> Optional[Client]:
    """Initialize and return the Supabase client singleton."""
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    key_to_use = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY
    if SUPABASE_URL and key_to_use:
        try:
            _supabase_client = create_client(SUPABASE_URL, key_to_use)
            logger.info("Supabase client initialized successfully with service/admin key.")
            return _supabase_client
        except Exception as e:
            logger.error("Failed to initialize Supabase client: %s", e)
            return None
    return None


def get_iso_now() -> str:
    """Get current UTC time in ISO 8601 string format."""
    return datetime.now(timezone.utc).isoformat()


def create_video_job_record(
    job_id: str,
    topic: str,
    target_duration: int = 25,
    voice: Optional[str] = None,
    user_id: Optional[str] = None,
) -> VideoJobResponse:
    """Create a new video job record in Supabase (with fallback to in-memory store)."""
    now_str = get_iso_now()
    job_data = VideoJobResponse(
        job_id=job_id,
        topic=topic,
        status=VideoJobStatus.PENDING,
        progress_pct=0,
        created_at=now_str,
        updated_at=now_str,
    )

    client = get_supabase_client()
    if client:
        try:
            record = {
                "id": job_id,
                "topic": topic,
                "target_duration": target_duration,
                "voice": voice,
                "status": VideoJobStatus.PENDING.value,
                "progress_pct": 0,
                "user_id": user_id,
                "created_at": now_str,
                "updated_at": now_str,
            }
            res = client.table("video_jobs").insert(record).execute()
            if res.data:
                logger.info("Created Supabase video_job record: %s", job_id)
        except Exception as e:
            logger.warning("Supabase table insert failed (using fallback): %s", e)

    # Store in-memory as well for fallback / fast response
    IN_MEMORY_JOBS[job_id] = job_data
    return job_data


def get_video_job_record(job_id: str) -> Optional[VideoJobResponse]:
    """Retrieve a video job status by job_id from Supabase (or fallback store)."""
    client = get_supabase_client()
    if client:
        try:
            res = client.table("video_jobs").select("*").eq("id", job_id).execute()
            if res.data and len(res.data) > 0:
                row = res.data[0]
                return VideoJobResponse(
                    job_id=row["id"],
                    topic=row["topic"],
                    status=VideoJobStatus(row["status"]),
                    progress_pct=row.get("progress_pct", 0),
                    created_at=row.get("created_at", get_iso_now()),
                    updated_at=row.get("updated_at", get_iso_now()),
                    video_url=row.get("video_url"),
                    duration_seconds=row.get("duration_seconds"),
                    file_size_bytes=row.get("file_size_bytes"),
                    error_message=row.get("error_message"),
                )
        except Exception as e:
            logger.warning("Supabase table fetch failed (using fallback): %s", e)

    return IN_MEMORY_JOBS.get(job_id)


def update_video_job_record(
    job_id: str,
    status: VideoJobStatus,
    progress_pct: Optional[int] = None,
    video_url: Optional[str] = None,
    duration_seconds: Optional[float] = None,
    file_size_bytes: Optional[int] = None,
    script_data: Optional[Dict[str, Any]] = None,
    error_message: Optional[str] = None,
) -> Optional[VideoJobResponse]:
    """Update job status and metadata in Supabase (and in-memory store)."""
    now_str = get_iso_now()

    # Update in-memory fallback store
    job = IN_MEMORY_JOBS.get(job_id)
    if job:
        job.status = status
        job.updated_at = now_str
        if progress_pct is not None:
            job.progress_pct = progress_pct
        if video_url is not None:
            job.video_url = video_url
        if duration_seconds is not None:
            job.duration_seconds = duration_seconds
        if file_size_bytes is not None:
            job.file_size_bytes = file_size_bytes
        if error_message is not None:
            job.error_message = error_message

    client = get_supabase_client()
    if client:
        try:
            update_data: Dict[str, Any] = {
                "status": status.value,
                "updated_at": now_str,
            }
            if progress_pct is not None:
                update_data["progress_pct"] = progress_pct
            if video_url is not None:
                update_data["video_url"] = video_url
            if duration_seconds is not None:
                update_data["duration_seconds"] = duration_seconds
            if file_size_bytes is not None:
                update_data["file_size_bytes"] = file_size_bytes
            if script_data is not None:
                update_data["script_data"] = script_data
            if error_message is not None:
                update_data["error_message"] = error_message

            client.table("video_jobs").update(update_data).eq("id", job_id).execute()
            logger.info("Updated Supabase video_jobs record '%s' to status '%s'", job_id, status.value)
        except Exception as e:
            logger.warning("Supabase table update failed (using fallback): %s", e)

    return IN_MEMORY_JOBS.get(job_id)


# Fallback in-memory social accounts store
IN_MEMORY_SOCIAL_ACCOUNTS: Dict[str, Dict[str, Any]] = {}


def upsert_social_account(
    platform: str,
    account_name: str,
    access_token: str,
    refresh_token: Optional[str] = None,
    token_expires_at: Optional[str] = None,
    user_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Upsert social account OAuth credentials into Supabase (or fallback in-memory store)."""
    import uuid
    now_str = get_iso_now()
    account_id = str(uuid.uuid4())

    record = {
        "id": account_id,
        "user_id": user_id,
        "platform": platform,
        "account_name": account_name,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_expires_at": token_expires_at,
        "created_at": now_str,
        "updated_at": now_str,
    }

    # Check in-memory store for existing account matching platform (+ user_id)
    for existing_id, existing_acc in IN_MEMORY_SOCIAL_ACCOUNTS.items():
        if existing_acc.get("platform") == platform:
            if user_id is None or existing_acc.get("user_id") == user_id:
                account_id = existing_id
                record["id"] = account_id
                if refresh_token is None and existing_acc.get("refresh_token"):
                    record["refresh_token"] = existing_acc["refresh_token"]
                break

    client = get_supabase_client()
    if client:
        try:
            # Check if an existing account exists for user + platform
            query = client.table("social_accounts").select("id, refresh_token").eq("platform", platform)
            if user_id:
                query = query.eq("user_id", user_id)
            existing = query.execute()

            if existing.data and len(existing.data) > 0:
                account_id = existing.data[0]["id"]
                record["id"] = account_id
                # Preserve existing refresh token if not provided in update
                if refresh_token is None and existing.data[0].get("refresh_token"):
                    record["refresh_token"] = existing.data[0]["refresh_token"]
                client.table("social_accounts").update(record).eq("id", account_id).execute()
                logger.info("Updated existing social_account record for platform '%s' (id=%s)", platform, account_id)
            else:
                client.table("social_accounts").insert(record).execute()
                logger.info("Inserted new social_account record for platform '%s' (id=%s)", platform, account_id)
        except Exception as e:
            logger.warning("Supabase social_accounts upsert failed (using in-memory fallback): %s", e)

    # Store in-memory fallback
    IN_MEMORY_SOCIAL_ACCOUNTS[account_id] = record
    return record


def get_social_accounts(user_id: Optional[str] = None) -> list:
    """Retrieve connected social accounts for a user."""
    client = get_supabase_client()
    if client:
        try:
            query = client.table("social_accounts").select("*")
            if user_id:
                query = query.eq("user_id", user_id)
            res = query.order("created_at", desc=True).execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.warning("Supabase social_accounts query failed (using in-memory fallback): %s", e)

    results = []
    for acc in IN_MEMORY_SOCIAL_ACCOUNTS.values():
        if user_id is None or acc.get("user_id") == user_id:
            results.append(acc)
    return results


def delete_social_account(account_id: str, user_id: Optional[str] = None) -> bool:
    """Delete a connected social account record."""
    client = get_supabase_client()
    if client:
        try:
            query = client.table("social_accounts").delete().eq("id", account_id)
            if user_id:
                query = query.eq("user_id", user_id)
            query.execute()
            logger.info("Deleted social_account with id %s from Supabase", account_id)
        except Exception as e:
            logger.warning("Supabase social_accounts delete failed: %s", e)

    if account_id in IN_MEMORY_SOCIAL_ACCOUNTS:
        del IN_MEMORY_SOCIAL_ACCOUNTS[account_id]
        return True
    return True
