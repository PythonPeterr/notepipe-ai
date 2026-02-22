# Notepipe — Claude Code Master Context

## What is this?

Notepipe is a post-meeting CRM automation SaaS. When a Fireflies meeting ends, a webhook fires, Claude extracts structured sales data from the transcript, and writes it to the user's connected CRM automatically. Users configure extraction via prompts and toggle CRM actions separately via action configs.

**Tagline:** "Notes flow into your CRM"
**Domain:** notepipe.ai

---

## Tech stack

| Layer             | Technology                                     | Hosting       |
| ----------------- | ---------------------------------------------- | ------------- |
| Frontend          | Next.js 16 (App Router) + ShadCN/UI + Tailwind | Vercel        |
| Backend           | FastAPI (Python 3.12) + uv + pyproject.toml    | Railway       |
| Database + Auth   | Supabase (PostgreSQL + Row Level Security)     | Supabase      |
| Transcript source | Fireflies webhook                              | —             |
| CRM integrations  | HubSpot, Pipedrive, Attio, Zoho (all OAuth)   | —             |
| LLM               | claude-sonnet-4-5                              | Anthropic API |

---

## Repo structure

```
notepipe-ai/
├── CLAUDE.md                  ← you are here
├── shared/
│   ├── schema.sql             # Canonical Supabase DDL
│   ├── seed.sql               # Default prompt + action config seed
│   └── types.ts               # Canonical TypeScript types
├── frontend/                  # Next.js app
│   ├── app/(marketing)/       # Landing page
│   ├── app/(dashboard)/       # Overview, connections, prompts, actions, runs, uploads, settings
│   ├── app/auth/              # Login + callback
│   ├── components/            # ShadCN + app components
│   └── lib/                   # api.ts, types.ts, supabase client
└── backend/                   # FastAPI app
    ├── app/main.py            # Entry point, registers all routers
    ├── app/config.py          # Pydantic settings from .env
    ├── app/middleware/auth.py  # JWT verification + dev bypass
    ├── app/models/schemas.py  # Pydantic models
    ├── app/routers/           # account, actions, auth, connections, dashboard, prompts, runs, uploads, users, webhooks
    └── app/services/          # attio, fireflies, file_parser, hubspot, llm, pipedrive, processor, zoho
```

---

## Database tables (canonical: `shared/schema.sql`)

| Table | Purpose |
|-------|---------|
| `connections` | OAuth tokens for Fireflies + 4 CRMs. One row per (user, service). |
| `prompts` | User-configurable LLM extraction prompts. Each has name, system_prompt, is_active. |
| `action_configs` | Per-user CRM action toggles (create_contact, create_company, link_contact_to_company, attach_note, create_deal, update_deal_stage, extract_followups, log_meeting). One row per user. |
| `runs` | One row per pipeline execution. Has extracted_data + crm_results JSONB. |
| `webhook_events` | Raw Fireflies webhook payloads. Backend-only, no RLS. |

---

## Key architecture decisions

- **Prompts and action configs are separate** — prompts control what the LLM extracts, action configs control which CRM actions run. They are NOT embedded together.
- **uv** for Python dependency management (not pip, not requirements.txt)
- **Supabase magic link + Google OAuth** for auth (not Clerk, not NextAuth)
- **claude-sonnet-4-5** for transcript extraction
- **4 CRM integrations:** HubSpot (HTML notes, token refresh), Pipedrive (plain text, token refresh), Attio (Markdown notes, no token expiry), Zoho (plain text, region-aware token refresh)

---

## Design system (non-negotiable)

- Page background: `#EFEFEF` (warm gray — NOT white)
- Cards: `#FFFFFF` white on gray background
- Primary buttons: `#000000` black with white text (NOT blue)
- Sidebar active accent: `#E05A4E` coral/red thin left border
- Text primary: `#171717`, secondary: `#6B6B6B`
- Font: Inter, buttons `rounded-md`, cards `rounded-xl`

---

## Environment variables needed

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# API
NEXT_PUBLIC_API_URL=https://notepipe-api.railway.app

# Anthropic
ANTHROPIC_API_KEY=

# Fireflies
FIREFLIES_WEBHOOK_SECRET=

# HubSpot OAuth
HUBSPOT_CLIENT_ID=
HUBSPOT_CLIENT_SECRET=
HUBSPOT_REDIRECT_URI=https://notepipe-api.railway.app/api/auth/hubspot/callback

# Pipedrive OAuth
PIPEDRIVE_CLIENT_ID=
PIPEDRIVE_CLIENT_SECRET=
PIPEDRIVE_REDIRECT_URI=https://notepipe-api.railway.app/api/auth/pipedrive/callback

# Attio OAuth
ATTIO_CLIENT_ID=
ATTIO_CLIENT_SECRET=
ATTIO_REDIRECT_URI=https://notepipe-api.railway.app/api/auth/attio/callback

# Zoho OAuth
ZOHO_CLIENT_ID=
ZOHO_CLIENT_SECRET=
ZOHO_REDIRECT_URI=https://notepipe-api.railway.app/api/auth/zoho/callback

# App
FRONTEND_URL=https://notepipe.vercel.app
```
