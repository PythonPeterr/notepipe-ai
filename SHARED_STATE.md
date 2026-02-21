# SHARED_STATE
Last updated: 2026-02-21

## API Contract
- Backend dev URL: http://localhost:8000
- Backend prod URL: https://notepipe-api.railway.app
- Frontend dev URL: http://localhost:3000
- Frontend prod URL: https://notepipe.vercel.app

## Backend Endpoints — ALL COMPLETE
All routes prefixed with /api (e.g., /api/connections)
- [x] POST /webhooks/fireflies
- [x] GET  /connections
- [x] POST /connections/fireflies
- [x] DELETE /connections/{service}
- [x] GET  /connections/fireflies/webhook-url
- [x] GET  /auth/hubspot
- [x] GET  /auth/hubspot/callback
- [x] GET  /auth/pipedrive
- [x] GET  /auth/pipedrive/callback
- [x] GET  /templates
- [x] POST /templates
- [x] PATCH /templates/{id}
- [x] DELETE /templates/{id}
- [x] POST /templates/seed
- [x] GET  /runs
- [x] GET  /runs/{id}
- [x] POST /runs/{id}/rerun
- [x] GET  /users/me
- [x] GET  /dashboard/stats
- [x] DELETE /account

## Frontend Pages — ALL COMPLETE
- [x] / (landing page — public, unauthenticated)
- [x] /auth/login
- [x] /auth/callback
- [x] /overview (dashboard — authenticated)
- [x] /connections
- [x] /templates
- [x] /runs
- [x] /runs/[id] (run detail)
- [x] /settings

## Testing
- [x] Backend: 23 pytest tests (health, users, connections, dashboard, account, templates)
- [x] Frontend: TypeScript build passes clean

## Design Decisions
- Light mode only
- Primary buttons: black (#000000)
- Sidebar active accent: coral (#E05A4E)
- Page background: #EFEFEF
- Card background: white
- Font: Inter, weights 400/500/600/700/900
- Landing page: framer-motion animations (Peec.AI style)

## Blockers
(none)

## Deviations from Spec
- Dashboard moved from / to /overview (/ is now landing page)
- Endpoint renamed from /retry to /rerun (matches frontend convention)
