"""Tests for YouTube Data API v3 Video Uploader."""
from pathlib import Path
from unittest.mock import MagicMock, patch
import pytest

from engine.social.youtube_uploader import (
    YouTubeUploadResult,
    upload_video_to_youtube,
)


def test_upload_missing_access_token(tmp_path: Path):
    """Verify ValueError is raised when access token is missing."""
    dummy_file = tmp_path / "test.mp4"
    dummy_file.write_bytes(b"dummy data")

    with pytest.raises(ValueError, match="access_token is missing"):
        upload_video_to_youtube(
            video_file_path=dummy_file,
            title="Test",
            description="Test",
            access_token=None,
        )


def test_upload_missing_video_file():
    """Verify FileNotFoundError is raised when video file does not exist."""
    non_existent = Path("non_existent_file_123.mp4")

    with pytest.raises(FileNotFoundError):
        upload_video_to_youtube(
            video_file_path=non_existent,
            title="Test",
            description="Test",
            access_token="mock_token",
        )


def test_upload_video_to_youtube_success(tmp_path: Path):
    """Verify complete resumable chunked upload flow."""
    video_file = tmp_path / "short_video.mp4"
    # Create 1MB test file
    video_file.write_bytes(b"0" * (1024 * 1024))

    mock_init_res = MagicMock()
    mock_init_res.status_code = 200
    mock_init_res.headers = {"Location": "https://www.googleapis.com/upload/youtube/v3/videos?upload_id=session_123"}

    mock_chunk_res = MagicMock()
    mock_chunk_res.status_code = 200
    mock_chunk_res.json.return_value = {
        "id": "dQw4w9WgXcQ",
        "snippet": {
            "title": "Amazing Ocean Fact #Shorts",
        },
    }

    with patch("httpx.Client.post", return_value=mock_init_res), \
         patch("httpx.Client.put", return_value=mock_chunk_res):
        
        result = upload_video_to_youtube(
            video_file_path=video_file,
            title="Amazing Ocean Fact #Shorts",
            description="Mind blowing ocean fact #Shorts",
            tags=["ocean", "shorts"],
            access_token="mock_valid_token_12345",
            privacy_status="public",
        )

        assert isinstance(result, YouTubeUploadResult)
        assert result.video_id == "dQw4w9WgXcQ"
        assert result.youtube_url == "https://www.youtube.com/shorts/dQw4w9WgXcQ"
        assert result.title == "Amazing Ocean Fact #Shorts"
        assert result.privacy_status == "public"
