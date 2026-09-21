"""Comprehensive unit and integration test suite for Zero-OpEx Autonomous Daily Autopilot Scheduler."""
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from api.main import app
from api.schemas import AutopilotDispatchResponse
from api.db import get_video_job_record
import engine.config as config
from engine.series_engine import (
    IN_MEMORY_SERIES,
    calculate_initial_next_post_at,
    calculate_next_post_at,
    create_series,
    dispatch_due_autopilot_series,
    generate_next_episode_concept,
    get_series,
)

client = TestClient(app)


def test_calculate_next_post_at_daily():
    """Verify 1 post per day calculates next calendar day at preferred UTC hour."""
    base_time = datetime(2026, 9, 21, 19, 0, 0, tzinfo=timezone.utc)
    next_ts_str = calculate_next_post_at(post_frequency_per_day=1, preferred_time_utc="18:00", from_time=base_time)
    next_dt = datetime.fromisoformat(next_ts_str)

    assert next_dt.day == 22
    assert next_dt.hour == 18
    assert next_dt.minute == 0
    assert next_dt > base_time


def test_calculate_next_post_at_multi_frequency():
    """Verify 2 posts/day (+12h) and 3 posts/day (+8h) calculations."""
    base_time = datetime(2026, 9, 21, 10, 0, 0, tzinfo=timezone.utc)

    # 2 posts per day -> 12 hours later
    ts_2 = calculate_next_post_at(post_frequency_per_day=2, preferred_time_utc="18:00", from_time=base_time)
    dt_2 = datetime.fromisoformat(ts_2)
    assert dt_2 == base_time + timedelta(hours=12)

    # 3 posts per day -> 8 hours later
    ts_3 = calculate_next_post_at(post_frequency_per_day=3, preferred_time_utc="18:00", from_time=base_time)
    dt_3 = datetime.fromisoformat(ts_3)
    assert dt_3 == base_time + timedelta(hours=8)


def test_calculate_initial_next_post_at():
    """Verify initial schedule computation for upcoming time."""
    now = datetime.now(timezone.utc)
    ts = calculate_initial_next_post_at(preferred_time_utc="23:59", post_frequency_per_day=1)
    dt = datetime.fromisoformat(ts)
    assert dt > now


def test_generate_next_episode_concept_fallback():
    """Verify procedural concept generation when Gemini is unconfigured or offline."""
    dummy_series = {
        "title": "Deep Ocean Horrors",
        "niche": "scary_stories",
        "genre": "Horror",
        "bible_json": {
            "title": "Deep Ocean Horrors",
            "niche": "scary_stories",
            "premise": "Mysteries found in the Mariana Trench.",
        },
    }

    with patch("engine.config.GEMINI_API_KEY", ""):
        concept = generate_next_episode_concept(dummy_series, next_episode_num=2)
        assert "title" in concept
        assert "topic" in concept
        assert "Episode 2" in concept["title"]
        assert "Deep Ocean Horrors" in concept["topic"]


def test_generate_next_episode_concept_gemini_success():
    """Verify Gemini AI generates structured episode title and hook topic."""
    dummy_series = {
        "title": "Cosmic Heists",
        "niche": "heists",
        "genre": "Sci-Fi",
        "bible_json": {"title": "Cosmic Heists"},
    }

    mock_response = MagicMock()
    mock_response.text = '{"title": "Episode 3: The Lunar Vault", "topic": "In 2088, thieves hacked the orbital laser grid to breach the Lunar Vault."}'

    with patch("engine.config.GEMINI_API_KEY", "dummy_key"):
        with patch("google.genai.Client") as mock_client_cls:
            mock_client = MagicMock()
            mock_client.models.generate_content.return_value = mock_response
            mock_client_cls.return_value = mock_client

            concept = generate_next_episode_concept(dummy_series, next_episode_num=3)
            assert concept["title"] == "Episode 3: The Lunar Vault"
            assert "Lunar Vault" in concept["topic"]


