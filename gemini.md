# gemini.md — ClientOS Project Constitution
> **This file is LAW.** Update only when: a schema changes, a rule is added, or architecture is modified.

---

## 🏠 Project Identity

| Field | Value |
|---|---|
| **Project Name** | ClientOS |
| **Stack** | React 18 + TypeScript + Vite + Tailwind CSS v3 + shadcn/ui |
| **State Management** | TanStack Query v5 (server state), React useState (local UI state) |
| **Backend** | Supabase (Postgres + Auth + RLS + Edge Functions) |
| **Animation** | Framer Motion v11 |
| **Routing** | React Router DOM v6 |
| **Forms** | React Hook Form + Zod |
| **Notifications** | Sonner (toast) |

---

## 🗄️ Data Schema

### Supabase Tables

#### `clients`
```typescript
{
  id: string;           // UUID PK
  user_id: string;      // FK → auth.users
  name: string;
  email: string | null;
  company: string | null;
  status: 'onboarding' | 'active' | 'paused' | 'archived';
  avatar_initial: string | null;
  revenue_mtd: number;  // default 0
  created_at: string;   // timestamptz
  updated_at: string;   // timestamptz
}
```

#### `projects`
```typescript
{
  id: string;           // UUID PK
  user_id: string;      // FK → auth.users
  client_id: string;    // FK → clients.id (CASCADE DELETE)
  name: string;
  status: 'planning' | 'in-progress' | 'review' | 'completed';
  progress: number;     // 0–100
  created_at: string;
  updated_at: string;
}
```

#### `tasks`
```typescript
{
  id: string;           // UUID PK
  user_id: string;      // FK → auth.users
  project_id: string;   // FK → projects.id (CASCADE DELETE)
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  is_milestone: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
```

#### `invoices`
```typescript
{
  id: string;           // UUID PK
  user_id: string;      // FK → auth.users
  client_id: string;    // FK → clients.id (CASCADE DELETE)
  invoice_number: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  due_date: string | null; // date
  created_at: string;
  updated_at: string;
}
```

#### `approvals`
```typescript
{
  id: string;           // UUID PK
  user_id: string;      // FK → auth.users
  client_id: string;    // FK → clients.id (CASCADE DELETE)
  project_id: string;   // FK → projects.id (CASCADE DELETE)
  title: string;
  type: string;         // default 'deliverable'
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}
```

#### `messages` *(from migration ~2)*
```typescript
{
  id: string;
  user_id: string;
  client_id: string;    // FK → clients.id
  content: string;
  sender: 'agency' | 'client';
  created_at: string;
}
```

---

## 🏗️ Architectural Invariants

1. **RLS is mandatory.** Every table has Row Level Security. All policies use `auth.uid() = user_id`.
2. **No direct DB writes from the UI without `user_id` guard** — Supabase handles this via RLS, but always set `user_id` explicitly on inserts.
3. **Auth is via Supabase Auth** (`useAuth` hook wraps `supabase.auth`). Protected routes use `<ProtectedRoute>`.
4. **Client portal** (`/portal/:token`) is the ONLY unauthenticated route besides `/auth`.
5. **Framer Motion** is used for all page/section entry animations (`initial` + `animate` pattern).
6. **Glass-card pattern**: All primary content cards use `className="glass-card rounded-xl p-6"`.
7. **AppLayout wrapper**: Every internal page is wrapped in `<AppLayout>` (sidebar + content area).
8. **Toast feedback**: All async actions use `toast.success()` / `toast.error()` from `sonner`.
9. **No secrets in code.** All keys live in `.env` as `VITE_SUPABASE_*` variables.

---

## 🔐 Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project REST URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | Project ID reference |

---

## 📋 Behavioral Rules

- **Tone:** Professional, clean, minimal. No fluff copy.
- **Do NOT** hardcode user IDs or bypass RLS.
- **Do NOT** expose edge function secrets in the frontend bundle.
- **Do NOT** mutate Supabase tables without optimistic update + error rollback on critical paths.
- **Notifications** tab in Settings is currently UI-only (no persistence yet — mark as TODO).
- **Appearance** tab theme switcher is stub-only (UI shows swatches, no actual theme change yet).

---

## 🗺️ Page Inventory

| Route | File | Status |
|---|---|---|
| `/auth` | `Auth.tsx` | ✅ Working |
| `/` | `Index.tsx` | ✅ Working (Dashboard) |
| `/clients` | `Clients.tsx` | ✅ Working |
| `/clients/:id` | `ClientWorkspace.tsx` | ✅ Working |
| `/projects` | `Projects.tsx` | ✅ Working |
| `/approvals` | `Approvals.tsx` | ✅ Working |
| `/messages` | `Messages.tsx` | ✅ Working |
| `/billing` | `Billing.tsx` | ✅ Working |
| `/value` | `ValueDashboard.tsx` | ✅ Working |
| `/settings` | `Settings.tsx` | 🔧 In Progress |
| `/portal/:token` | `ClientPortal.tsx` | ✅ Working |

---

## 🔧 Maintenance Log

| Date | Change | Author |
|---|---|---|
| 2026-03-29 | Constitution initialized via B.L.A.S.T. Protocol 0 | System Pilot |
