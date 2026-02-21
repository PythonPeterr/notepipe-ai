# Notepipe — Orchestration & Agent Coordination
**READ THIS FIRST. Every agent reads this before their own spec.**

---

## What We're Building

**Notepipe** — post-meeting CRM automation tool.

Meeting ends in Fireflies → webhook fires → Claude extracts structured data → written to HubSpot or Pipedrive. Users configure what to extract via prompt templates and toggle which CRM actions run.

---

## The 4 Agents

| Agent | Owns | Spec doc |
|---|---|---|
| Agent 1 | Next.js frontend (pages, components, API calls) | `01-FRONTEND.md` |
| Agent 2 | FastAPI backend + Supabase schema + CRM integrations | `02-BACKEND.md` |
| Agent 3 | ShadCN design system + component specs + style rules | `03-UI-UX.md` |
| Agent 4 | This doc + shared types + SHARED_STATE.md + integration glue | `04-ORCHESTRATION.md` |

**Agent 4's responsibilities:**
- Keep `SHARED_STATE.md` up to date
- Own `/shared/types.ts` — canonical TypeScript types
- Own `/shared/schema.sql` — all database DDL
- Own `/shared/seed.sql` — default template data
- Unblock agents when there are conflicts or ambiguities
- Write integration tests (Playwright for E2E, pytest for backend)

---

## Repo Structure

```
/notepipe
  /frontend                    # Agent 1
    package.json
    next.config.ts
    tailwind.config.ts
    /app
    /components
    /lib
  /backend                     # Agent 2
    pyproject.toml             # Single source of truth: deps, tools, config
    uv.lock                    # Committed to git — never edit manually
    .python-version            # Pins Python: 3.12
    Dockerfile
    /app
  /shared                      # Agent 4
    types.ts                   # Canonical TS types (Agent 1 imports these)
    schema.sql                 # All Supabase DDL
    seed.sql                   # Default templates
  /tests                       # Agent 4
    /e2e                       # Playwright
    /backend                   # pytest
  SHARED_STATE.md              # Agent 4 maintains, all agents read
  README.md
  .env.example
```

---

## SHARED_STATE.md — Template

Agent 4 creates and maintains this file. All agents check it at start of each session.

```markdown
# SHARED_STATE
Last updated: [datetime] by Agent [N]

## API Contract
- Backend dev URL: http://localhost:8000
- Backend prod URL: https://notepipe-api.railway.app
- Frontend dev URL: http://localhost:3000
- Frontend prod URL: https://notepipe.vercel.app

## Backend Endpoints (Agent 2 marks complete)
- [ ] POST /webhooks/fireflies
- [ ] GET  /connections
- [ ] DELETE /connections/{service}
- [ ] GET  /connections/fireflies/webhook-url
- [ ] GET  /auth/hubspot
- [ ] GET  /auth/hubspot/callback
- [ ] GET  /auth/pipedrive
- [ ] GET  /auth/pipedrive/callback
- [ ] GET  /templates
- [ ] POST /templates
- [ ] PATCH /templates/{id}
- [ ] DELETE /templates/{id}
- [ ] POST /templates/seed
- [ ] GET  /runs
- [ ] GET  /runs/{id}
- [ ] POST /runs/{id}/retry
- [ ] GET  /users/me

## Frontend Pages (Agent 1 marks complete)
- [ ] /auth/login
- [ ] /auth/callback
- [ ] / (overview dashboard)
- [ ] /connections
- [ ] /templates
- [ ] /runs
- [ ] /settings

## Design Decisions (Agent 3 owns)
- Light mode only
- Primary buttons: black (#000000)
- Sidebar active accent: coral (#E05A4E)
- Page background: #EFEFEF
- Card background: white
- Font: Inter, weights 400/500/600/700/900

## Blockers
[Agent N - date]: [description] — needs Agent [M] to [action]

## Deviations from Spec
[Agent N - date]: [what changed] — [reason]
```

---

## Shared Types

Agent 4 owns `/shared/types.ts`. Agent 1 imports directly. Agent 2 mirrors as Pydantic models.

