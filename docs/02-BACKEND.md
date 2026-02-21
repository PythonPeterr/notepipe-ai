# Notepipe — Backend & Database Specification
**Agent 2 owns this document. Read ORCHESTRATION.md first.**

---

## Stack

| Item | Choice |
|---|---|
| Framework | FastAPI (Python 3.12) |
| Package manager | `uv` with `pyproject.toml` + `uv.lock` (no requirements.txt) |
| ORM | `supabase-py` (direct Supabase client, no SQLAlchemy) |
| Auth | Supabase JWT verification |
| HTTP client | `httpx` (async) |
| LLM | Anthropic Claude API (`claude-sonnet-4-5` model) |
| Linting | `ruff` (replaces flake8 + isort + pyupgrade) |
| Type checking | `mypy` strict mode |
| Testing | `pytest` + `pytest-asyncio` + `pytest-httpx` |
| Task queue | None for MVP (inline async processing) |
| Deployment | Railway (Dockerfile with uv) |

---

## Project Structure

```
/app
  main.py                    # FastAPI app, CORS, router registration
  /routers
    auth.py                  # OAuth flows: HubSpot, Pipedrive
    webhooks.py              # Fireflies webhook receiver
    connections.py           # CRUD for user connections
    templates.py             # CRUD for prompt templates
    runs.py                  # Run history + re-run
    users.py                 # User profile
  /services
    fireflies.py             # Fireflies GraphQL API client
    hubspot.py               # HubSpot REST API client
    pipedrive.py             # Pipedrive REST API client
    llm.py                   # Claude API wrapper + prompt builder
    processor.py             # Core orchestration: transcript → LLM → CRM
  /models
    schemas.py               # Pydantic request/response models
  /middleware
    auth.py                  # JWT verification dependency
  config.py                  # Settings from env vars (pydantic-settings)
pyproject.toml               # Single source of truth: deps, tools, config
uv.lock                      # Committed to git — never edit manually
.python-version              # Pins Python: 3.12
Dockerfile
```

---

## Database Schema (Supabase / PostgreSQL)

### `users` (managed by Supabase Auth — do not create manually)
Supabase auto-creates `auth.users`. Reference it via `user_id UUID`.

---

### `connections`
```sql
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service TEXT NOT NULL,           -- 'fireflies' | 'hubspot' | 'pipedrive'
  access_token TEXT,               -- encrypted at rest by Supabase
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  metadata JSONB,                  -- e.g. { "workspace_name": "Acme" }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, service)
);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own connections" ON connections
  FOR ALL USING (auth.uid() = user_id);
```

---

### `templates`
```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
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
CREATE POLICY "users see own templates" ON templates
  FOR ALL USING (auth.uid() = user_id);
```

---

### `runs`
```sql
CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id),
  fireflies_meeting_id TEXT NOT NULL,
  meeting_title TEXT,
  meeting_date TIMESTAMPTZ,
  crm_target TEXT NOT NULL,        -- 'hubspot' | 'pipedrive'
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'success' | 'failed'
  extracted_data JSONB,            -- what LLM returned
  crm_results JSONB,               -- what was written to CRM (IDs, errors)
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own runs" ON runs
  FOR ALL USING (auth.uid() = user_id);
```

---

### `webhook_events`
```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,            -- 'fireflies'
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  user_id UUID,                    -- resolved after lookup
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- No RLS — backend service role only
```

---

## API Endpoints

### Auth Middleware
Every protected endpoint uses dependency `get_current_user`:
```python
# middleware/auth.py
from fastapi import Depends, HTTPException, Header
from supabase import create_client

async def get_current_user(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    # Verify JWT with Supabase
    user = supabase.auth.get_user(token)
    if not user:
        raise HTTPException(status_code=401)
    return user.user
```

---

### `POST /webhooks/fireflies`
**Public endpoint** (verified by secret header, not JWT)

```
Headers: X-Webhook-Secret: {FIREFLIES_WEBHOOK_SECRET}
Body: { "meetingId": "xxx", "eventType": "Transcription completed", "clientReferenceId": "{user_id}" }
```

Flow:
1. Verify `X-Webhook-Secret` matches env var
2. Extract `clientReferenceId` → this is the `user_id`
3. Store raw event in `webhook_events`
4. Fetch full transcript from Fireflies GraphQL API using user's Fireflies API key
5. Find user's active template
6. Find user's connected CRM
7. Call `processor.process(transcript, template, crm_connection)`
8. Store result in `runs`
9. Return `200 OK` immediately (process async if possible)

