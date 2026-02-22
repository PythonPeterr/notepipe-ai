"""Tests for the /api/prompts endpoints."""

import pytest

from tests.conftest import make_supabase_chain


# ---------------------------------------------------------------------------
# GET /api/prompts
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_list_prompts(client, mock_supabase):
    """GET /api/prompts should return the user's prompts."""
    sample = [
        {
            "id": "prm-1",
            "user_id": "test-user-id",
            "name": "B2B Sales Call",
            "description": "Extract data from sales calls.",
            "is_default": True,
            "is_active": True,
            "created_at": "2026-01-01T00:00:00Z",
        },
    ]
    mock_supabase.table.return_value = make_supabase_chain(data=sample)

    response = await client.get("/api/prompts")
    assert response.status_code == 200

    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "B2B Sales Call"
    assert data[0]["is_default"] is True


@pytest.mark.asyncio
async def test_list_prompts_empty(client, mock_supabase):
    """GET /api/prompts returns an empty list when none exist."""
    mock_supabase.table.return_value = make_supabase_chain(data=[])

    response = await client.get("/api/prompts")
    assert response.status_code == 200
    assert response.json() == []


# ---------------------------------------------------------------------------
# POST /api/prompts
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_prompt(client, mock_supabase):
    """POST /api/prompts should create and return a new prompt."""
    created_row = {
        "id": "prm-new",
        "user_id": "test-user-id",
        "name": "Custom Prompt",
        "description": "My custom prompt.",
        "system_prompt": "Extract key info.",
        "is_default": False,
        "is_active": True,
        "created_at": "2026-02-20T00:00:00Z",
        "updated_at": "2026-02-20T00:00:00Z",
    }

    insert_chain = make_supabase_chain(data=[created_row])
    mock_supabase.table.return_value = insert_chain

    payload = {
        "name": "Custom Prompt",
        "description": "My custom prompt.",
        "system_prompt": "Extract key info.",
    }

    response = await client.post("/api/prompts", json=payload)
    assert response.status_code == 201

    data = response.json()
    assert data["id"] == "prm-new"
    assert data["name"] == "Custom Prompt"
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_create_prompt_missing_name(client):
    """POST /api/prompts without a name returns 422 (validation error)."""
    payload = {
        "system_prompt": "Extract data.",
    }
    response = await client.post("/api/prompts", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_prompt_missing_system_prompt(client):
    """POST /api/prompts without a system_prompt returns 422."""
    payload = {
        "name": "No Prompt",
    }
    response = await client.post("/api/prompts", json=payload)
    assert response.status_code == 422