def test_dispatch_due_autopilot_series():
    """Verify dispatcher evaluates series due for posting, creates jobs, and advances schedule."""
    now = datetime.now(timezone.utc)
    past_due_time = (now - timedelta(hours=2)).isoformat()
    future_time = (now + timedelta(hours=10)).isoformat()

    # 1. Due Series (autopilot=True, next_post_at in past)
    due_series = create_series(
        user_id="user-auto-1",
        title="Creepypasta Chronicles",
        niche="scary_stories",
        autopilot_enabled=True,
        post_frequency_per_day=1,
        preferred_time_utc="18:00",
        target_platforms=["youtube"],
        require_approval=False,
    )
    due_series["next_post_at"] = past_due_time
    due_series["bible_json"]["next_post_at"] = past_due_time
    IN_MEMORY_SERIES[due_series["id"]] = due_series

    # 2. Disabled Series (autopilot=False)
    disabled_series = create_series(
        user_id="user-auto-2",
        title="Disabled Series",
        niche="dark_history",
        autopilot_enabled=False,
    )
    disabled_series["next_post_at"] = past_due_time
    IN_MEMORY_SERIES[disabled_series["id"]] = disabled_series

    # 3. Future Series (autopilot=True, next_post_at in future)
    future_series = create_series(
        user_id="user-auto-3",
        title="Future Series",
        niche="mythology",
        autopilot_enabled=True,
    )
    future_series["next_post_at"] = future_time
    IN_MEMORY_SERIES[future_series["id"]] = future_series

    # Run dispatch
    with patch("engine.config.GEMINI_API_KEY", ""):
        result = dispatch_due_autopilot_series()

    assert result["checked_count"] >= 2  # due and future series
    assert result["dispatched_count"] >= 1

    # Verify due series was dispatched
    dispatched_ids = [job["series_id"] for job in result["dispatched_jobs"]]
    assert due_series["id"] in dispatched_ids
    assert disabled_series["id"] not in dispatched_ids
    assert future_series["id"] not in dispatched_ids

    # Find the job details
    dispatched_info = next(j for j in result["dispatched_jobs"] if j["series_id"] == due_series["id"])
    assert dispatched_info["episode_number"] == 1
    assert dispatched_info["publish_youtube"] is True

    # Verify video job was created in DB/memory
    job_record = get_video_job_record(dispatched_info["job_id"])
    assert job_record is not None
    assert job_record.series_id == due_series["id"]
    assert job_record.episode_number == 1

    # Verify next_post_at was advanced into the future
    updated_series = get_series(due_series["id"])
    assert updated_series is not None
    next_post_dt = datetime.fromisoformat(updated_series["next_post_at"])
    assert next_post_dt > now
    assert updated_series["last_posted_at"] is not None


def test_api_autopilot_dispatch_endpoint():
    """Verify HTTP POST /api/series/autopilot/dispatch triggers worker and returns AutopilotDispatchResponse."""
    with patch("engine.config.AUTOPILOT_SECRET", ""):
        with patch("engine.config.GEMINI_API_KEY", ""):
            response = client.post("/api/series/autopilot/dispatch")

    assert response.status_code == 200
    data = response.json()
    assert "checked_count" in data
    assert "dispatched_count" in data
    assert "dispatched_jobs" in data
    assert isinstance(data["dispatched_jobs"], list)


def test_api_autopilot_dispatch_secret_protection():
    """Verify X-Autopilot-Secret header authorization enforcement when AUTOPILOT_SECRET is set."""
    with patch("api.routers.series.AUTOPILOT_SECRET", "super_secret_token_123"):
        # 1. Missing header -> 401
        res_missing = client.post("/api/series/autopilot/dispatch")
        assert res_missing.status_code == 401

        # 2. Wrong header -> 401
        res_wrong = client.post(
            "/api/series/autopilot/dispatch",
            headers={"X-Autopilot-Secret": "wrong_token"},
        )
        assert res_wrong.status_code == 401

        # 3. Correct header -> 200
        with patch("engine.config.GEMINI_API_KEY", ""):
            res_valid = client.post(
                "/api/series/autopilot/dispatch",
                headers={"X-Autopilot-Secret": "super_secret_token_123"},
            )
            assert res_valid.status_code == 200
            assert "dispatched_count" in res_valid.json()
