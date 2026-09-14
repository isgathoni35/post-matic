"""Tests for background worker execution and Supabase status updates."""
from unittest.mock import MagicMock, patch
import uuid
from fastapi.testclient import TestClient
import pytest

from api.db import IN_MEMORY_JOBS, get_video_job_record
from api.main import app
from api.schemas import VideoJobStatus
from engine.schema import Scene, VideoScript
from api.worker import execute_video_pipeline_job
from engine.tts_engine import SceneAudioResult, TTSResult

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_db():
    """Reset the in-memory jobs store before each test."""
    IN_MEMORY_JOBS.clear()
    yield
    IN_MEMORY_JOBS.clear()


@patch("api.worker.is_github_dispatch_enabled", return_value=False)
@patch("api.worker.render_video")
@patch("api.worker.fetch_script_media")
@patch("api.worker.synthesize_script")
@patch("api.worker.generate_script")
def test_execute_video_pipeline_job_success(
    mock_gen_script,
    mock_synth_script,
    mock_fetch_media,
    mock_render_video,
    mock_dispatch_enabled,
    tmp_path,
):

    """Verify background worker status transitions on successful video generation."""
    job_id = str(uuid.uuid4())
    topic = "Test Worker Topic"

    # Initialize record first (mimics API endpoint action)
    from api.db import create_video_job_record
    create_video_job_record(job_id=job_id, topic=topic, target_duration=15)

    # Set up mocks
    dummy_script = VideoScript(
        title="Worker Test Title",
        description="Test description",
        tags=["worker", "test"],
        scenes=[
            Scene(
                scene_id=1,
                narration="narration 1",
                visual_description="visual 1",
                search_keywords=["kw1"],
            )
        ],
    )
    mock_gen_script.return_value = dummy_script

    audio_file = tmp_path / "test.mp3"
    audio_file.write_bytes(b"dummy audio")
    sub_file = tmp_path / "test.ass"
    sub_file.write_text("[Script Info]", encoding="utf-8")

    dummy_tts = TTSResult(
        audio_path=audio_file,
        subtitle_path=sub_file,
        total_duration=10.0,
        scene_results=[
            SceneAudioResult(
                scene_id=1,
                audio_path=audio_file,
                duration=10.0,
                words=[],
            )
        ],
    )
    mock_synth_script.return_value = dummy_tts

    dummy_vid = tmp_path / "output.mp4"
    dummy_vid.write_bytes(b"x" * 100000)
    mock_fetch_media.return_value = []
    mock_render_video.return_value = dummy_vid

    # Run worker function
    execute_video_pipeline_job(job_id=job_id, topic=topic, target_duration=15)

    # Verify final state
    job = get_video_job_record(job_id)
    assert job is not None
    assert job.status == VideoJobStatus.COMPLETED
    assert job.progress_pct == 100
    assert job.video_url.startswith("http") or job.video_url == f"/output/video_{job_id}.mp4"
    assert job.duration_seconds == 10.0
    assert job.file_size_bytes == 100000


@patch("api.worker.is_github_dispatch_enabled", return_value=False)
@patch("api.worker.generate_script")
def test_execute_video_pipeline_job_failure(mock_gen_script, mock_dispatch_enabled):
    """Verify background worker handles exception and marks job status as failed."""
    job_id = str(uuid.uuid4())
    topic = "Failing Job Topic"

    from api.db import create_video_job_record
    create_video_job_record(job_id=job_id, topic=topic, target_duration=15)

    mock_gen_script.side_effect = RuntimeError("API key quota exceeded")

    execute_video_pipeline_job(job_id=job_id, topic=topic, target_duration=15)

    job = get_video_job_record(job_id)
    assert job is not None
    assert job.status == VideoJobStatus.FAILED

    assert "API key quota exceeded" in job.error_message


def test_api_generate_triggers_background_task():
    """Verify POST /api/video/generate enqueues background task."""
    with patch("api.routers.video.execute_video_pipeline_job") as mock_worker:
        response = client.post(
            "/api/video/generate",
            json={"topic": "Black hole physics", "duration": 20},
        )
        assert response.status_code == 202
        data = response.json()
        job_id = data["job_id"]

        assert data["status"] == "pending"
        mock_worker.assert_called_once_with(
            job_id=job_id,
            topic="Black hole physics",
            target_duration=20,
            voice=None,
            user_id=None,
            publish_youtube=False,
            privacy="public",
            video_format="short",
            target_platform="youtube",
            mode="shorts",
            story_style="anime",
            characters=None,
        )


@patch("api.worker.dispatch_github_render_job")
@patch("api.worker.is_github_dispatch_enabled", return_value=True)
def test_execute_video_pipeline_job_dispatches_to_github(mock_enabled, mock_dispatch):
    """Verify that when GitHub dispatch is enabled, worker triggers GitHub Actions."""
    job_id = str(uuid.uuid4())
    topic = "Deep Ocean Secrets"

    from api.db import create_video_job_record
    create_video_job_record(job_id=job_id, topic=topic, target_duration=25)

    execute_video_pipeline_job(
        job_id=job_id,
        topic=topic,
        target_duration=25,
        voice="guy",
        user_id="usr-99",
        publish_youtube=True,
        privacy="unlisted",
        video_format="short",
        target_platform="youtube",
    )

    mock_dispatch.assert_called_once_with(
        job_id=job_id,
        topic=topic,
        duration=25,
        voice="guy",
        user_id="usr-99",
        publish_youtube=True,
        privacy="unlisted",
        video_format="short",
        target_platform="youtube",
    )


@patch("api.worker.dispatch_github_render_job")
@patch("api.worker.is_github_dispatch_enabled", return_value=True)
def test_execute_video_pipeline_job_dispatches_long_format_to_github(mock_enabled, mock_dispatch):
    """Verify that when long video format is specified, it forwards video_format='long'."""
    job_id = str(uuid.uuid4())
    topic = "The Rise and Fall of Rome"

    from api.db import create_video_job_record
    create_video_job_record(job_id=job_id, topic=topic, target_duration=60, video_format="long")

    execute_video_pipeline_job(
        job_id=job_id,
        topic=topic,
        target_duration=60,
        voice="eric",
        user_id="usr-100",
        publish_youtube=True,
        privacy="public",
        video_format="long",
        target_platform="youtube",
    )

    mock_dispatch.assert_called_once_with(
        job_id=job_id,
        topic=topic,
        duration=60,
        voice="eric",
        user_id="usr-100",
        publish_youtube=True,
        privacy="public",
        video_format="long",
        target_platform="youtube",
    )
