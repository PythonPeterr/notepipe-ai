# Prompt Bank + Tools Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split the monolithic `templates` concept into two: Prompt Bank (LLM prompts) and Tools (CRM action toggles per user).

**Architecture:** Replace `templates` table with `prompts` table (same shape minus `crm_actions`) and a new `tool_configs` table (one row per user with flat boolean columns). The pipeline fetches both at run time. Frontend gets two sidebar items: "Prompt Bank" and "Tools".

**Tech Stack:** Supabase (PostgreSQL), FastAPI (Python), Next.js 14, ShadCN/UI

---

### Task 1: Database migration — create `prompts` and `tool_configs` tables

**Files:**
- Modify: `shared/schema.sql`
- Modify: `shared/seed.sql`
- Apply: Supabase migration via MCP

**Step 1: Apply the migration to Supabase**

Run via `mcp__supabase__apply_migration`:

```sql
-- Create prompts table (templates minus crm_actions)
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  system_prompt TEXT NOT NULL DEFAULT '',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_prompts"
  ON prompts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_prompts_user_id ON prompts (user_id);

-- Create tool_configs table (one row per user)
CREATE TABLE tool_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  create_contact BOOLEAN NOT NULL DEFAULT true,
  create_company BOOLEAN NOT NULL DEFAULT false,
  attach_note BOOLEAN NOT NULL DEFAULT true,
  update_deal_stage BOOLEAN NOT NULL DEFAULT false,
  extract_followups BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tool_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_tool_configs"
  ON tool_configs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER set_prompts_updated_at
  BEFORE UPDATE ON prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_tool_configs_updated_at
  BEFORE UPDATE ON tool_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create prompt_list view (lightweight for list page)
CREATE VIEW prompt_list AS
  SELECT id, user_id, name, description, is_active, is_default, created_at
  FROM prompts;
```

**Step 2: Migrate data from templates → prompts + tool_configs**

```sql
-- Copy prompt data from templates to prompts
INSERT INTO prompts (id, user_id, name, description, system_prompt, is_default, is_active, created_at, updated_at)
SELECT id, user_id, name, description, system_prompt, is_default, is_active, created_at, updated_at
FROM templates;

-- Create tool_configs for each user based on their default template's crm_actions
INSERT INTO tool_configs (user_id, create_contact, create_company, attach_note, update_deal_stage, extract_followups)
SELECT DISTINCT ON (user_id)
  user_id,
  COALESCE((crm_actions->>'create_contact')::boolean, true),
  COALESCE((crm_actions->>'create_company')::boolean, false),
  COALESCE((crm_actions->>'attach_note')::boolean, true),
  COALESCE((crm_actions->>'update_deal_stage')::boolean, false),
  COALESCE((crm_actions->>'extract_followups')::boolean, false)
FROM templates
ORDER BY user_id, is_default DESC, created_at ASC;
```

**Step 3: Rename runs.template_id → runs.prompt_id**

```sql
ALTER TABLE runs RENAME COLUMN template_id TO prompt_id;

-- Update FK constraint
ALTER TABLE runs DROP CONSTRAINT IF EXISTS runs_template_id_fkey;
ALTER TABLE runs ADD CONSTRAINT runs_prompt_id_fkey
  FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE SET NULL;

-- Recreate runs_summary view with prompt_id
DROP VIEW IF EXISTS runs_summary;
CREATE VIEW runs_summary AS
  SELECT id, user_id, meeting_title, meeting_date, crm_target, status,
         source, original_filename, error_message, duration_ms, created_at
  FROM runs;
```

**Step 4: Drop old templates infrastructure**

```sql
DROP VIEW IF EXISTS template_list;
DROP TRIGGER IF EXISTS set_templates_updated_at ON templates;
DROP TABLE templates;
```

**Step 5: Update shared/schema.sql and shared/seed.sql locally**

Replace the templates DDL with prompts + tool_configs DDL in `schema.sql`.
Update `seed.sql` to seed one default prompt and one tool_config row per user.

