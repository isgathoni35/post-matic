"""Tests for 1-Click Manual Trigger Override and Quick Autopilot Toggle."""
from datetime import datetime, timezone, timedelta
from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient

from api.main import app
from api.db import get_video_job_record
from engine.series_engine import (
    IN_MEMORY_SERIES,
    create_series,
    get_series,
    toggle_series_autopilot,
    trigger_series_autopilot_now,
)

client = TestClient(app)


def test_trigger_series_autopilot_now():
    """Verify manual override immediately queues next episode and advances next_post_at."""
    series = create_series(
        user_id="manual-user-1",
        title="Urban Exploration Horrors",
        niche="scary_stories",
        autopilot_enabled=True,
        post_frequency_per_day=2,
        preferred_time_utc="19:00",
        target_platforms=["youtube"],
        require_approval=False,
    )
    series_id = series["id"]

    with patch("engine.config.GEMINI_API_KEY", ""):
        with patch("api.worker.execute_video_pipeline_job"):
            result = trigger_series_autopilot_now(series_id)

    assert result["series_id"] == series_id
    assert result["episode_number"] == 1
    assert result["job_id"] is not None
    assert result["publish_youtube"] is True

    # Check that job record exists
    job = get_video_job_record(result["job_id"])
    assert job is not None
    assert job.series_id == series_id
    assert job.episode_number == 1

    # Check that next_post_at was advanced
    updated_series = get_series(series_id)
    assert updated_series is not None
    next_post_dt = datetime.fromisoformat(updated_series["next_post_at"])
    now = datetime.now(timezone.utc)
    assert next_post_dt > now
    assert updated_series["last_posted_at"] is not None


def test_api_trigger_series_endpoint():
    """Verify HTTP POST /api/series/{series_id}/autopilot/trigger."""
    series = create_series(
        user_id="manual-user-2",
        title="Mythic Titans",
        niche="mythology",
        autopilot_enabled=True,
    )
    series_id = series["id"]

    with patch("engine.config.GEMINI_API_KEY", ""):
        with patch("api.worker.execute_video_pipeline_job"):
            res = client.post(f"/api/series/{series_id}/autopilot/trigger")

    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "dispatched"
    assert "job" in data
    assert data["job"]["series_id"] == series_id
    assert data["job"]["episode_number"] == 1


def test_toggle_series_autopilot():
    """Verify quick toggle turns autopilot on/off and recalculates next_post_at."""
    series = create_series(
        user_id="manual-user-3",
        title="Heist Chronicles",
        niche="heists",
        autopilot_enabled=False,
        preferred_time_utc="20:00",
    )
    series_id = series["id"]
    assert series["autopilot_enabled"] is False
    assert series["next_post_at"] is None

    # Toggle to True
    active_series = toggle_series_autopilot(series_id, enabled=True)
    assert active_series["autopilot_enabled"] is True
    assert active_series["next_post_at"] is not None

    # Toggle to False
    disabled_series = toggle_series_autopilot(series_id, enabled=False)
    assert disabled_series["autopilot_enabled"] is False
    assert disabled_series["next_post_at"] is None

    # Verify HTTP endpoint PATCH /api/series/{series_id}/autopilot/toggle
    res_api = client.patch(f"/api/series/{series_id}/autopilot/toggle?enabled=true")
    assert res_api.status_code == 200
    assert res_api.json()["autopilot_enabled"] is True
    assert res_api.json()["next_post_at"] is not None
