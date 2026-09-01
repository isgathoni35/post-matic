"""Tests for Supabase client configuration and database operations."""
import uuid
import pytest

from api.db import (
    IN_MEMORY_JOBS,
    create_video_job_record,
    get_supabase_client,
    get_video_job_record,
    update_video_job_record,
)
from api.schemas import VideoJobStatus
from engine.config import SUPABASE_KEY, SUPABASE_URL


@pytest.fixture(autouse=True)
def clear_in_memory_jobs():
    """Clear fallback in-memory store between tests."""
    IN_MEMORY_JOBS.clear()
    yield
    IN_MEMORY_JOBS.clear()


def test_supabase_config_loaded():
    """Verify that SUPABASE_URL and SUPABASE_KEY are loaded from environment."""
    assert SUPABASE_URL is not None and len(SUPABASE_URL) > 0
    assert "supabase.co" in SUPABASE_URL
    assert SUPABASE_KEY is not None and len(SUPABASE_KEY) > 0


def test_supabase_client_initialization():
    """Verify that Supabase client initializes without throwing errors."""
    client = get_supabase_client()
    assert client is not None


def test_db_create_and_get_video_job():
    """Verify create_video_job_record and get_video_job_record execution."""
    test_id = f"test-{uuid.uuid4()}"
    topic = "Testing Supabase DB helper functions"

    created = create_video_job_record(
        job_id=test_id,
        topic=topic,
        target_duration=30,
        voice="en-US-ChristopherNeural",
    )

    assert created.job_id == test_id
    assert created.topic == topic
    assert created.status == VideoJobStatus.PENDING

    fetched = get_video_job_record(test_id)
    assert fetched is not None
    assert fetched.job_id == test_id
    assert fetched.topic == topic


def test_db_update_video_job_status():
    """Verify update_video_job_record updates job status and progress metadata."""
    test_id = f"test-{uuid.uuid4()}"
    create_video_job_record(job_id=test_id, topic="Test Update Job")

    updated = update_video_job_record(
        job_id=test_id,
        status=VideoJobStatus.RENDERING,
        progress_pct=75,
        video_url="/output/test_video.mp4",
        duration_seconds=15.5,
        file_size_bytes=10485760,
    )

    assert updated is not None
    assert updated.status == VideoJobStatus.RENDERING
    assert updated.progress_pct == 75
    assert updated.video_url == "/output/test_video.mp4"
    assert updated.duration_seconds == 15.5
    assert updated.file_size_bytes == 10485760