```typescript
// /shared/types.ts

export type ConnectionService = 'fireflies' | 'hubspot' | 'pipedrive'
export type RunStatus = 'pending' | 'success' | 'failed'
export type CRMTarget = 'hubspot' | 'pipedrive'

export interface Connection {
  id: string
  user_id: string
  service: ConnectionService
  metadata: {
    workspace_name?: string
    company_domain?: string   // Pipedrive only
  }
  created_at: string
}

export interface CRMActions {
  create_contact: boolean
  create_company: boolean
  attach_note: boolean
  update_deal_stage: boolean
  extract_followups: boolean
}

export interface Template {
  id: string
  user_id: string
  name: string
  description: string
  system_prompt: string
  is_default: boolean
  is_active: boolean
  crm_actions: CRMActions
  created_at: string
  updated_at: string
}

export interface ExtractedContact {
  name: string
  email: string
  phone: string | null
  title: string | null
}

export interface ExtractedCompany {
  name: string
  domain: string | null
  industry: string | null
}

export interface FollowUp {
  owner: string
  action: string
  due_date: string | null
}

export interface ExtractedData {
  contact: ExtractedContact
  company: ExtractedCompany
  meeting_summary: string
  deal_stage: string | null
  follow_ups: FollowUp[]
  custom_fields: Record<string, unknown>
}

export interface CRMResults {
  contact_id?: string
  company_id?: string
  note_id?: string
  deal_id?: string
  errors?: string[]
}

export interface Run {
  id: string
  user_id: string
  template_id: string | null
  fireflies_meeting_id: string
  meeting_title: string
  meeting_date: string | null
  crm_target: CRMTarget
  status: RunStatus
  extracted_data: ExtractedData | null
  crm_results: CRMResults | null
  error_message: string | null
  duration_ms: number | null
  created_at: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
}

export interface APIError {
  detail: string
  code?: string
}
```

---

## Database DDL

Agent 4 owns `/shared/schema.sql`. Agent 2 runs this in Supabase SQL editor.

```sql
-- connections
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service TEXT NOT NULL CHECK (service IN ('fireflies', 'hubspot', 'pipedrive')),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, service)
);
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_connections" ON connections FOR ALL USING (auth.uid() = user_id);

-- templates
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  system_prompt TEXT NOT NULL DEFAULT '',
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  crm_actions JSONB NOT NULL DEFAULT '{
    "create_contact": true,
    "create_company": true,
    "attach_note": true,
    "update_deal_stage": false,
    "extract_followups": true
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_templates" ON templates FOR ALL USING (auth.uid() = user_id);

-- runs
CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  fireflies_meeting_id TEXT NOT NULL,
  meeting_title TEXT DEFAULT 'Untitled Meeting',
  meeting_date TIMESTAMPTZ,
  crm_target TEXT NOT NULL CHECK (crm_target IN ('hubspot', 'pipedrive')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  extracted_data JSONB,
  crm_results JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_runs" ON runs FOR ALL USING (auth.uid() = user_id);

-- webhook_events (no RLS — service role only)
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  user_id UUID,
  processed BOOLEAN DEFAULT FALSE,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Seed Data

Agent 4 owns `/shared/seed.sql`. Called by `POST /templates/seed` endpoint on first user login.

```sql
-- Called per user — replace :user_id with actual user UUID
INSERT INTO templates (user_id, name, description, system_prompt, is_default, crm_actions) VALUES
(
  :user_id,
  'B2B Sales Call',
  'Extract contact, company, deal stage, and follow-ups from B2B sales calls.',
  'You are extracting CRM data from a B2B sales call. Focus on: who the decision maker is, what their budget range is, what pain they described, what their timeline is, and what stage of evaluation they are in.',
  TRUE,
  '{"create_contact": true, "create_company": true, "attach_note": true, "update_deal_stage": true, "extract_followups": true}'
),
(
  :user_id,
  'Discovery Call',
  'Extract pain points, decision makers, and next steps from discovery calls.',
  'You are extracting CRM data from a discovery call. Focus on: the prospect company size and industry, who you spoke with and their role, what problems they described, and what the agreed next steps are.',
  FALSE,
  '{"create_contact": true, "create_company": true, "attach_note": true, "update_deal_stage": false, "extract_followups": true}'
),
(
  :user_id,
  'Recruitment Interview',
  'Extract candidate details and assessment from recruitment interviews.',
  'You are extracting data from a recruitment interview. Focus on: candidate name and contact details, the role they applied for, key strengths mentioned, concerns raised, and recommended next step.',
  FALSE,
  '{"create_contact": true, "create_company": true, "attach_note": true, "update_deal_stage": false, "extract_followups": true}'
),
(
  :user_id,
  'Customer Success',
  'Extract health signals, risks, and action items from customer success calls.',
  'You are extracting data from a customer success call. Focus on: what the customer said about their experience, any risks or churn signals mentioned, what they asked for, and what action items were agreed.',
  FALSE,
  '{"create_contact": true, "create_company": false, "attach_note": true, "update_deal_stage": false, "extract_followups": true}'
);
```

---

## Build Order

Agents should build in this order to avoid blocking each other:

**Day 1 — Foundation (all agents in parallel)**

| Agent 1 | Agent 2 | Agent 3 | Agent 4 |
|---|---|---|---|
| Set up Next.js, Supabase auth, middleware, layout shell | Set up FastAPI, Supabase connection, health endpoint, auth middleware | Install ShadCN, configure theme, build Sidebar + layout components | Create repo structure, write shared types, run schema SQL |

**Day 2 — Core features**

| Agent 1 | Agent 2 | Agent 3 | Agent 4 |
|---|---|---|---|
| Connections page (UI only, calls backend) | OAuth flows (HubSpot + Pipedrive) + connections CRUD | Build all reusable components: ConnectionCard, StatusBadge, RunCard | Verify type contracts, write first integration test |

**Day 3 — Main workflow**

| Agent 1 | Agent 2 | Agent 3 | Agent 4 |
|---|---|---|---|
| Templates page + Sheet editor | Webhook receiver + LLM processor + CRM write services | Template editor Sheet, stat cards | E2E test: webhook → run appears in UI |

**Day 4 — Run history + polish**

| Agent 1 | Agent 2 | Agent 3 | Agent 4 |
|---|---|---|---|
| Run history table + detail view | Retry endpoint + run history pagination | Table component, empty states, skeletons | Final integration tests, README |

---

## Environment Variables — Master List

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # backend only

# API
NEXT_PUBLIC_API_URL=https://notepipe-api.railway.app

# Anthropic
ANTHROPIC_API_KEY=

# Fireflies
FIREFLIES_WEBHOOK_SECRET=          # random string, set in Fireflies + backend env

# HubSpot OAuth
HUBSPOT_CLIENT_ID=
HUBSPOT_CLIENT_SECRET=
HUBSPOT_REDIRECT_URI=https://notepipe-api.railway.app/auth/hubspot/callback

# Pipedrive OAuth
PIPEDRIVE_CLIENT_ID=
PIPEDRIVE_CLIENT_SECRET=
PIPEDRIVE_REDIRECT_URI=https://notepipe-api.railway.app/auth/pipedrive/callback

# App
FRONTEND_URL=https://notepipe.vercel.app
```

