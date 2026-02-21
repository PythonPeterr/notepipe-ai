"""Tests for the /api/users endpoints."""

import pytest


@pytest.mark.asyncio
async def test_get_me_returns_user_profile(client):
    """GET /api/users/me should return the authenticated user's profile."""
    response = await client.get("/api/users/me")
    assert response.status_code == 200

    data = response.json()
    assert data["id"] == "test-user-id"
    assert data["email"] == "test@example.com"
    assert data["created_at"] == "2026-01-01T00:00:00Z"
    assert data["user_metadata"] == {}


@pytest.mark.asyncio
async def test_get_me_includes_all_fields(client):
    """The response should contain exactly the fields defined in UserResponse."""
    response = await client.get("/api/users/me")
    data = response.json()
    expected_keys = {"id", "email", "created_at", "user_metadata"}
    assert set(data.keys()) == expected_keys