---

### Task 2: Update shared TypeScript types

**Files:**
- Modify: `shared/types.ts`
- Modify: `frontend/lib/types.ts`

Replace all Template types with Prompt and ToolConfig types:

```typescript
// Remove: Template, TemplateSummary, CRMActions
// Add:
export interface Prompt {
  id: string
  user_id: string
  name: string
  description: string
  system_prompt: string
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PromptSummary {
  id: string
  user_id: string
  name: string
  description: string
  is_active: boolean
  is_default: boolean
  created_at: string
}

export interface ToolConfig {
  id: string
  user_id: string
  create_contact: boolean
  create_company: boolean
  attach_note: boolean
  update_deal_stage: boolean
  extract_followups: boolean
  created_at: string
  updated_at: string
}
```

Update `Run` and `RunSummary` interfaces: `template_id` → `prompt_id`.

---

### Task 3: Update backend Pydantic models

**Files:**
- Modify: `backend/app/models/schemas.py`

Replace Template* models with:

```python
# Prompt models
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
    name: str
    description: str | None = None
    system_prompt: str
    is_default: bool = False
    is_active: bool = True

class PromptUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    system_prompt: str | None = None
    is_default: bool | None = None
    is_active: bool | None = None

class PromptSummaryResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: str | None = None
    is_active: bool
    is_default: bool
    created_at: str

# Tool config models
class ToolConfigResponse(BaseModel):
    id: str
    user_id: str
    create_contact: bool
    create_company: bool
    attach_note: bool
    update_deal_stage: bool
    extract_followups: bool
    created_at: str
    updated_at: str

class ToolConfigUpdate(BaseModel):
    create_contact: bool | None = None
    create_company: bool | None = None
    attach_note: bool | None = None
    update_deal_stage: bool | None = None
    extract_followups: bool | None = None
```

Update `RunResponse` and `RunSummaryResponse`: `template_id` → `prompt_id`.
Remove `CRMActions`, `TemplateResponse`, `TemplateCreate`, `TemplateUpdate`, `TemplateSummaryResponse`.

---

### Task 4: Create backend prompts router

**Files:**
- Create: `backend/app/routers/prompts.py` (based on templates.py)

Same CRUD as templates.py but:
- Table name: `prompts` instead of `templates`
- List view: `prompt_list` instead of `template_list`
- No `crm_actions` field anywhere
- Seed endpoint creates 1 default prompt ("B2B Sales Call") + 1 tool_config row
- Response models: `PromptResponse`, `PromptSummaryResponse`, etc.

---

### Task 5: Create backend tools router

**Files:**
- Create: `backend/app/routers/tools.py`

Two endpoints:
- `GET /api/tools` — fetch the user's tool_config (create default if none exists)
- `PATCH /api/tools` — update the user's tool_config

```python
@router.get("", response_model=ToolConfigResponse)
async def get_tool_config(user, supabase):
    # Fetch user's tool_config
    # If none exists, create default row and return it

@router.patch("", response_model=ToolConfigResponse)
async def update_tool_config(body: ToolConfigUpdate, user, supabase):
    # Upsert: update if exists, create if not
```

---

### Task 6: Update pipeline routers (webhooks, uploads, runs)

**Files:**
- Modify: `backend/app/routers/webhooks.py`
- Modify: `backend/app/routers/uploads.py`
- Modify: `backend/app/routers/runs.py`

In all three files, replace:
```python
# OLD: single template query
supabase.table("templates").select("*").eq("user_id", ...).eq("is_active", True)...

# NEW: two separate queries
# 1. Get active prompt
supabase.table("prompts").select("*").eq("user_id", ...).eq("is_active", True).order("is_default", desc=True).limit(1)

# 2. Get tool config
supabase.table("tool_configs").select("*").eq("user_id", ...)
```

In run records, change `"template_id": template["id"]` → `"prompt_id": prompt["id"]`.

Pass `prompt` and `tool_config` separately to `processor.process()`.

