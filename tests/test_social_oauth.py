"""Tests for Social OAuth 2.0 and YouTube Integration."""
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
import pytest

from api.main import app
from api.db import IN_MEMORY_SOCIAL_ACCOUNTS, upsert_social_account

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_social_store():
    """Clear in-memory social accounts store between tests."""
    IN_MEMORY_SOCIAL_ACCOUNTS.clear()
    yield
    IN_MEMORY_SOCIAL_ACCOUNTS.clear()


def test_get_youtube_auth_url():
    """Verify that the YouTube OAuth consent URL is generated with correct parameters."""
    response = client.get("/api/social/youtube/auth-url?user_id=user-123")
    assert response.status_code == 200
    data = response.json()
    assert "auth_url" in data
    assert data["platform"] == "youtube"

    auth_url = data["auth_url"]
    assert "accounts.google.com" in auth_url
    assert "access_type=offline" in auth_url
    assert "prompt=consent" in auth_url
    assert "youtube.upload" in auth_url
    assert "youtube.readonly" in auth_url


@pytest.mark.anyio
async def test_youtube_oauth_callback_success():
    """Verify that the OAuth callback handles token exchange and redirects cleanly."""
    mock_token_response = MagicMock()
    mock_token_response.status_code = 200
    mock_token_response.json.return_value = {
        "access_token": "mock_access_token_12345",
        "refresh_token": "mock_refresh_token_67890",
        "expires_in": 3600,
    }

    mock_channel_response = MagicMock()
    mock_channel_response.status_code = 200
    mock_channel_response.json.return_value = {
        "items": [
            {
                "snippet": {
                    "title": "Documentary Shorts HQ",
                }
            }
        ]
    }

    with patch("httpx.AsyncClient.post", return_value=mock_token_response), \
         patch("httpx.AsyncClient.get", return_value=mock_channel_response):
        
        response = client.get(
            "/api/social/youtube/callback?code=mock_auth_code_abc&state=%7B%22user_id%22%3A%22user-123%22%7D",
            follow_redirects=False,
        )

        assert response.status_code == 307
        redirect_location = response.headers.get("location", "")
        assert "connected=youtube" in redirect_location
        assert "Documentary" in redirect_location

        # Verify record exists in store
        accounts = client.get("/api/social/accounts?user_id=user-123").json()
        assert len(accounts) == 1
        assert accounts[0]["platform"] == "youtube"
        assert accounts[0]["account_name"] == "Documentary Shorts HQ"
        assert accounts[0]["has_refresh_token"] is True


def test_list_and_delete_social_accounts():
    """Verify listing and deleting social accounts."""
    # Seed an account
    acc = upsert_social_account(
        platform="youtube",
        account_name="Test Creator Channel",
        access_token="tok_123",
        refresh_token="ref_123",
        user_id="user-999",
    )
    acc_id = acc["id"]

    # List accounts
    res = client.get("/api/social/accounts?user_id=user-999")
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 1
    assert items[0]["id"] == acc_id
    assert items[0]["account_name"] == "Test Creator Channel"

    # Delete account
    del_res = client.delete(f"/api/social/accounts/{acc_id}?user_id=user-999")
    assert del_res.status_code == 204

    # Verify deletion
    items_after = client.get("/api/social/accounts?user_id=user-999").json()
    assert len(items_after) == 0
