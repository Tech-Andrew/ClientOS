# task_plan.md — ClientOS B.L.A.S.T. Task Plan

---

## 🎯 North Star
Build **ClientOS** — a self-hosted client management OS for freelancers and agencies. A single dashboard to manage clients, projects, tasks, invoices, approvals, and messaging with a polished UI and Supabase backend.

---

## 📊 Phase Status

| Phase | Name | Status |
|---|---|---|
| 0 | Initialization | ✅ Complete |
| 1 | Blueprint | ✅ Complete (foundation built) |
| 2 | Link | ✅ Supabase connected |
| 3 | Architect | 🔧 In Progress |
| 4 | Stylize | ⬜ Pending |
| 5 | Trigger | ⬜ Pending |

---

## ✅ Phase 0 — Initialization

- [x] Create `gemini.md` (Project Constitution)
- [x] Create `task_plan.md` (this file)
- [x] Create `findings.md`
- [x] Create `progress.md`
- [x] Audit existing codebase and document schema

---

## ✅ Phase 1 — Blueprint

- [x] React + Vite + TypeScript project scaffolded
- [x] Supabase project connected (`asuqujrgrdoxarqldtif`)
- [x] Core data schema defined (clients, projects, tasks, invoices, approvals)
- [x] Authentication flow (Supabase Auth + ProtectedRoute)
- [x] App routing defined (10 routes)
- [x] Base UI system: shadcn/ui + Tailwind + glass-card pattern

---

## ✅ Phase 2 — Link

- [x] Supabase client initialized (`src/integrations/supabase/client.ts`)
- [x] `.env` credentials configured
- [x] RLS policies applied to all tables
- [x] Auth flow verified (login/logout working)

---

## 🔧 Phase 3 — Architect (Current Focus)

### Settings Page (`/settings`)
- [x] Profile tab: display name update via `supabase.auth.updateUser`
- [x] Security tab: password change flow
- [x] Notifications tab: UI toggles (no persistence yet)
- [x] Appearance tab: theme swatches + compact/animation toggles
- [ ] **TODO:** Persist notification preferences to Supabase (user_settings table)
- [ ] **TODO:** Implement real theme switching (CSS variable injection)
- [ ] **TODO:** Add `Integrations` tab (webhook/API key management)
- [ ] **TODO:** Add `Danger Zone` tab (account deletion, data export)

### Other Pages — Remaining TODOs
- [ ] Notifications persistence (user_settings table migration)
- [ ] Client portal token validation hardening
- [ ] Invoice PDF generation (Supabase Edge Function)
- [ ] Real-time messages (Supabase Realtime subscription)

---

## ⬜ Phase 4 — Stylize

- [ ] Audit all pages for visual consistency
- [ ] Ensure mobile-responsive layouts on all pages
- [ ] Polish empty states with illustrations
- [ ] Add loading skeletons to data-heavy pages

---

## ⬜ Phase 5 — Trigger

- [ ] Deploy Supabase Edge Functions (invoice emails, portal token generation)
- [ ] Set up production environment variables
- [ ] Configure custom domain (optional)
- [ ] Write deployment runbook in `architecture/`

---

## 🚨 Blocked Items

| Item | Blocker |
|---|---|
| Notification persistence | Needs `user_settings` table migration |
| Theme switching | Needs CSS variable strategy decision |
| Invoice PDF | Needs Edge Function + PDF library decision |