---

### Task 7: Update processor and LLM services

**Files:**
- Modify: `backend/app/services/processor.py`

Change `process()` and `process_upload()` signatures:

```python
# OLD:
async def process(transcript, template, crm_connection):
    crm_actions = template.get("crm_actions", {})
    system_prompt = template.get("system_prompt", "")

# NEW:
async def process(transcript, prompt, tool_config, crm_connection):
    actions = {
        "create_contact": tool_config.get("create_contact", True),
        "create_company": tool_config.get("create_company", False),
        "attach_note": tool_config.get("attach_note", True),
        "update_deal_stage": tool_config.get("update_deal_stage", False),
        "extract_followups": tool_config.get("extract_followups", False),
    }
    system_prompt = prompt.get("system_prompt", "")
```

`llm.py` needs NO changes — it already receives `template_prompt` and `actions` as separate args.

---

### Task 8: Update main.py router registration

**Files:**
- Modify: `backend/app/main.py`

```python
# OLD:
from app.routers import ... templates ...
app.include_router(templates.router, prefix=api_prefix)

# NEW:
from app.routers import ... prompts, tools ...
app.include_router(prompts.router, prefix=api_prefix)
app.include_router(tools.router, prefix=api_prefix)
```

Delete `backend/app/routers/templates.py`.

---

### Task 9: Update backend tests

**Files:**
- Rename: `backend/tests/test_templates.py` → `backend/tests/test_prompts.py`
- Create: `backend/tests/test_tools.py`

Update test_prompts.py:
- Change all `/api/templates` → `/api/prompts`
- Remove `crm_actions` from all payloads and assertions
- Update table name in mock setup

Create test_tools.py:
- Test `GET /api/tools` returns default config
- Test `PATCH /api/tools` updates toggles

---

### Task 10: Update frontend — Sidebar and types

**Files:**
- Modify: `frontend/components/app/Sidebar.tsx`
- Already done: `frontend/lib/types.ts` (Task 2)

Sidebar nav items:
```typescript
// OLD:
{ href: "/templates", label: "Templates", icon: FileText },

// NEW:
{ href: "/prompts", label: "Prompt Bank", icon: FileText },
{ href: "/tools", label: "Tools", icon: Wrench },
```

---

### Task 11: Create frontend Prompt Bank page

**Files:**
- Create: `frontend/app/(dashboard)/prompts/page.tsx` (based on templates page)
- Rename: `frontend/components/app/TemplateEditor.tsx` → `frontend/components/app/PromptEditor.tsx`

Prompt Bank page: same as templates page but no CRM actions displayed.
PromptEditor: remove the CRM actions toggle section entirely. Just name + system_prompt.

Delete: `frontend/app/(dashboard)/templates/page.tsx`

---

### Task 12: Create frontend Tools page

**Files:**
- Create: `frontend/app/(dashboard)/tools/page.tsx`

Simple page with one card containing 5 toggle switches.
Auto-saves on toggle change via `PATCH /api/tools`.

```
Tools
Configure which CRM actions run after extraction.

┌─────────────────────────────────────────┐
│ Create/update contact        [  ON  ]   │
│ Sync contact info to CRM               │
├─────────────────────────────────────────┤
│ Create/update company        [  OFF ]   │
│ Sync company details to CRM            │
├─────────────────────────────────────────┤
│ Attach meeting note          [  ON  ]   │
│ Add meeting summary as a note          │
├─────────────────────────────────────────┤
│ Update deal stage            [  OFF ]   │
│ Move deal through pipeline             │
├─────────────────────────────────────────┤
│ Extract follow-ups           [  OFF ]   │
│ Create tasks from action items         │
└─────────────────────────────────────────┘
```

---

### Task 13: Build verification

**Step 1:** Run `uv run python -m pytest tests/ -v` — all tests pass
**Step 2:** Run `npm run build` in frontend — zero TypeScript errors
**Step 3:** Verify Supabase tables via `mcp__supabase__list_tables`
