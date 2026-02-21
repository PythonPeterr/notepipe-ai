"""Tests for the /api/templates endpoints."""

import pytest

from tests.conftest import make_supabase_chain


# ---------------------------------------------------------------------------
# GET /api/templates
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_list_templates(client, mock_supabase):
    """GET /api/templates should return the user's templates."""
    sample = [
        {
            "id": "tpl-1",
            "user_id": "test-user-id",
            "name": "B2B Sales Call",
            "description": "Extract data from sales calls.",
            "system_prompt": "You are extracting CRM data.",
            "is_default": True,
            "is_active": True,
            "crm_actions": {
                "create_contact": True,
                "create_company": True,
                "attach_note": True,
                "update_deal_stage": False,
                "extract_followups": True,
            },
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-01T00:00:00Z",
        },
    ]
    mock_supabase.table.return_value = make_supabase_chain(data=sample)

    response = await client.get("/api/templates")
    assert response.status_code == 200

    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "B2B Sales Call"
    assert data[0]["is_default"] is True


@pytest.mark.asyncio
async def test_list_templates_empty(client, mock_supabase):
    """GET /api/templates returns an empty list when none exist."""
    mock_supabase.table.return_value = make_supabase_chain(data=[])

    response = await client.get("/api/templates")
    assert response.status_code == 200
    assert response.json() == []


# ---------------------------------------------------------------------------
# POST /api/templates
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_template(client, mock_supabase):
    """POST /api/templates should create and return a new template."""
    created_row = {
        "id": "tpl-new",
        "user_id": "test-user-id",
        "name": "Custom Template",
        "description": "My custom template.",
        "system_prompt": "Extract key info.",
        "is_default": False,
        "is_active": True,
        "crm_actions": {
            "create_contact": True,
            "create_company": False,
            "attach_note": True,
            "update_deal_stage": False,
            "extract_followups": False,
        },
        "created_at": "2026-02-20T00:00:00Z",
        "updated_at": "2026-02-20T00:00:00Z",
    }

    insert_chain = make_supabase_chain(data=[created_row])
    mock_supabase.table.return_value = insert_chain

    payload = {
        "name": "Custom Template",
        "description": "My custom template.",
        "system_prompt": "Extract key info.",
        "is_default": False,
        "is_active": True,
        "crm_actions": {
            "create_contact": True,
            "create_company": False,
            "attach_note": True,
            "update_deal_stage": False,
            "extract_followups": False,
        },
    }

    response = await client.post("/api/templates", json=payload)
    assert response.status_code == 201

    data = response.json()
    assert data["id"] == "tpl-new"
    assert data["name"] == "Custom Template"
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_create_template_default_crm_actions(client, mock_supabase):
    """POST /api/templates without crm_actions uses defaults."""
    created_row = {
        "id": "tpl-def",
        "user_id": "test-user-id",
        "name": "Minimal",
        "description": "",
        "system_prompt": "Do the thing.",
        "is_default": False,
        "is_active": True,
        "crm_actions": {
            "create_contact": True,
            "create_company": True,
            "attach_note": True,
            "update_deal_stage": False,
            "extract_followups": True,
        },
        "created_at": "2026-02-20T00:00:00Z",
        "updated_at": "2026-02-20T00:00:00Z",
    }

    insert_chain = make_supabase_chain(data=[created_row])
    mock_supabase.table.return_value = insert_chain

    payload = {
        "name": "Minimal",
        "system_prompt": "Do the thing.",
    }

    response = await client.post("/api/templates", json=payload)
    assert response.status_code == 201

    data = response.json()
    # Should have default CRM actions
    assert data["crm_actions"]["create_contact"] is True
    assert data["crm_actions"]["update_deal_stage"] is False


@pytest.mark.asyncio
async def test_create_template_missing_name(client):
    """POST /api/templates without a name returns 422 (validation error)."""
    payload = {
        "system_prompt": "Extract data.",
    }
    response = await client.post("/api/templates", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_template_missing_system_prompt(client):
    """POST /api/templates without a system_prompt returns 422."""
    payload = {
        "name": "No Prompt Template",
    }
    response = await client.post("/api/templates", json=payload)
    assert response.status_code == 422
