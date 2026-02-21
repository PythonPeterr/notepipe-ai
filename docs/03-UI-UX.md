# Notepipe — UI/UX & Design System
**Agent 3 owns this document. Read ORCHESTRATION.md first.**
**Agent 1 must follow this document exactly. No deviations.**

---

## Design Reference: Peec.AI

Based on direct inspection of peec.ai screenshots. Replicate this aesthetic exactly.

### Key Visual Characteristics
- **Page background**: warm light gray (NOT white) — `#EFEFEF` / `zinc-100`
- **Cards/surfaces**: pure white `#FFFFFF` with subtle border + very soft shadow
- **Primary CTA button**: pure **black** background, white text, `rounded-md`
- **Secondary button**: white background, thin gray border, black text
- **Typography**: extremely bold headings (weight 900), lighter body text
- **Two-tone hero text**: first line dark near-black, second line medium gray — same font size, different color
- **Sidebar**: white background, minimal nav items, active state = thin left coral/red border accent
- **No blue primary color** — Peec uses black/white/gray only; colors appear in data viz only
- **Corners**: `rounded-xl` on cards, `rounded-md` on buttons and inputs
- **Spacing**: generous whitespace, airy feel

---

## ShadCN Setup

### Installation
```bash
npx shadcn@latest init
# Style: New York
# Base color: Zinc
# CSS variables: yes
```

### `globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 94%;
    --foreground: 0 0% 9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 9%;
    --primary: 0 0% 0%;
    --primary-foreground: 0 0% 100%;
    --secondary: 0 0% 100%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96%;
    --muted-foreground: 0 0% 42%;
    --accent: 0 0% 96%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 0 0% 89%;
    --input: 0 0% 89%;
    --ring: 0 0% 0%;
    --radius: 0.625rem;
  }
}

