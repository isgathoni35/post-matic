"""Tests for OAuth 2.0 Token Expiration Verification and Auto-Refresh Worker."""
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch
import pytest

from api.db import IN_MEMORY_SOCIAL_ACCOUNTS, upsert_social_account
from api.services.token_manager import (
    ensure_valid_access_token,
    is_token_expired,
    parse_iso_datetime,
    refresh_google_access_token,
    verify_and_refresh_user_accounts,
)


@pytest.fixture(autouse=True)
def clean_social_store():
    """Reset social store before each test."""
    IN_MEMORY_SOCIAL_ACCOUNTS.clear()
    yield
    IN_MEMORY_SOCIAL_ACCOUNTS.clear()


def test_parse_iso_datetime():
    """Verify ISO datetime string parsing."""
    assert parse_iso_datetime(None) is None
    assert parse_iso_datetime("invalid-string") is None

    dt = parse_iso_datetime("2026-09-01T15:30:00Z")
    assert dt is not None
    assert dt.tzinfo is not None
    assert dt.year == 2026


def test_is_token_expired_logic():
    """Verify expiration checks with various timestamps and buffers."""
    # None or missing timestamp -> consider expired
    assert is_token_expired(None) is True
    assert is_token_expired("") is True

    # Already past timestamp -> expired
    past_time = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    assert is_token_expired(past_time) is True

    # Expiring in 2 minutes (within default 5min / 300s buffer) -> considered expired
    soon_time = (datetime.now(timezone.utc) + timedelta(minutes=2)).isoformat()
    assert is_token_expired(soon_time, buffer_seconds=300) is True

    # Expiring in 30 minutes -> valid
    future_time = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()
    assert is_token_expired(future_time, buffer_seconds=300) is False


@pytest.mark.asyncio
async def test_refresh_google_access_token_success():
    """Verify successful Google token refresh exchange."""
    mock_res = MagicMock()
    mock_res.status_code = 200
    mock_res.json.return_value = {
        "access_token": "fresh_google_access_token_xyz",
        "expires_in": 3600,
        "token_type": "Bearer",
    }

    with patch("httpx.AsyncClient.post", return_value=mock_res):
        res = await refresh_google_access_token(
            refresh_token="valid_refresh_token_123",
            client_id="mock_client_id",
            client_secret="mock_client_secret",
        )

        assert res["access_token"] == "fresh_google_access_token_xyz"
        assert res["expires_in"] == 3600
        assert "token_expires_at" in res
        assert not is_token_expired(res["token_expires_at"])


@pytest.mark.asyncio
async def test_ensure_valid_access_token_not_expired():
    """Verify that a valid token is returned without initiating a refresh."""
    valid_future = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    account = {
        "id": "acc-1",
        "platform": "youtube",
        "access_token": "valid_token_abc",
        "refresh_token": "ref_123",
        "token_expires_at": valid_future,
    }

    token, refreshed = await ensure_valid_access_token(account)
    assert token == "valid_token_abc"
    assert refreshed is False


@pytest.mark.asyncio
async def test_ensure_valid_access_token_expired_triggers_refresh():
    """Verify that an expired token automatically triggers refresh and stores the new token."""
    expired_time = (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat()
    acc = upsert_social_account(
        platform="youtube",
        account_name="Test Automation Channel",
        access_token="expired_tok",
        refresh_token="ref_tok_999",
        token_expires_at=expired_time,
        user_id="user-123",
    )

    mock_refresh_result = {
        "access_token": "brand_new_access_token_456",
        "token_expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
        "expires_in": 3600,
    }

    with patch("api.services.token_manager.refresh_google_access_token", return_value=mock_refresh_result):
        new_token, was_refreshed = await ensure_valid_access_token(acc)
        assert new_token == "brand_new_access_token_456"
        assert was_refreshed is True

        # Verify updated in-memory/Supabase store
        updated = IN_MEMORY_SOCIAL_ACCOUNTS[acc["id"]]
        assert updated["access_token"] == "brand_new_access_token_456"
        assert updated["refresh_token"] == "ref_tok_999"


@pytest.mark.asyncio
async def test_verify_and_refresh_user_accounts():
    """Verify multi-account scan and refresh utility."""
    expired_time = (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()
    acc = upsert_social_account(
        platform="youtube",
        account_name="Batch Test Channel",
        access_token="old_tok",
        refresh_token="ref_batch",
        token_expires_at=expired_time,
        user_id="user-batch",
    )

    mock_refresh_result = {
        "access_token": "batch_refreshed_token",
        "token_expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
        "expires_in": 3600,
    }

    with patch("api.services.token_manager.refresh_google_access_token", return_value=mock_refresh_result):
        results = await verify_and_refresh_user_accounts(user_id="user-batch")
        assert len(results) == 1
        assert results[0]["account_id"] == acc["id"]
        assert results[0]["refreshed"] is True
        assert results[0]["status"] == "active"
