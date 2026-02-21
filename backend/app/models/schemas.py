from typing import Any, Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums / Literals
# ---------------------------------------------------------------------------

ConnectionService = Literal["fireflies", "hubspot", "pipedrive"]
RunStatus = Literal["pending", "success", "failed"]
CRMTarget = Literal["hubspot", "pipedrive"]


# ---------------------------------------------------------------------------
# CRM Actions
# ---------------------------------------------------------------------------

class CRMActions(BaseModel):
    create_contact: bool = True
    create_company: bool = True
    attach_note: bool = True
    update_deal_stage: bool = False
    extract_followups: bool = True


# ---------------------------------------------------------------------------
# Connection
# ---------------------------------------------------------------------------

class ConnectionMetadata(BaseModel):
    workspace_name: str | None = None
    company_domain: str | None = None


class ConnectionResponse(BaseModel):
    id: str
    user_id: str
    service: ConnectionService
    metadata: ConnectionMetadata | dict[str, Any] = Field(default_factory=dict)
    created_at: str


class WebhookURLResponse(BaseModel):
    webhook_url: str


# ---------------------------------------------------------------------------
# Template
# ---------------------------------------------------------------------------

class TemplateResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: str | None = None
    system_prompt: str
    is_default: bool
    is_active: bool
    crm_actions: CRMActions
    created_at: str
    updated_at: str


class TemplateCreate(BaseModel):
    name: str
    description: str | None = None
    system_prompt: str
    is_default: bool = False
    is_active: bool = True
    crm_actions: CRMActions = Field(default_factory=CRMActions)


class TemplateUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    system_prompt: str | None = None
    is_default: bool | None = None
    is_active: bool | None = None
    crm_actions: CRMActions | None = None


# ---------------------------------------------------------------------------
# Extracted Data (LLM output)
# ---------------------------------------------------------------------------

class ExtractedContact(BaseModel):
    name: str
    email: str
    phone: str | None = None
    title: str | None = None


class ExtractedCompany(BaseModel):
    name: str
    domain: str | None = None
    industry: str | None = None


class FollowUp(BaseModel):
    owner: str
    action: str
    due_date: str | None = None


class ExtractedData(BaseModel):
    contact: ExtractedContact
    company: ExtractedCompany
    meeting_summary: str
    deal_stage: str | None = None
    follow_ups: list[FollowUp] = Field(default_factory=list)
    custom_fields: dict[str, Any] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# CRM Results
# ---------------------------------------------------------------------------

class CRMResults(BaseModel):
    contact_id: str | None = None
    company_id: str | None = None
    note_id: str | None = None
    deal_id: str | None = None
    errors: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

class RunResponse(BaseModel):
    id: str
    user_id: str
    template_id: str | None = None
    fireflies_meeting_id: str
    meeting_title: str | None = None
    meeting_date: str | None = None
    crm_target: CRMTarget
    status: RunStatus
    extracted_data: ExtractedData | dict[str, Any] | None = None
    crm_results: CRMResults | dict[str, Any] | None = None
    error_message: str | None = None
    duration_ms: int | None = None
    created_at: str


class PaginatedResponse(BaseModel):
    items: list[RunResponse]
    total: int
    page: int
    per_page: int


# ---------------------------------------------------------------------------
# Webhook
# ---------------------------------------------------------------------------

class FirefliesWebhookPayload(BaseModel):
    meetingId: str
    eventType: str
    clientReferenceId: str | None = None


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class UserResponse(BaseModel):
    id: str
    email: str | None = None
    created_at: str | None = None
    user_metadata: dict[str, Any] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Generic
# ---------------------------------------------------------------------------

class APIError(BaseModel):
    detail: str
    code: str | None = None


class MessageResponse(BaseModel):
    message: str


# ---------------------------------------------------------------------------
# Fireflies API Key
# ---------------------------------------------------------------------------

class FirefliesKeyRequest(BaseModel):
    api_key: str


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

class DashboardStatsResponse(BaseModel):
    total_runs: int
    success_rate: float
    contacts_created: int
    meetings_processed: int