@layer base {
  * { @apply border-border; }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

### `tailwind.config.ts`
```typescript
import type { Config } from "tailwindcss"
import { fontFamily } from "tailwindcss/defaultTheme"

const config: Config = {
  darkMode: false,
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
}
export default config
```

### Font — `app/layout.tsx`
```tsx
import { Inter } from "next/font/google"
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "900"],
})
```

---

## Color Reference

| Token | Hex | Usage |
|---|---|---|
| Page bg | `#EFEFEF` | Body background |
| Card bg | `#FFFFFF` | All cards, sidebar |
| Border | `#E4E4E4` | Card borders, dividers |
| Text primary | `#171717` | Headings |
| Text secondary | `#6B6B6B` | Body copy |
| Text muted | `#A3A3A3` | Timestamps, placeholders |
| Button primary bg | `#000000` | Primary CTA |
| Button primary text | `#FFFFFF` | — |
| Button secondary bg | `#FFFFFF` | Secondary actions |
| Sidebar accent | `#E05A4E` | Active nav left border (coral) |
| Success | `#16A34A` | — |
| Error | `#DC2626` | — |
| Warning | `#D97706` | — |

---

## Typography

| Style | Class | Weight | Usage |
|---|---|---|---|
| Hero H1 line 1 | `text-5xl` | `font-black` 900 | Dark color |
| Hero H1 line 2 | `text-5xl` | `font-black` 900 | `text-neutral-400` |
| Page title | `text-2xl` | `font-bold` 700 | Dashboard page h1 |
| Section title | `text-base` | `font-semibold` 600 | Card headers |
| Body | `text-sm` | `font-normal` 400 | Content |
| Label | `text-xs` | `font-medium` 500 | Form labels, table headers |
| Muted | `text-sm` | `font-normal` 400 | `text-muted-foreground` |

---

## Layout Shell

```tsx
// app/(dashboard)/layout.tsx
<div className="min-h-screen bg-[#EFEFEF]">
  <div className="flex min-h-screen max-w-screen-xl mx-auto bg-white shadow-card rounded-xl overflow-hidden">
    <Sidebar />
    <main className="flex-1 bg-[#EFEFEF] p-6 overflow-auto">
      {children}
    </main>
  </div>
</div>
```

White app shell on gray background. Content area inside is gray. Cards within content are white. This creates the Peec depth effect.

---

## Sidebar

```tsx
<aside className="w-60 bg-white border-r border-border flex flex-col py-4">
  {/* Logo */}
  <div className="px-4 mb-6 flex items-center gap-2">
    <div className="h-6 w-6 bg-black rounded-sm" />
    <span className="font-bold text-sm">Notepipe</span>
  </div>

  {/* Nav */}
  <nav className="flex-1 px-2 space-y-0.5">
    {navItems.map(item => (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors relative",
          isActive
            ? "bg-neutral-50 text-neutral-900 font-medium before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:bg-[#E05A4E] before:rounded-full"
            : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
        )}
      >
        <item.icon className="h-4 w-4 flex-shrink-0" />
        {item.label}
      </Link>
    ))}
  </nav>

  {/* User */}
  <div className="px-4 pt-4 border-t border-border">
    <div className="flex items-center gap-2">
      <Avatar className="h-7 w-7">
        <AvatarFallback className="text-xs bg-neutral-100">{initials}</AvatarFallback>
      </Avatar>
      <p className="text-xs font-medium flex-1 truncate">{email}</p>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={signOut}>
        <LogOut className="h-3.5 w-3.5" />
      </Button>
    </div>
  </div>
</aside>
```

Nav items:
```tsx
const navItems = [
  { href: "/",            label: "Overview",    icon: LayoutDashboard },
  { href: "/connections", label: "Connections", icon: Plug },
  { href: "/templates",   label: "Templates",   icon: FileText },
  { href: "/runs",        label: "Run History", icon: History },
  { href: "/settings",    label: "Settings",    icon: Settings },
]
```

---

## Buttons

```tsx
// PRIMARY — black, Peec style
<Button className="bg-black text-white hover:bg-neutral-800 rounded-md">
  Connect
</Button>

// SECONDARY — outlined
<Button variant="outline" className="bg-white border-neutral-300 text-neutral-900 hover:bg-neutral-50">
  Cancel
</Button>

// GHOST
<Button variant="ghost" className="text-neutral-500 hover:text-neutral-900">
  View
</Button>

// ICON
<Button variant="ghost" size="icon" className="h-8 w-8">
  <MoreHorizontal className="h-4 w-4" />
</Button>
```

---

## Cards

```tsx
// Standard
<div className="bg-white rounded-xl border border-neutral-200 shadow-card p-6">
  {children}
</div>

// ShadCN Card
<Card className="rounded-xl shadow-card border-neutral-200">
  <CardHeader className="pb-3">
    <CardTitle className="text-base font-semibold">{title}</CardTitle>
  </CardHeader>
  <CardContent>{children}</CardContent>
</Card>
```

---

## Stat Cards

```tsx
<div className="grid grid-cols-4 gap-4">
  <div className="bg-white rounded-xl border border-neutral-200 shadow-card p-5">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Total Runs</span>
      <Zap className="h-4 w-4 text-neutral-400" />
    </div>
    <p className="text-3xl font-bold text-neutral-900">247</p>
    <p className="text-xs text-neutral-400 mt-1">All time</p>
  </div>
</div>
```

---

## Status Badges

```tsx
const statusStyles = {
  success: "bg-green-50 text-green-700 border-green-200",
  failed:  "bg-red-50 text-red-700 border-red-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
}

<span className={cn(
  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
  statusStyles[status]
)}>
  {status}
</span>
```

---

## Connection Card

```tsx
<div className="bg-white rounded-xl border border-neutral-200 shadow-card p-5">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-center">
        <img src="/icons/hubspot.svg" className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold">HubSpot</p>
        <p className="text-xs text-neutral-500">{connected ? workspaceName : "Not connected"}</p>
      </div>
    </div>
    <div className="flex items-center gap-2.5">
      {connected && (
        <span className="flex items-center gap-1 text-xs text-green-600">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Connected
        </span>
      )}
      <Button
        size="sm"
        className={cn("h-7 text-xs", connected
          ? "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
          : "bg-black text-white hover:bg-neutral-800"
        )}
      >
        {connected ? "Disconnect" : "Connect"}
      </Button>
    </div>
  </div>

  {/* Webhook URL — Fireflies only */}
  {showWebhookUrl && (
    <div className="mt-4 pt-4 border-t border-neutral-100">
      <p className="text-xs font-medium text-neutral-500 mb-1.5">Webhook URL</p>
      <div className="flex items-center gap-2 bg-neutral-50 rounded-md px-3 py-2 border border-neutral-200">
        <code className="text-xs text-neutral-600 flex-1 truncate">{webhookUrl}</code>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copy}>
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )}
</div>
```

---

## Run History Table

```tsx
<div className="bg-white rounded-xl border border-neutral-200 shadow-card overflow-hidden">
  <div className="flex items-center gap-2 p-4 border-b border-neutral-100">
    <Input placeholder="Search runs..." className="h-8 text-sm max-w-xs bg-neutral-50 border-neutral-200" />
    <Button variant="outline" size="sm" className="h-8 text-xs border-neutral-200">All status</Button>
    <Button variant="outline" size="sm" className="h-8 text-xs border-neutral-200">All CRMs</Button>
    <div className="ml-auto text-xs text-neutral-400">247 runs</div>
  </div>
  <Table>
    <TableHeader>
      <TableRow className="border-neutral-100 hover:bg-transparent">
        <TableHead className="text-xs font-medium text-neutral-400 uppercase tracking-wide h-9">Meeting</TableHead>
        <TableHead className="text-xs font-medium text-neutral-400 uppercase tracking-wide h-9">CRM</TableHead>
        <TableHead className="text-xs font-medium text-neutral-400 uppercase tracking-wide h-9">Status</TableHead>
        <TableHead className="text-xs font-medium text-neutral-400 uppercase tracking-wide h-9">Date</TableHead>
        <TableHead className="h-9" />
      </TableRow>
    </TableHeader>
    <TableBody>
      {runs.map(run => (
        <TableRow key={run.id} className="border-neutral-100 hover:bg-neutral-50">
          <TableCell className="text-sm font-medium py-3">{run.meeting_title}</TableCell>
          <TableCell className="py-3">
            <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-md border border-neutral-200 capitalize">
              {run.crm_target}
            </span>
          </TableCell>
          <TableCell className="py-3"><StatusBadge status={run.status} /></TableCell>
          <TableCell className="text-xs text-neutral-400 py-3">{format(run.created_at, "MMM d, HH:mm")}</TableCell>
          <TableCell className="py-3 text-right">
            <Button variant="ghost" size="sm" className="h-7 text-xs text-neutral-500">View</Button>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

---

## Template Editor (Sheet)

```tsx
<Sheet>
  <SheetContent className="w-[480px] sm:max-w-[480px] bg-white p-0">
    <div className="p-6 border-b border-neutral-100">
      <SheetTitle className="text-base font-semibold">Edit Template</SheetTitle>
      <SheetDescription className="text-sm text-neutral-500 mt-0.5">Configure AI extraction and CRM actions.</SheetDescription>
    </div>
    <div className="p-6 space-y-5">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-neutral-600">Template Name</Label>
        <Input className="h-9 text-sm bg-neutral-50 border-neutral-200" placeholder="e.g. B2B Sales Call" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-neutral-600">Custom Instructions</Label>
        <Textarea className="text-sm bg-neutral-50 border-neutral-200 resize-none min-h-[100px]" placeholder="Additional AI instructions..." />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium text-neutral-600">CRM Actions</Label>
        <div className="bg-neutral-50 rounded-lg border border-neutral-200 divide-y divide-neutral-100">
          {actions.map(action => (
            <div key={action.key} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-neutral-800">{action.label}</p>
                <p className="text-xs text-neutral-400">{action.description}</p>
              </div>
              <Switch checked={action.enabled} onCheckedChange={v => updateAction(action.key, v)} />
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="p-6 border-t border-neutral-100">
      <Button className="w-full bg-black text-white hover:bg-neutral-800 h-9 text-sm">Save Template</Button>
    </div>
  </SheetContent>
</Sheet>
```

---

## Empty State

```tsx
<div className="flex flex-col items-center justify-center py-20 text-center">
  <div className="h-11 w-11 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mb-4">
    <Zap className="h-5 w-5 text-neutral-400" />
  </div>
  <p className="text-sm font-semibold text-neutral-800">No runs yet</p>
  <p className="text-sm text-neutral-400 mt-1 max-w-xs">Connect Fireflies and a CRM to start automating your post-meeting workflow.</p>
  <Button className="mt-5 h-8 text-xs bg-black text-white hover:bg-neutral-800">Connect tools</Button>
</div>
```

---

## Login Page

```tsx
<div className="min-h-screen bg-[#EFEFEF] flex items-center justify-center p-4">
  <div className="bg-white rounded-2xl border border-neutral-200 shadow-card w-full max-w-sm p-8">
    <div className="flex items-center gap-2 mb-8">
      <div className="h-6 w-6 bg-black rounded-sm" />
      <span className="font-bold text-sm">Notepipe</span>
    </div>
    <h1 className="text-xl font-bold text-neutral-900 mb-1">Sign in</h1>
    <p className="text-sm text-neutral-500 mb-6">Enter your email to receive a magic link.</p>
    <div className="space-y-3">
      <Input type="email" placeholder="you@company.com" className="h-9 text-sm bg-neutral-50 border-neutral-200" />
      <Button className="w-full h-9 text-sm bg-black text-white hover:bg-neutral-800">Send magic link</Button>
    </div>
  </div>
</div>
```

---

## Skeletons

```tsx
// Stat card
<div className="bg-white rounded-xl border border-neutral-200 p-5">
  <Skeleton className="h-3 w-24 mb-3" />
  <Skeleton className="h-8 w-16 mb-1" />
  <Skeleton className="h-3 w-20" />
</div>

// Table row
<TableRow>
  <TableCell><Skeleton className="h-3.5 w-48" /></TableCell>
  <TableCell><Skeleton className="h-5 w-16 rounded-md" /></TableCell>
  <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
  <TableCell><Skeleton className="h-3.5 w-20" /></TableCell>
</TableRow>
```

---

## Toasts

```tsx
// layout.tsx
<Toaster position="bottom-right" toastOptions={{
  className: "bg-white border border-neutral-200 shadow-card text-sm rounded-xl",
}} />

toast.success("Template saved")
toast.error("Failed to connect HubSpot")
```

---

## ShadCN Install Commands

```bash
npx shadcn@latest add button card input label textarea badge table sheet switch skeleton separator dropdown-menu avatar sonner dialog tabs
```

---

## Spacing

| Context | Value |
|---|---|
| Page padding | `p-6` |
| Card padding | `p-5` or `p-6` |
| Card gap | `gap-4` |
| Form field gap | `space-y-5` |
| Label to input | `space-y-1.5` |
| Stat grid | `grid-cols-4 gap-4` |
| Max width | `max-w-screen-xl mx-auto` |

---

## Hard Rules for Agent 1

1. Page bg is `#EFEFEF` — cards are white ON gray
2. Primary buttons are **black** — never blue, never colored
3. Active sidebar item = thin left border `before:w-0.5 before:bg-[#E05A4E]`, not colored background
4. Font weight 900 (`font-black`) for hero only; section titles are `font-semibold`
5. No blue in UI chrome — blue only in charts/data if needed
6. All cards: `rounded-xl border border-neutral-200 shadow-card`
7. Icons: `lucide-react` only, `h-4 w-4` standard
8. No dark mode
9. Use `neutral-*` Tailwind scale throughout, not `gray-*` or `zinc-*`
10. Log all deviations in `SHARED_STATE.md`
