"""Tests for the /api/actions endpoints."""

import pytest

from tests.conftest import make_supabase_chain


# ---------------------------------------------------------------------------
# GET /api/actions
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_action_config(client, mock_supabase):
    """GET /api/actions should return the user's action config."""
    sample = {
        "id": "ac-1",
        "user_id": "test-user-id",
        "create_contact": True,
        "create_company": False,
        "link_contact_to_company": False,
        "attach_note": True,
        "create_deal": False,
        "update_deal_stage": False,
        "extract_followups": False,
        "log_meeting": False,
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z",
    }
    mock_supabase.table.return_value = make_supabase_chain(data=[sample])

    response = await client.get("/api/actions")
    assert response.status_code == 200

    data = response.json()
    assert data["create_contact"] is True
    assert data["create_company"] is False
    assert data["link_contact_to_company"] is False
    assert data["attach_note"] is True
    assert data["create_deal"] is False
    assert data["log_meeting"] is False


@pytest.mark.asyncio
async def test_get_action_config_creates_default(client, mock_supabase):
    """GET /api/actions creates a default config if none exists."""
    default_config = {
        "id": "ac-new",
        "user_id": "test-user-id",
        "create_contact": True,
        "create_company": False,
        "link_contact_to_company": False,
        "attach_note": True,
        "create_deal": False,
        "update_deal_stage": False,
        "extract_followups": False,
        "log_meeting": False,
        "created_at": "2026-02-20T00:00:00Z",
        "updated_at": "2026-02-20T00:00:00Z",
    }

    # First call returns empty (no existing config), second call creates
    call_count = 0

    def table_side_effect(table_name):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return make_supabase_chain(data=[])
        return make_supabase_chain(data=[default_config])

    mock_supabase.table.side_effect = table_side_effect

    response = await client.get("/api/actions")
    assert response.status_code == 200

    data = response.json()
    assert data["create_contact"] is True


# ---------------------------------------------------------------------------
# PATCH /api/actions
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_update_action_config(client, mock_supabase):
    """PATCH /api/actions should update toggles."""
    updated_config = {
        "id": "ac-1",
        "user_id": "test-user-id",
        "create_contact": True,
        "create_company": True,
        "link_contact_to_company": False,
        "attach_note": True,
        "create_deal": False,
        "update_deal_stage": False,
        "extract_followups": True,
        "log_meeting": False,
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-02-20T00:00:00Z",
    }

    # First call checks existence, second call updates
    call_count = 0
    existing = {"id": "ac-1"}

    def table_side_effect(table_name):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return make_supabase_chain(data=[existing])
        return make_supabase_chain(data=[updated_config])

    mock_supabase.table.side_effect = table_side_effect

    payload = {
        "create_company": True,
        "extract_followups": True,
    }

    response = await client.patch("/api/actions", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["create_company"] is True
    assert data["extract_followups"] is True


@pytest.mark.asyncio
async def test_update_action_config_new_fields(client, mock_supabase):
    """PATCH /api/actions should handle the 3 new toggle fields."""
    updated_config = {
        "id": "ac-1",
        "user_id": "test-user-id",
        "create_contact": True,
        "create_company": False,
        "link_contact_to_company": True,
        "attach_note": True,
        "create_deal": True,
        "update_deal_stage": False,
        "extract_followups": False,
        "log_meeting": True,
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-02-20T00:00:00Z",
    }

    call_count = 0
    existing = {"id": "ac-1"}

    def table_side_effect(table_name):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return make_supabase_chain(data=[existing])
        return make_supabase_chain(data=[updated_config])

    mock_supabase.table.side_effect = table_side_effect

    payload = {
        "link_contact_to_company": True,
        "create_deal": True,
        "log_meeting": True,
    }

    response = await client.patch("/api/actions", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["link_contact_to_company"] is True
    assert data["create_deal"] is True
    assert data["log_meeting"] is True
