"""Tests for Instagram Graph API Reels integration, OAuth, and Token Refresh."""
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch
import uuid
from fastapi.testclient import TestClient
import pytest

from api.main import app
from api.db import IN_MEMORY_SOCIAL_ACCOUNTS, create_video_job_record, update_video_job_record, upsert_social_account
from api.schemas import VideoJobStatus
from api.services.token_manager import refresh_meta_access_token
from engine.social.instagram_uploader import InstagramUploadResult, upload_video_to_instagram

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_social_store():
    """Clear in-memory social accounts store between tests."""
    IN_MEMORY_SOCIAL_ACCOUNTS.clear()
    yield
    IN_MEMORY_SOCIAL_ACCOUNTS.clear()


def test_instagram_uploader_validations(tmp_path: Path):
    """Verify ValueError when access token is missing."""
    dummy_file = tmp_path / "video.mp4"
    dummy_file.write_bytes(b"test video data")

    with pytest.raises(ValueError, match="access_token is missing"):
        upload_video_to_instagram(video_file_path=dummy_file, caption="Test", access_token="")


def test_upload_video_to_instagram_success(tmp_path: Path):
    """Verify Instagram Reels media container creation, polling, publish and permalink."""
    video_file = tmp_path / "instagram_reel.mp4"
    video_file.write_bytes(b"0" * (1024 * 1024))  # 1MB

    # Mock container creation response
    mock_container_res = MagicMock()
    mock_container_res.status_code = 200
    mock_container_res.json.return_value = {"id": "container_12345"}

    # Mock status check response (FINISHED)
    mock_status_res = MagicMock()
    mock_status_res.status_code = 200
    mock_status_res.json.return_value = {"status_code": "FINISHED", "id": "container_12345"}

    # Mock publish response
    mock_publish_res = MagicMock()
    mock_publish_res.status_code = 200
    mock_publish_res.json.return_value = {"id": "reel_media_98765"}

    # Mock permalink response
    mock_permalink_res = MagicMock()
    mock_permalink_res.status_code = 200
    mock_permalink_res.json.return_value = {
        "id": "reel_media_98765",
        "permalink": "https://www.instagram.com/reel/Cxyz123abc/",
    }

    with patch("httpx.Client.post", side_effect=[mock_container_res, mock_publish_res]), \
         patch("httpx.Client.get", side_effect=[mock_status_res, mock_permalink_res]):

        result = upload_video_to_instagram(
            video_file_path=video_file,
            caption="Ancient Roman concrete self healing #Engineering #History",
            access_token="EAAG_mock_instagram_user_token_123",
            ig_user_id="17841400000000000",
            public_video_url="https://supabase.co/storage/v1/object/public/videos/video_123.mp4",
            poll_interval_seconds=0.01,
        )

        assert isinstance(result, InstagramUploadResult)
        assert result.media_id == "reel_media_98765"
        assert result.instagram_url == "https://www.instagram.com/reel/Cxyz123abc/"
        assert result.status == "published"
        assert "Ancient Roman" in result.caption


def test_get_instagram_auth_url():
    """Verify Meta / Instagram OAuth consent URL generation."""
    with patch("api.routers.social.META_APP_ID", "meta_app_id_test"):
        response = client.get("/api/social/instagram/auth-url?user_id=user-ig-1")
        assert response.status_code == 200
        data = response.json()
        assert data["platform"] == "instagram"
        assert "facebook.com" in data["auth_url"]
        assert "client_id=meta_app_id_test" in data["auth_url"]
        assert "instagram_content_publish" in data["auth_url"]


