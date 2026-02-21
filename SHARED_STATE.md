# SHARED_STATE
Last updated: 2026-02-21 by Agent 4

## API Contract
- Backend dev URL: http://localhost:8000
- Backend prod URL: https://notepipe-api.railway.app
- Frontend dev URL: http://localhost:3000
- Frontend prod URL: https://notepipe.vercel.app

## Backend Endpoints (Agent 2 marks complete)
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
(none)

## Deviations from Spec
(none)
