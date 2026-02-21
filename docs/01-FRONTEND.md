# Notepipe — Frontend Specification
**Agent 1 owns this document. Read ORCHESTRATION.md first.**

---

## Stack

| Item | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v3 + ShadCN/UI |
| Auth client | `@supabase/ssr` |
| API client | Native `fetch` with typed wrappers |
| State | React Context + `useState` (no Redux) |
| Forms | `react-hook-form` + `zod` |
| Icons | `lucide-react` |
| Fonts | Inter (via `next/font/google`) |
| Deployment | Vercel |

---

## Project Structure

```
/app
  /auth
    /callback/route.ts        # Supabase magic link callback
    /login/page.tsx
  /(dashboard)
    layout.tsx                # Sidebar + topbar shell
    /page.tsx                 # Dashboard home (recent runs)
    /connections/page.tsx     # Connect Fireflies + CRM
    /templates/page.tsx       # Prompt template management
    /runs/page.tsx            # Automation run history
    /settings/page.tsx        # Account + billing
/components
  /ui/                        # ShadCN primitives (do not modify)
  /app/                       # App-specific composed components
    Sidebar.tsx
    TopBar.tsx
    RunCard.tsx
    TemplateEditor.tsx
    ConnectionCard.tsx
    StatusBadge.tsx
/lib
  supabase/
    client.ts                 # Browser Supabase client
    server.ts                 # Server Supabase client (RSC)
  api.ts                      # Typed fetch wrappers to FastAPI backend
  types.ts                    # Shared TypeScript types (mirror backend models)
/middleware.ts                # Auth guard — redirect unauthenticated users
```

---

## Pages & Components

### `/auth/login`
- Single centered card on white background
- Notepipe logo top center
- Email input + "Send magic link" button
- On submit: call `supabase.auth.signInWithOtp({ email })`
- Show success state: "Check your email"
- No password field, no social OAuth

### `/auth/callback/route.ts`
- Exchange code for session via `supabase.auth.exchangeCodeForSession()`
- Redirect to `/` on success

### `/(dashboard)/layout.tsx`
- Left sidebar (240px fixed width, collapsible on mobile)
- Sidebar items: Dashboard, Connections, Templates, Runs, Settings
- Top bar: workspace name (left) + user avatar/logout (right)
- Main content area: `flex-1` with `p-6` padding

### `/(dashboard)/page.tsx` — Dashboard Home
- Summary stats row: Total Runs, Success Rate, Contacts Created, Meetings Processed
  - Use ShadCN `Card` for each stat
- Recent Runs table (last 10): meeting title, CRM, status badge, timestamp, link to detail
- "Connect your tools" empty state if no connections exist yet

### `/connections` — Integrations
- Two `ConnectionCard` components side by side: Fireflies, then CRM section
- **Fireflies card**: input for API key + webhook URL display (read-only, copy button)
- **CRM section**: two cards — HubSpot and Pipedrive
  - Each has "Connect" button → triggers OAuth redirect to backend `/auth/hubspot` or `/auth/pipedrive`
  - Connected state: show workspace name + "Disconnect" button
- Status indicator: green dot = connected, gray = not connected

### `/templates` — Prompt Templates
- List of templates (default 4 pre-built + user custom)
- Each template: name, description, CRM target, toggle (active/inactive)
- "New template" button → opens Sheet (slide-over panel)
- Template editor inside Sheet:
  - Name input
  - System prompt textarea (for LLM)
  - Toggles for each CRM action:
    - Create/update contact
    - Create/update company
    - Attach meeting note
    - Update deal stage
    - Extract follow-ups
  - Save button

### `/runs` — Run History
- Filterable table: search by meeting name, filter by status (success/failed/pending), filter by CRM
- Each row expandable: shows extracted fields, what was written to CRM
- Re-run button per row (re-processes same transcript with current template)

### `/settings`
- Account section: email (read-only), logout button
- Danger zone: delete account

---

## Auth Flow

```
User visits app
  → middleware.ts checks Supabase session
  → No session → redirect to /auth/login
  → Session exists → render dashboard

User clicks "Send magic link"
  → supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: '/auth/callback' } })
  → User clicks email link
  → /auth/callback exchanges code for session
  → Redirect to /
```

---

## API Communication

All calls go to the FastAPI backend. Base URL from env: `NEXT_PUBLIC_API_URL`.

Every request includes the Supabase JWT in the Authorization header:

```typescript
// lib/api.ts
const getAuthHeaders = async () => {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  }
}

export const api = {
  get: async (path: string) => {
    const headers = await getAuthHeaders()
    return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, { headers })
  },
  post: async (path: string, body: unknown) => {
    const headers = await getAuthHeaders()
    return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
      method: 'POST', headers, body: JSON.stringify(body)
    })
  },
  // patch, delete same pattern
}
```

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

---

## Key Rules for Agent 1

1. **Never** call Supabase directly from client components for data — always go through FastAPI backend
2. Use Supabase client-side **only** for auth (session, signIn, signOut)
3. All pages inside `/(dashboard)` are protected by middleware — no need for per-page auth checks
4. Use ShadCN components from `/components/ui/` — do not install other component libraries
5. Follow the design system in `03-UI-UX.md` exactly — no custom colors or fonts outside that spec
6. Export all TypeScript types from `lib/types.ts` — keep in sync with backend models
7. `middleware.ts` must check session server-side using `@supabase/ssr`

---

## Pre-built Templates (hardcoded defaults, seeded on first user login)

| Name | Description |
|---|---|
| B2B Sales Call | Extracts contact, company, deal stage, budget, follow-ups |
| Discovery Call | Extracts pain points, decision makers, timeline, next steps |
| Recruitment Interview | Extracts candidate name, role, assessment, next steps |
| Customer Success | Extracts health score signals, risks, action items |
