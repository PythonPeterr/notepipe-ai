# Notepipe Deployment Guide

## Prerequisites

- GitHub repo pushed (public or private)
- Supabase project created (you already have this)
- Accounts on [Vercel](https://vercel.com) and [Railway](https://railway.app)

---

## 1. Backend — Railway

### Create the service

1. Go to [railway.app/new](https://railway.app/new)
2. Click **Deploy from GitHub repo**
3. Select your `notepipe-ai` repo
4. Railway will auto-detect the Dockerfile in `backend/`
5. Set **Root Directory** to `backend` in the service settings

### Set environment variables

In Railway → your service → **Variables**, add:

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
FIREFLIES_WEBHOOK_SECRET=<your random secret>
FRONTEND_URL=https://notepipe.vercel.app

HUBSPOT_CLIENT_ID=<from developers.hubspot.com>
HUBSPOT_CLIENT_SECRET=<from developers.hubspot.com>
HUBSPOT_REDIRECT_URI=https://<your-railway-url>/api/auth/hubspot/callback

PIPEDRIVE_CLIENT_ID=<from developers.pipedrive.com>
PIPEDRIVE_CLIENT_SECRET=<from developers.pipedrive.com>
PIPEDRIVE_REDIRECT_URI=https://<your-railway-url>/api/auth/pipedrive/callback

ATTIO_CLIENT_ID=<from app.attio.com>
ATTIO_CLIENT_SECRET=<from app.attio.com>
ATTIO_REDIRECT_URI=https://<your-railway-url>/api/auth/attio/callback

ZOHO_CLIENT_ID=<from api-console.zoho.com>
ZOHO_CLIENT_SECRET=<from api-console.zoho.com>
ZOHO_REDIRECT_URI=https://<your-railway-url>/api/auth/zoho/callback
```

### Generate a public URL

1. Go to **Settings → Networking**
2. Click **Generate Domain** (gives you `xxx.up.railway.app`)
3. Or add a custom domain (e.g., `api.notepipe.ai`)
4. **After getting the URL**, go back and update all `REDIRECT_URI` variables with the actual URL

### Verify

Visit `https://<your-railway-url>/health` — should return `{"status": "ok"}`

---

## 2. Frontend — Vercel

### Create the project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your `notepipe-ai` GitHub repo
3. Set **Root Directory** to `frontend`
4. Framework preset: **Next.js** (auto-detected)
5. Build command: `npm run build` (default)
6. Output directory: `.next` (default)

### Set environment variables

In Vercel → your project → **Settings → Environment Variables**, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=https://<your-railway-url>
```

**Do NOT set** `NEXT_PUBLIC_DEV_BYPASS_AUTH` in production.

### Custom domain

1. Go to **Settings → Domains**
2. Add `notepipe.ai` (or `app.notepipe.ai`)
3. Follow DNS instructions (CNAME to `cname.vercel-dns.com`)

### Verify

Visit your Vercel URL — should show the landing page. Click "Login" — should redirect to Supabase magic link flow.

---

## 3. Supabase — Final setup

### Auth redirect URLs

1. Go to **Supabase Dashboard → Authentication → URL Configuration**
2. Set **Site URL** to `https://notepipe.vercel.app` (or your custom domain)
3. Add **Redirect URLs**:
   - `https://notepipe.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (for local dev)

### pg_cron cleanup jobs

Run in **SQL Editor**:

```sql
-- Enable pg_cron extension first (Database → Extensions → pg_cron → Enable)

SELECT cron.schedule(
  'cleanup-old-runs',
  '0 3 * * *',
  $$SELECT cleanup_old_runs()$$
);

SELECT cron.schedule(
  'cleanup-webhook-events',
  '0 3 * * *',
  $$SELECT cleanup_webhook_events()$$
);
```

---

## 4. OAuth Apps — Register with production URLs

### HubSpot
1. Go to [developers.hubspot.com](https://developers.hubspot.com) → your app
2. Under **Auth**, set Redirect URL to:
   `https://<your-railway-url>/api/auth/hubspot/callback`

### Pipedrive
1. Go to [developers.pipedrive.com](https://developers.pipedrive.com) → your app
2. Set Callback URL to:
   `https://<your-railway-url>/api/auth/pipedrive/callback`

### Attio
1. Go to [app.attio.com](https://app.attio.com) → Settings → Developers
2. Set Redirect URI to:
   `https://<your-railway-url>/api/auth/attio/callback`

### Zoho
1. Go to [api-console.zoho.com](https://api-console.zoho.com) → your app
2. Set Authorized Redirect URI to:
   `https://<your-railway-url>/api/auth/zoho/callback`

### Fireflies
1. Go to [app.fireflies.ai/integrations/custom/webhooks](https://app.fireflies.ai/integrations/custom/webhooks)
2. Users set this up themselves from the Connections page — but you can test with your own account:
   - Webhook URL: `https://<your-railway-url>/api/webhooks/fireflies`
   - Secret: the value of your `FIREFLIES_WEBHOOK_SECRET`
   - Client Reference ID: your Supabase user ID

---

## 5. Post-deploy checklist

- [ ] `https://<railway-url>/health` returns `{"status": "ok"}`
- [ ] Frontend loads at your Vercel URL
- [ ] Magic link login works (check Supabase auth redirect URLs)
- [ ] After login, `/overview` page loads (API calls succeed = CORS is working)
- [ ] Connect HubSpot OAuth flow completes and redirects back
- [ ] Upload a .txt file on `/uploads` — run appears on `/runs`
- [ ] Check Railway logs for any errors during processing

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| CORS error in browser console | `FRONTEND_URL` env var wrong on Railway | Must match your Vercel URL exactly (including https://) |
| OAuth redirects to localhost | `REDIRECT_URI` env var still has localhost | Update all `*_REDIRECT_URI` vars in Railway |
| "Invalid API key" on login | Supabase anon key wrong | Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel |
| Magic link email not arriving | Supabase Site URL not set | Set Site URL in Supabase → Auth → URL Configuration |
| 401 on all API calls | JWT validation failing | Ensure `SUPABASE_URL` matches between frontend and backend |
| Webhook returns 401 | Wrong `FIREFLIES_WEBHOOK_SECRET` | Must match between Railway env var and Fireflies settings |
| Railway deploy fails | Missing env var | Check Railway build logs — Pydantic will error on missing required vars |
