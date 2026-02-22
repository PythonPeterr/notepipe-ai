# Design: Templates → Prompt Bank + Tools

**Date:** 2026-02-22
**Status:** Approved

## Summary

Split the monolithic `templates` table into two concepts:
- **Prompt Bank** — user-defined LLM prompts for extraction
- **Tools** — per-user CRM action toggles (one config per account)

## Data Model

### `prompts` table (replaces `templates`)

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | UUID | gen_random_uuid() | PK |
| user_id | UUID | — | FK → auth.users, ON DELETE CASCADE |
| name | TEXT | — | NOT NULL |
| description | TEXT | '' | Optional |
| system_prompt | TEXT | '' | NOT NULL, the LLM instructions |
| is_default | BOOLEAN | false | One default per user |
| is_active | BOOLEAN | true | Toggle on/off |
| created_at | TIMESTAMPTZ | now() | |
| updated_at | TIMESTAMPTZ | now() | Auto-updated via trigger |

### `tool_configs` table (new — one row per user)

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | UUID | gen_random_uuid() | PK |
| user_id | UUID | — | FK → auth.users, UNIQUE, ON DELETE CASCADE |
| create_contact | BOOLEAN | true | |
| create_company | BOOLEAN | false | |
| attach_note | BOOLEAN | true | |
| update_deal_stage | BOOLEAN | false | |
| extract_followups | BOOLEAN | false | |
| created_at | TIMESTAMPTZ | now() | |
| updated_at | TIMESTAMPTZ | now() | Auto-updated via trigger |

Flat booleans instead of JSONB — easier to query, no parsing, simple to extend.

### `runs` table change

- `template_id` → `prompt_id` (FK → prompts ON DELETE SET NULL)

## Defaults for new users

- **Prompt Bank**: Seed one default prompt ("B2B Sales Call")
- **Tools**: Seed one row with create_contact=true, attach_note=true, rest false

## Pipeline at run time

```
webhook/upload
  → pick user's default active prompt (is_active=true, ORDER BY is_default DESC LIMIT 1)
  → fetch user's tool_configs row
  → processor.process(transcript, prompt, tool_config)
```

## UI

- **Sidebar**: "Templates" replaced by "Prompt Bank" and "Tools"
- **Prompt Bank page** (`/prompts`): List prompts, create/edit/delete, toggle active, set default
- **Tools page** (`/tools`): Single card with 5 toggle switches, auto-saves on toggle

## Migration strategy

1. Create `prompts` table with same structure as `templates` minus `crm_actions`
2. Create `tool_configs` table
3. Migrate existing `templates` data: copy prompt fields to `prompts`, extract crm_actions to `tool_configs`
4. Update `runs.template_id` → `runs.prompt_id`
5. Drop `templates` table
6. Update all backend routers, services, models
7. Update all frontend pages, components, types

## Files affected

### Backend
- `app/models/schemas.py` — replace Template* models with Prompt* and ToolConfig* models
- `app/routers/templates.py` → `app/routers/prompts.py` — CRUD for prompts
- `app/routers/tools.py` — new, GET + PATCH for tool_configs
- `app/routers/webhooks.py` — query prompts + tool_configs separately
- `app/routers/uploads.py` — same
- `app/routers/runs.py` — template_id → prompt_id, query tool_configs for rerun
- `app/services/processor.py` — accept prompt + tool_config instead of template
- `app/services/llm.py` — no change (already receives system_prompt + actions separately)
- `app/main.py` — register new routers

### Frontend
- `lib/types.ts` — replace Template types with Prompt + ToolConfig
- `app/(dashboard)/templates/` → `app/(dashboard)/prompts/` — rename + simplify
- `app/(dashboard)/tools/page.tsx` — new page with toggle switches
- `components/app/TemplateEditor.tsx` → `components/app/PromptEditor.tsx` — remove CRM actions
- `components/app/Sidebar.tsx` — update nav items

### Shared
- `shared/schema.sql` — new DDL
- `shared/seed.sql` — update seed data
- `shared/types.ts` — update types
