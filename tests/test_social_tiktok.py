"""Tests for TikTok Content Posting API integration, OAuth, and Token Refresh."""
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch
import uuid
from fastapi.testclient import TestClient
import pytest

from api.main import app
from api.db import IN_MEMORY_SOCIAL_ACCOUNTS, create_video_job_record, update_video_job_record, upsert_social_account
from api.schemas import VideoJobStatus
from api.services.token_manager import refresh_tiktok_access_token
from engine.social.tiktok_uploader import TikTokUploadResult, upload_video_to_tiktok

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_social_store():
    """Clear in-memory social accounts store between tests."""
    IN_MEMORY_SOCIAL_ACCOUNTS.clear()
    yield
    IN_MEMORY_SOCIAL_ACCOUNTS.clear()


def test_tiktok_uploader_validations(tmp_path: Path):
    """Verify ValueError and FileNotFoundError on invalid input parameters."""
    dummy_file = tmp_path / "video.mp4"
    dummy_file.write_bytes(b"test video data")

    with pytest.raises(ValueError, match="access_token is missing"):
        upload_video_to_tiktok(video_file_path=dummy_file, title="Test", access_token="")

    with pytest.raises(FileNotFoundError):
        upload_video_to_tiktok(video_file_path=Path("does_not_exist.mp4"), title="Test", access_token="tok_123")


def test_upload_video_to_tiktok_success(tmp_path: Path):
    """Verify TikTok video initialization and chunk upload."""
    video_file = tmp_path / "tiktok_vertical.mp4"
    video_file.write_bytes(b"0" * (1024 * 1024))  # 1MB file

    mock_init_res = MagicMock()
    mock_init_res.status_code = 200
    mock_init_res.json.return_value = {
        "data": {
            "publish_id": "v_pub_tiktok_abc123",
            "upload_url": "https://open-upload.tiktokapis.com/video/?upload_id=chunk_123",
        },
        "error": {"code": "ok", "message": ""},
    }

    mock_put_res = MagicMock()
    mock_put_res.status_code = 200

    with patch("httpx.Client.post", return_value=mock_init_res), \
         patch("httpx.Client.put", return_value=mock_put_res):

        result = upload_video_to_tiktok(
            video_file_path=video_file,
            title="Mind blowing fact about the Mariana Trench #Viral",
            access_token="act.tiktok_sample_access_token_123",
            privacy_level="PUBLIC_TO_EVERYONE",
        )

        assert isinstance(result, TikTokUploadResult)
        assert result.publish_id == "v_pub_tiktok_abc123"
        assert result.status == "processing"
        assert "tiktok.com" in result.tiktok_url
        assert "Mariana Trench" in result.title


def test_get_tiktok_auth_url():
    """Verify TikTok OAuth consent URL generation."""
    with patch("api.routers.social.TIKTOK_CLIENT_KEY", "tiktok_client_key_test"):
        response = client.get("/api/social/tiktok/auth-url?user_id=user-tt-1")
        assert response.status_code == 200
        data = response.json()
        assert data["platform"] == "tiktok"
        assert "tiktok.com" in data["auth_url"]
        assert "client_key=tiktok_client_key_test" in data["auth_url"]
        assert "video.publish" in data["auth_url"]


@pytest.mark.anyio
async def test_tiktok_oauth_callback_success():
    """Verify TikTok OAuth authorization callback handling."""
    mock_token_res = MagicMock()
    mock_token_res.status_code = 200
    mock_token_res.json.return_value = {
        "data": {
            "access_token": "act.tiktok_new_access_token",
            "refresh_token": "rft.tiktok_new_refresh_token",
            "expires_in": 86400,
            "open_id": "_000tiktokuser123",
        }
    }

    mock_user_res = MagicMock()
    mock_user_res.status_code = 200
    mock_user_res.json.return_value = {
        "data": {
            "user": {
                "display_name": "PostMaticCreator",
            }
        }
    }

    with patch("api.routers.social.TIKTOK_CLIENT_KEY", "key_123"), \
         patch("api.routers.social.TIKTOK_CLIENT_SECRET", "sec_456"), \
         patch("httpx.AsyncClient.post", return_value=mock_token_res), \
         patch("httpx.AsyncClient.get", return_value=mock_user_res):

        response = client.get(
            "/api/social/tiktok/callback?code=mock_tt_code_123&state=%7B%22user_id%22%3A%22user-tt-1%22%7D",
            follow_redirects=False,
        )

        assert response.status_code == 307
        redirect_location = response.headers.get("location", "")
        assert "connected=tiktok" in redirect_location
        assert "PostMaticCreator" in redirect_location

        # Verify social account row exists
        accounts = client.get("/api/social/accounts?user_id=user-tt-1").json()
        assert len(accounts) == 1
        assert accounts[0]["platform"] == "tiktok"
        assert accounts[0]["account_name"] == "@PostMaticCreator"


@pytest.mark.anyio
async def test_refresh_tiktok_access_token():
    """Verify TikTok refresh token exchange."""
    mock_refresh_res = MagicMock()
    mock_refresh_res.status_code = 200
    mock_refresh_res.json.return_value = {
        "data": {
            "access_token": "act.refreshed_tiktok_tok",
            "refresh_token": "rft.rotated_refresh_tok",
            "expires_in": 86400,
        }
    }

    with patch("httpx.AsyncClient.post", return_value=mock_refresh_res):
        res = await refresh_tiktok_access_token(
            refresh_token="rft.old_token",
            client_key="test_key",
            client_secret="test_secret",
        )
        assert res["access_token"] == "act.refreshed_tiktok_tok"
        assert res["refresh_token"] == "rft.rotated_refresh_tok"
        assert res["expires_in"] == 86400


def test_publish_video_to_tiktok_endpoint(tmp_path: Path):
    """Verify publishing video to TikTok via /api/social/publish/{job_id}."""
    job_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    create_video_job_record(job_id=job_id, topic="Ocean mysteries uncovered", user_id=user_id)

    test_video = tmp_path / f"video_{job_id}.mp4"
    test_video.write_bytes(b"dummy mp4 video bytes")

    update_video_job_record(
        job_id=job_id,
        status=VideoJobStatus.COMPLETED,
        video_url=f"/output/video_{job_id}.mp4",
    )

    upsert_social_account(
        platform="tiktok",
        account_name="@OceanFactsDaily",
        access_token="valid_tt_token",
        refresh_token="valid_tt_refresh",
        user_id=user_id,
    )

    mock_upload_res = TikTokUploadResult(
        publish_id="pub_tt_999",
        tiktok_url="https://www.tiktok.com/@OceanFactsDaily",
        title="Ocean mysteries uncovered #Shorts #Viral",
        status="processing",
    )

    with patch("engine.social.tiktok_uploader.upload_video_to_tiktok", return_value=mock_upload_res), \
         patch("api.routers.social.OUTPUT_DIR", tmp_path), \
         patch("api.services.token_manager.ensure_valid_access_token", return_value=("valid_tt_token", False)):

        res = client.post(
            f"/api/social/publish/{job_id}",
            json={"user_id": user_id, "platform": "tiktok", "privacy": "public"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        assert data["platform"] == "tiktok"
        assert data["publish_id"] == "pub_tt_999"
        assert "tiktok.com" in data["tiktok_url"]
