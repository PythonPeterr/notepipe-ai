from typing import Any, Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums / Literals
# ---------------------------------------------------------------------------

ConnectionService = Literal["fireflies", "hubspot", "pipedrive", "attio", "zoho"]
RunStatus = Literal["pending", "success", "failed"]
RunSource = Literal["fireflies", "upload"]
CRMTarget = Literal["hubspot", "pipedrive", "attio", "zoho"]


# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------

class PromptResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: str | None = None
    system_prompt: str
    is_default: bool
    is_active: bool
    created_at: str
    updated_at: str


class PromptCreate(BaseModel):
    name: str = Field(..., max_length=255)
    description: str | None = Field(None, max_length=1000)
    system_prompt: str = Field(..., max_length=50000)
    is_default: bool = False
    is_active: bool = True


class PromptUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    description: str | None = Field(None, max_length=1000)
    system_prompt: str | None = Field(None, max_length=50000)
    is_default: bool | None = None
    is_active: bool | None = None


class PromptSummaryResponse(BaseModel):
    """Lightweight prompt data for list pages — no system_prompt."""

    id: str
    user_id: str
    name: str
    description: str | None = None
    is_active: bool
    is_default: bool
    created_at: str


# ---------------------------------------------------------------------------
# Action Config
# ---------------------------------------------------------------------------

class ActionConfigResponse(BaseModel):
    id: str
    user_id: str
    create_contact: bool
    create_company: bool
    link_contact_to_company: bool
    attach_note: bool
    create_deal: bool
    update_deal_stage: bool
    extract_followups: bool
    log_meeting: bool
    created_at: str
    updated_at: str


class ActionConfigUpdate(BaseModel):
    create_contact: bool | None = None
    create_company: bool | None = None
    link_contact_to_company: bool | None = None
    attach_note: bool | None = None
    create_deal: bool | None = None
    update_deal_stage: bool | None = None
    extract_followups: bool | None = None
    log_meeting: bool | None = None


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
    webhook_secret: str
    user_id: str


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
    meeting_id: str | None = None
    errors: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

class RunResponse(BaseModel):
    id: str
    user_id: str
    prompt_id: str | None = None
    fireflies_meeting_id: str
    meeting_title: str | None = None
    meeting_date: str | None = None
    crm_target: CRMTarget
    status: RunStatus
    source: RunSource = "fireflies"
    original_filename: str | None = None
    extracted_data: ExtractedData | dict[str, Any] | None = None
    crm_results: CRMResults | dict[str, Any] | None = None
    error_message: str | None = None
    duration_ms: int | None = None
    created_at: str


class RunSummaryResponse(BaseModel):
    """Lightweight run data for list pages — no extracted_data or crm_results."""

    id: str
    user_id: str
    meeting_title: str | None = None
    meeting_date: str | None = None
    crm_target: CRMTarget
    status: RunStatus
    source: RunSource = "fireflies"
    original_filename: str | None = None
    error_message: str | None = None
    duration_ms: int | None = None
    created_at: str


class PaginatedRunsResponse(BaseModel):
    items: list[RunSummaryResponse]
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
