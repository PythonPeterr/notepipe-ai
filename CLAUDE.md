# Notepipe — Claude Code Master Context

## What is this?

Notepipe is a post-meeting CRM automation SaaS. When a Fireflies meeting ends, a webhook fires, Claude extracts structured sales data from the transcript, and writes it to HubSpot or Pipedrive automatically. Users configure extraction via prompt templates and toggle which CRM actions to run.

**Tagline:** "Notes flow into your CRM"
**Domain:** notepipe.ai

---

## Build order (strict — do not deviate)

1. **Phase 1 — Shared foundation** → read `docs/04-ORCHESTRATION.md` first
2. **Phase 2 — Backend** → read `docs/02-BACKEND.md`
3. **Phase 3 — UI Components** → read `docs/03-UI-UX.md`
4. **Phase 4 — Frontend integration** → read `docs/01-FRONTEND.md`

---

## Rules

- Always read the spec file for the current phase before writing any code
- Do not touch files outside the current phase's scope
- Treat `docs/types.ts` as the canonical type contract — never deviate from it
- Treat `docs/schema.sql` as the canonical database schema — never deviate from it
- Commit after completing each phase with a descriptive message
- If something is unclear, check `docs/SHARED_STATE.md` before asking

---

## Tech stack

| Layer             | Technology                                     | Hosting       |
| ----------------- | ---------------------------------------------- | ------------- |
| Frontend          | Next.js 14 (App Router) + ShadCN/UI + Tailwind | Vercel        |
| Backend           | FastAPI (Python 3.12) + uv + pyproject.toml    | Railway       |
| Database + Auth   | Supabase (PostgreSQL + Row Level Security)     | Supabase      |
| Transcript source | Fireflies webhook                              | —             |
| CRM integrations  | HubSpot + Pipedrive OAuth                      | —             |
| LLM               | claude-sonnet-4-5                              | Anthropic API |

---

## Repo structure

```
notepipe-ai/
├── CLAUDE.md                  ← you are here (auto-read by Claude Code)
├── docs/
│   ├── 01-FRONTEND.md         # Next.js pages, auth, API calls
│   ├── 02-BACKEND.md          # FastAPI endpoints, services, webhook flow
│   ├── 03-UI-UX.md            # Design system, ShadCN components, Peec.AI aesthetic
│   ├── 04-ORCHESTRATION.md    # Shared types, schema, seed data, coordination
│   ├── SHARED_STATE.md        # Live build status — update after each phase
│   ├── schema.sql             # Canonical Supabase DDL
│   ├── seed.sql               # 4 default prompt templates
│   └── types.ts               # Canonical TypeScript types
├── frontend/                  # Next.js app
└── backend/                   # FastAPI app
```

---

## Design system (non-negotiable)

- Page background: `#EFEFEF` (warm gray — NOT white)
- Cards: `#FFFFFF` white on gray background
- Primary buttons: `#000000` black with white text (NOT blue)
- Sidebar active accent: `#E05A4E` coral/red thin left border
- Text primary: `#171717`, secondary: `#6B6B6B`
- Font: Inter, buttons `rounded-md`, cards `rounded-xl`
- Reference: Peec.AI aesthetic — see `docs/03-UI-UX.md` for full spec

---

## Key decisions (do not revisit)

- **uv** for Python dependency management (not pip, not requirements.txt)
- **Supabase magic link** for auth (not Clerk, not NextAuth)
- **Black primary color** for all CTA buttons
- **claude-sonnet-4-5** for transcript extraction
- **Background #EFEFEF**, not white

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
HUBSPOT_REDIRECT_URI=https://notepipe-api.railway.app/auth/hubspot/callback

# Pipedrive OAuth
PIPEDRIVE_CLIENT_ID=
PIPEDRIVE_CLIENT_SECRET=
PIPEDRIVE_REDIRECT_URI=https://notepipe-api.railway.app/auth/pipedrive/callback

# App
FRONTEND_URL=https://notepipe.vercel.app
```