---

## Agent Communication Rules

1. **Never duplicate logic** — if Agent 1 needs data transformation, it goes in the backend (Agent 2), not the frontend
2. **Type conflicts** — Agent 4 resolves via `/shared/types.ts`; both Agent 1 and Agent 2 must match it exactly
3. **API contract changes** — Agent 2 must update `SHARED_STATE.md` immediately when an endpoint signature changes
4. **Design deviations** — Agent 1 must get approval from Agent 3 before deviating from `03-UI-UX.md`; deviations logged in `SHARED_STATE.md`
5. **Database changes** — Agent 2 must update `/shared/schema.sql` and notify Agent 4
6. **Blockers** — write in `SHARED_STATE.md` under Blockers with which agent needs to unblock you

---

## Integration Test: Happy Path

Agent 4 writes this as a Playwright test once Agent 1 and Agent 2 are functional:

```
1. User visits app → redirected to /auth/login
2. User enters email → receives magic link
3. User clicks link → redirected to /connections
4. User enters Fireflies API key → saves
5. User connects HubSpot via OAuth
6. User visits /templates → sees 4 default templates
7. Fireflies webhook fires (simulated with curl):
   curl -X POST https://api.railway.app/webhooks/fireflies \
     -H "X-Webhook-Secret: {secret}" \
     -d '{"meetingId": "test123", "eventType": "Transcription completed", "clientReferenceId": "{user_id}"}'
8. User visits /runs → sees new run with status "success"
9. Run detail shows extracted contact, company, note
10. HubSpot contact exists with meeting note attached
```

---

## README Template (Agent 4 writes this last)

```markdown
# Notepipe

Post-meeting CRM automation. Fireflies → Claude → HubSpot/Pipedrive.

## Stack
- Frontend: Next.js 14, ShadCN, Tailwind, Vercel
- Backend: FastAPI, Python 3.12, Railway
- Database + Auth: Supabase
- AI: Claude (claude-sonnet-4-5)
- Package manager: uv (pyproject.toml + uv.lock)

## Setup
1. Clone repo
2. Copy `.env.example` to `.env.local` (frontend) and `.env` (backend)
3. Run schema: paste `/shared/schema.sql` into Supabase SQL editor
4. `cd frontend && npm install && npm run dev`
5. `cd backend && uv sync && uv run uvicorn app.main:app --reload`

## Architecture
[diagram]
```
