# Notepipe

**Notes flow into your CRM.**

Notepipe is a post-meeting CRM automation platform. When a Fireflies.ai meeting ends, a webhook fires, Claude extracts structured sales data from the transcript, and writes it to HubSpot or Pipedrive automatically.

Users configure extraction via prompt templates and toggle which CRM actions to run — contact creation, company lookup, note attachment, deal stage updates, and follow-up extraction.

## How it works

```
Fireflies webhook  -->  FastAPI backend  -->  Claude extraction  -->  CRM write
                              |                                          |
                        Supabase (auth + data)                   HubSpot / Pipedrive
```

1. A meeting ends in Fireflies.ai and a webhook fires
2. The backend fetches the full transcript via the Fireflies GraphQL API
3. Claude (claude-sonnet-4-5) extracts structured data using user-configured prompt templates
4. Extracted contacts, companies, notes, and follow-ups are written to the connected CRM
5. The run is logged with full extracted data and CRM results for review

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), ShadCN/UI, Tailwind CSS 4 |
| Backend | FastAPI, Python 3.12, uv |
| Database & Auth | Supabase (PostgreSQL + Row Level Security + Magic Link) |
| Transcripts | Fireflies.ai webhook + GraphQL API |
| CRM | HubSpot OAuth + Pipedrive OAuth |
| LLM | Anthropic Claude (claude-sonnet-4-5) |

## Getting started

### Prerequisites

- Python 3.12+
- Node.js 20+
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- A [Supabase](https://supabase.com) project
- API keys for Anthropic, Fireflies, and at least one CRM (HubSpot or Pipedrive)

### Database setup

Run the schema in your Supabase SQL editor:

```sql
-- Copy and run the contents of shared/schema.sql
-- Then run shared/seed.sql for default prompt templates
```

### Backend

```bash
cd backend
cp .env.example .env
# Fill in your environment variables in .env

uv sync
uv run uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Health check: `GET /health`.

### Frontend

```bash
cd frontend
cp .env.example .env.local
# Fill in your Supabase credentials and API URL

npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

## Project structure

```
notepipe-ai/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, router registration
│   │   ├── config.py            # Environment settings (Pydantic)
│   │   ├── middleware/auth.py   # Supabase JWT verification
│   │   ├── models/schemas.py    # Pydantic request/response models
│   │   ├── routers/             # API endpoints
│   │   │   ├── account.py       # Account deletion
│   │   │   ├── auth.py          # HubSpot + Pipedrive OAuth flows
│   │   │   ├── connections.py   # Connection CRUD + Fireflies API key
│   │   │   ├── dashboard.py     # Stats aggregation
│   │   │   ├── runs.py          # Run history + rerun
│   │   │   ├── templates.py     # Template CRUD + seed
│   │   │   ├── users.py         # User profile
│   │   │   └── webhooks.py      # Fireflies webhook receiver
│   │   └── services/            # Business logic
│   │       ├── fireflies.py     # Fireflies GraphQL client
│   │       ├── hubspot.py       # HubSpot API + token refresh
│   │       ├── llm.py           # Claude extraction service
│   │       ├── pipedrive.py     # Pipedrive API + token refresh
│   │       └── processor.py     # Orchestration: transcript → LLM → CRM
│   └── pyproject.toml
├── frontend/
│   ├── app/
│   │   ├── auth/                # Login + callback pages
│   │   └── (dashboard)/         # Protected dashboard pages
│   │       ├── page.tsx         # Overview with stats + recent runs
│   │       ├── connections/     # Fireflies + CRM connection management
│   │       ├── templates/       # Prompt template editor
│   │       ├── runs/            # Run history with filters
│   │       └── settings/        # Account settings
│   ├── components/
│   │   ├── app/                 # App-specific components
│   │   └── ui/                  # ShadCN primitives
│   └── lib/
│       ├── api.ts               # Typed API client with JWT auth
│       ├── types.ts             # TypeScript type definitions
│       └── supabase/            # Supabase client (browser + server)
├── shared/
│   ├── schema.sql               # Canonical database DDL
│   ├── seed.sql                 # Default prompt templates
│   └── types.ts                 # Canonical TypeScript types
└── docs/                        # Build specs and design system
```

## API endpoints

All endpoints are prefixed with `/api` and require a Supabase JWT in the `Authorization: Bearer <token>` header (except webhooks and health check).

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/webhooks/fireflies` | Fireflies webhook receiver |
| GET | `/api/connections` | List user connections |
| POST | `/api/connections/fireflies` | Save Fireflies API key |
| DELETE | `/api/connections/{service}` | Remove a connection |
| GET | `/api/connections/fireflies/webhook-url` | Get webhook URL for Fireflies config |
| GET | `/api/auth/hubspot` | Start HubSpot OAuth flow |
| GET | `/api/auth/hubspot/callback` | HubSpot OAuth callback |
| GET | `/api/auth/pipedrive` | Start Pipedrive OAuth flow |
| GET | `/api/auth/pipedrive/callback` | Pipedrive OAuth callback |
| GET | `/api/templates` | List templates |
| POST | `/api/templates` | Create template |
| PATCH | `/api/templates/{id}` | Update template |
| DELETE | `/api/templates/{id}` | Delete template |
| POST | `/api/templates/seed` | Seed default templates |
| GET | `/api/runs` | List runs (paginated, filterable) |
| GET | `/api/runs/{id}` | Get run details |
| POST | `/api/runs/{id}/rerun` | Re-run with current active template |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/users/me` | Current user profile |
| DELETE | `/api/account` | Delete account and all data |

## Deployment

**Backend** → [Railway](https://railway.app) (Dockerfile included)

**Frontend** → [Vercel](https://vercel.com) (zero-config Next.js deployment)

**Database** → [Supabase](https://supabase.com) (managed PostgreSQL with auth)

## License

Private — All rights reserved.