@pytest.mark.anyio
async def test_instagram_oauth_callback_success():
    """Verify Instagram / Meta OAuth callback exchanging token and discovering IG account."""
    # 1. Short token exchange
    mock_short_token_res = MagicMock()
    mock_short_token_res.status_code = 200
    mock_short_token_res.json.return_value = {
        "access_token": "short_lived_token_123",
        "expires_in": 7200,
    }

    # 2. Long token exchange
    mock_long_token_res = MagicMock()
    mock_long_token_res.status_code = 200
    mock_long_token_res.json.return_value = {
        "access_token": "long_lived_60_day_token_456",
        "expires_in": 5184000,
    }

    # 3. Accounts discovery
    mock_accounts_res = MagicMock()
    mock_accounts_res.status_code = 200
    mock_accounts_res.json.return_value = {
        "data": [
            {
                "id": "page_id_111",
                "name": "PostMatic Media Page",
                "access_token": "page_access_token_777",
                "instagram_business_account": {
                    "id": "ig_biz_888",
                    "username": "postmatic.creators",
                },
            }
        ]
    }

    with patch("api.routers.social.META_APP_ID", "app_123"), \
         patch("api.routers.social.META_APP_SECRET", "sec_999"), \
         patch("httpx.AsyncClient.get", side_effect=[mock_short_token_res, mock_long_token_res, mock_accounts_res]):

        response = client.get(
            "/api/social/instagram/callback?code=mock_meta_auth_code_xyz&state=%7B%22user_id%22%3A%22user-ig-1%22%7D",
            follow_redirects=False,
        )

        assert response.status_code == 307
        redirect_location = response.headers.get("location", "")
        assert "connected=instagram" in redirect_location
        assert "postmatic.creators" in redirect_location

        # Verify social account row exists
        accounts = client.get("/api/social/accounts?user_id=user-ig-1").json()
        assert len(accounts) == 1
        assert accounts[0]["platform"] == "instagram"
        assert accounts[0]["account_name"] == "@postmatic.creators"


@pytest.mark.anyio
async def test_refresh_meta_access_token():
    """Verify Meta token extension via fb_exchange_token."""
    mock_refresh_res = MagicMock()
    mock_refresh_res.status_code = 200
    mock_refresh_res.json.return_value = {
        "access_token": "EAAG_extended_60_day_token",
        "expires_in": 5184000,
    }

    with patch("httpx.AsyncClient.get", return_value=mock_refresh_res):
        res = await refresh_meta_access_token(
            current_token="EAAG_current_token",
            client_id="app_123",
            client_secret="sec_456",
        )
        assert res["access_token"] == "EAAG_extended_60_day_token"
        assert res["expires_in"] == 5184000


def test_publish_video_to_instagram_endpoint(tmp_path: Path):
    """Verify publishing video to Instagram via /api/social/publish/{job_id}."""
    job_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    create_video_job_record(job_id=job_id, topic="Roman concrete architectural marvels", user_id=user_id)

    test_video = tmp_path / f"video_{job_id}.mp4"
    test_video.write_bytes(b"dummy mp4 video bytes")

    update_video_job_record(
        job_id=job_id,
        status=VideoJobStatus.COMPLETED,
        video_url=f"/output/video_{job_id}.mp4",
    )

    upsert_social_account(
        platform="instagram",
        account_name="@postmatic.creators",
        access_token="valid_ig_token",
        refresh_token="valid_ig_token",
        user_id=user_id,
    )

    mock_upload_res = InstagramUploadResult(
        media_id="ig_media_123456",
        instagram_url="https://www.instagram.com/reel/Cabc123/",
        caption="Roman concrete architectural marvels #Shorts #Viral",
        status="published",
    )

    with patch("engine.social.instagram_uploader.upload_video_to_instagram", return_value=mock_upload_res), \
         patch("api.routers.social.OUTPUT_DIR", tmp_path), \
         patch("api.services.token_manager.ensure_valid_access_token", return_value=("valid_ig_token", False)):

        res = client.post(
            f"/api/social/publish/{job_id}",
            json={"user_id": user_id, "platform": "instagram", "privacy": "public"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        assert data["platform"] == "instagram"
        assert data["media_id"] == "ig_media_123456"
        assert "instagram.com" in data["instagram_url"]