**Fireflies GraphQL query to fetch transcript:**
```graphql
query GetTranscript($meetingId: String!) {
  transcript(id: $meetingId) {
    id
    title
    date
    duration
    attendees { name email }
    sentences { speaker_name text start_time end_time }
    summary { overview action_items }
  }
}
```

---

### `GET /connections`
Returns all connections for current user (tokens redacted).

### `DELETE /connections/{service}`
Removes a connection.

### `GET /connections/fireflies/webhook-url`
Returns `{ "webhook_url": "https://backend.railway.app/webhooks/fireflies?user_id={user_id}" }`
User pastes this into their Fireflies settings.

---

### OAuth Flows

#### HubSpot
```
GET /auth/hubspot
  → redirect to HubSpot OAuth URL with scopes:
    crm.objects.contacts.write
    crm.objects.companies.write
    crm.objects.deals.write
    crm.objects.notes.write

GET /auth/hubspot/callback?code=xxx
  → exchange code for tokens
  → store in connections table
  → redirect to frontend /connections?connected=hubspot
```

#### Pipedrive
```
GET /auth/pipedrive
  → redirect to Pipedrive OAuth URL

GET /auth/pipedrive/callback?code=xxx
  → exchange code for tokens
  → store company_domain in metadata (required for API calls)
  → redirect to frontend /connections?connected=pipedrive
```

---

### Templates CRUD

```
GET    /templates          → list user's templates
POST   /templates          → create template
PATCH  /templates/{id}     → update template
DELETE /templates/{id}     → delete template
POST   /templates/seed     → seed default templates for new user (called on first login)
```

---

### Runs

```
GET  /runs                 → list runs (paginated, filterable by status/crm)
GET  /runs/{id}            → run detail with full extracted_data + crm_results
POST /runs/{id}/retry      → re-run with same transcript, current active template
```

---

## Core Processing Service

```python
# services/processor.py

async def process(transcript: dict, template: Template, crm: Connection) -> RunResult:
    # 1. Build prompt
    prompt = build_prompt(transcript, template.system_prompt, template.crm_actions)
    
    # 2. Call Claude
    extracted = await llm.extract(prompt)
    
    # 3. Write to CRM
    if crm.service == "hubspot":
        crm_result = await hubspot.write(extracted, crm.access_token, template.crm_actions)
    elif crm.service == "pipedrive":
        crm_result = await pipedrive.write(extracted, crm.access_token, crm.metadata, template.crm_actions)
    
    return RunResult(extracted_data=extracted, crm_results=crm_result)
```

---

## LLM Prompt Structure

```python
# services/llm.py

SYSTEM_PROMPT_BASE = """
You are a CRM data extraction assistant. Given a meeting transcript, extract structured information.
Return ONLY valid JSON matching this schema exactly — no markdown, no explanation.

Schema:
{
  "contact": { "name": str, "email": str, "phone": str | null, "title": str | null },
  "company": { "name": str, "domain": str | null, "industry": str | null },
  "meeting_summary": str,  // 2-3 sentence summary
  "deal_stage": str | null,  // e.g. "Discovery", "Proposal", "Negotiation", "Closed Won"
  "follow_ups": [{ "owner": str, "action": str, "due_date": str | null }],
  "custom_fields": {}  // template-specific fields
}
"""

def build_prompt(transcript: dict, template_prompt: str, actions: dict) -> str:
    sentences = "\n".join([
        f"{s['speaker_name']}: {s['text']}"
        for s in transcript['sentences']
    ])
    return f"{SYSTEM_PROMPT_BASE}\n\n{template_prompt}\n\nTranscript:\n{sentences}"
```

---

## HubSpot Write Logic

```python
# services/hubspot.py
# For each enabled action in template.crm_actions:

async def write(data: ExtractedData, token: str, actions: dict):
    results = {}
    
    if actions['create_contact']:
        # Search existing contact by email first
        existing = await search_contact(data.contact.email, token)
        if existing:
            results['contact_id'] = await update_contact(existing.id, data.contact, token)
        else:
            results['contact_id'] = await create_contact(data.contact, token)
    
    if actions['create_company']:
        existing = await search_company(data.company.name, token)
        if existing:
            results['company_id'] = existing.id
        else:
            results['company_id'] = await create_company(data.company, token)
    
    if actions['attach_note'] and results.get('contact_id'):
        results['note_id'] = await create_note(
            data.meeting_summary, 
            results['contact_id'], 
            token
        )
    
    return results
```

