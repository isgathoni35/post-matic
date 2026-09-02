"""Tests for FastAPI backend application and endpoints."""
from fastapi.testclient import TestClient
import pytest

from api.db import IN_MEMORY_JOBS
from api.main import app

client = TestClient(app)


from unittest.mock import patch

@pytest.fixture(autouse=True)
def clear_jobs_db():
    """Reset the in-memory jobs store and mock worker execution for fast API tests."""
    IN_MEMORY_JOBS.clear()
    with patch("api.routers.video.execute_video_pipeline_job"):
        yield
    IN_MEMORY_JOBS.clear()


def test_root_endpoint():
    """Verify that / endpoint returns 200 OK and valid service links."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["service"] == "PostMatic Video Engine API"
    assert data["documentation"] == "/docs"
    assert data["health_check"] == "/health"
    assert "timestamp" in data


def test_health_check():
    """Verify that /health endpoint returns 200 OK and valid service info."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "postmatic-api"
    assert "cloud_compute_offload" in data
    assert "timestamp" in data


def test_generate_video_job_success():
    """Verify that POST /api/video/generate creates a new video job."""
    payload = {
        "topic": "3 mind-blowing facts about black holes",
        "duration": 20,
        "voice": "guy",
        "words_per_subtitle_line": 3,
    }
    response = client.post("/api/video/generate", json=payload)
    assert response.status_code == 202
    data = response.json()

    assert "job_id" in data
    assert len(data["job_id"]) > 0
    assert data["topic"] == payload["topic"]
    assert data["status"] == "pending"
    assert data["progress_pct"] == 0
    assert "created_at" in data
    assert "updated_at" in data

    # Verify stored in fallback DB
    assert data["job_id"] in IN_MEMORY_JOBS


def test_generate_video_job_validation_error():
    """Verify input validation rules on POST /api/video/generate."""
    # Topic too short (< 3 chars)
    resp1 = client.post("/api/video/generate", json={"topic": "hi", "duration": 20})
    assert resp1.status_code == 422

    # Duration out of bounds (< 10 seconds)
    resp2 = client.post("/api/video/generate", json={"topic": "Valid Topic Here", "duration": 5})
    assert resp2.status_code == 422


def test_get_video_job_status_success():
    """Verify GET /api/video/status/{job_id} retrieves status of an existing job."""
    create_resp = client.post(
        "/api/video/generate",
        json={"topic": "Secrets of the Pyramids", "duration": 30},
    )
    assert create_resp.status_code == 202
    job_id = create_resp.json()["job_id"]

    status_resp = client.get(f"/api/video/status/{job_id}")
    assert status_resp.status_code == 200
    data = status_resp.json()
    assert data["job_id"] == job_id
    assert data["topic"] == "Secrets of the Pyramids"
    assert data["status"] == "pending"


def test_get_video_job_status_not_found():
    """Verify GET /api/video/status/{job_id} returns 404 for unknown job ID."""
    response = client.get("/api/video/status/non-existent-job-12345")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
