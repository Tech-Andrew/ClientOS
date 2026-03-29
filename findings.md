# findings.md — Research, Discoveries & Constraints

---

## 🔍 Codebase Audit (2026-03-29)

### Stack Confirmed
- **Framework:** React 18.3 + Vite 5.4 + TypeScript 5.8
- **CSS:** Tailwind CSS v3 + shadcn/ui (Radix primitives)
- **Backend:** Supabase JS v2.100 (Auth + Postgres + RLS)
- **State:** TanStack Query v5 for server state
- **Animation:** Framer Motion v11
- **Package Manager:** npm (also has bun.lock — dual lockfiles present)

### Key Files
| File | Purpose |
|---|---|
| `src/integrations/supabase/client.ts` | Supabase singleton client |
| `src/hooks/useAuth.tsx` | Auth context provider + hook |
| `src/components/AppLayout.tsx` | Wrapper: sidebar + outlet |
| `src/components/AppSidebar.tsx` | Nav links + user info |
| `src/index.css` | Global CSS vars (glass-card, colors) |

---

## ⚠️ Constraints & Gotchas

### 1. Dual Lockfile Warning
Both `bun.lock` and `package-lock.json` exist. This means the project was initialized with Bun but may have had npm operations run on it too. **Use `npm` for consistency** unless the user confirms Bun is preferred. Do not mix.

### 2. Notification Preferences — No Persistence
`Settings.tsx` notification toggles are local state only. They reset on page refresh. A `user_settings` table is needed in Supabase to persist these.

### 3. Theme Switching — Stub Only
The Appearance tab has 3 color swatches (Dark, Slate, Midnight) but clicking them only triggers `toast.info("...coming soon")`. Real implementation requires:
- A CSS variable injection strategy (e.g., `data-theme` on `<html>`)
- Or `next-themes` integration (already installed as a dependency!)

### 4. `next-themes` Already Installed
`next-themes ^0.3.0` is in `package.json` but NOT wired up. The `ThemeProvider` is not wrapping `App.tsx`. This is the correct library to use for theme switching.

### 5. ClientPortal Route is Public
`/portal/:token` bypasses `<ProtectedRoute>`. Token validation logic in `ClientPortal.tsx` should be audited before production.

### 6. `lovable-tagger` in devDeps
`lovable-tagger ^1.1.13` is a dev dependency — this project originated from the Lovable.dev AI platform. Component tagging metadata may be present but is harmless in production builds.

### 7. Migrations Show Messages Table
Migration `20260329094421` likely adds the `messages` table (898 bytes). The `Messages.tsx` page exists and is in routing.

---

## 📦 Useful Libraries Already Installed (Not Yet Fully Used)

| Library | Status | Use Case |
|---|---|---|
| `next-themes` | Installed, NOT wired | Dark/light/custom theme switching |
| `framer-motion` | Wired on most pages | Need to audit all pages for animation consistency |
| `react-hook-form` + `zod` | Used in some modals | Should be used in all forms for validation |
| `recharts` | Used in dashboard | Available for more analytics views |
| `embla-carousel-react` | Installed | Could be used for onboarding flows |

---

## 🔗 External Services

| Service | Status | Notes |
|---|---|---|
| Supabase | ✅ Live | Project: `asuqujrgrdoxarqldtif` |
| Email (SMTP) | ❓ Unknown | Supabase Auth handles magic links; custom email TBD |
| PDF Generation | ❌ Not set up | Invoice PDF feature needs Edge Function |
| Stripe/Billing | ❌ Not set up | Billing page is internal UI only, no payment processor |