---

## Pipedrive Write Logic

Same pattern, but:
- Contacts are "Persons" in Pipedrive
- Companies are "Organizations"
- Notes attach to Persons or Deals
- API URL: `https://{company_domain}.pipedrive.com/api/v1/`
- Auth: `Authorization: Bearer {access_token}`

---

## Token Refresh

Both HubSpot and Pipedrive issue refresh tokens. Before each API call:
```python
if connection.token_expires_at < now + timedelta(minutes=5):
    new_tokens = await refresh_oauth_token(connection)
    await update_connection_tokens(connection.user_id, new_tokens)
```

---

## Environment Variables

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=       # service role for backend (not anon key)
ANTHROPIC_API_KEY=
FIREFLIES_WEBHOOK_SECRET=        # random secret, verify on incoming webhooks
HUBSPOT_CLIENT_ID=
HUBSPOT_CLIENT_SECRET=
HUBSPOT_REDIRECT_URI=https://backend.railway.app/auth/hubspot/callback
PIPEDRIVE_CLIENT_ID=
PIPEDRIVE_CLIENT_SECRET=
PIPEDRIVE_REDIRECT_URI=https://backend.railway.app/auth/pipedrive/callback
FRONTEND_URL=https://your-app.vercel.app
```

---

## Dependency Management (uv)

**No `requirements.txt`.** All dependencies live in `pyproject.toml`. The lockfile `uv.lock` is committed to git and guarantees byte-for-byte reproducibility across all environments.

```toml
# pyproject.toml
[project]
name = "notepipe-api"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
  "fastapi>=0.115.0",
  "uvicorn[standard]>=0.32.0",
  "supabase>=2.10.0",
  "httpx>=0.27.0",
  "anthropic>=0.40.0",
  "pydantic>=2.9.0",
  "pydantic-settings>=2.6.0",
]

[dependency-groups]
dev = [
  "pytest>=8.3.0",
  "pytest-asyncio>=0.24.0",
  "pytest-httpx>=0.30.0",
  "ruff>=0.8.0",
  "mypy>=1.13.0",
]

[tool.ruff]
line-length = 100
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "I", "UP"]   # pycodestyle, pyflakes, isort, pyupgrade

[tool.mypy]
python_version = "3.12"
strict = true

[tool.pytest.ini_options]
asyncio_mode = "auto"
```

**Key uv commands:**
```bash
uv sync                     # install all deps, create .venv
uv sync --locked            # CI: install from lockfile exactly, error if out of sync
uv add fastapi              # add runtime dependency (updates pyproject.toml + uv.lock)
uv add --dev pytest         # add dev dependency
uv run uvicorn app.main:app --reload   # run without activating venv
uv run pytest               # run tests
uv run ruff check .         # lint
uv run mypy app/            # type check
uv lock --upgrade           # upgrade all deps to latest compatible versions
```

**Never run `pip install` directly.** All installs go through `uv add` or `uv sync`.

---

## Dockerfile

```dockerfile
FROM python:3.12-slim

# Copy uv binary from official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Install deps first (cached layer — only re-runs when pyproject.toml or uv.lock changes)
COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-dev --no-install-project

# Copy source and install project
COPY . .
RUN uv sync --locked --no-dev

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Key Rules for Agent 2

1. Use Supabase **service role key** server-side — never the anon key
2. All tokens stored in `connections` table must be treated as sensitive — never log them
3. Webhook endpoint `/webhooks/fireflies` must be exempt from JWT auth but must verify the webhook secret
4. Always check token expiry and refresh before CRM API calls
5. Return `200 OK` from webhook immediately — do not make the webhook wait for LLM processing
6. The `clientReferenceId` field in the Fireflies webhook payload is how you map webhooks to users — instruct users to set this to their user_id in Fireflies settings
7. Use `claude-sonnet-4-5` for extraction — balance cost vs quality
8. **Never use `pip install` or `requirements.txt`** — all dependency management goes through `uv`. Add deps with `uv add`, install with `uv sync --locked`.
