# SOP-000: Project Architecture Overview

**Layer:** Architecture (Layer 1)
**Status:** Active
**Last Updated:** 2026-03-29

---

## System Overview

ClientFlow is a client management OS for freelancers and agencies. It provides a unified dashboard for managing clients, projects, tasks, invoices, approvals, and messaging.

---

## Architecture Layers

```
┌─────────────────────────────────────────────┐
│  Layer 1: Architecture (architecture/)      │
│  SOPs in Markdown — define the "how-to"     │
│  Update SOPs BEFORE updating code            │
├─────────────────────────────────────────────┤
│  Layer 2: Navigation (React Router + Auth)  │
│  Decision layer — routes, guards, context   │
│  Handled by: App.tsx, ProtectedRoute.tsx    │
├─────────────────────────────────────────────┤
│  Layer 3: Tools (Supabase + Edge Functions) │  
│  Deterministic operations — DB, Auth, RPC   │
│  Secrets in .env, never hardcoded           │
└─────────────────────────────────────────────┘
```

---

## Data Flow

```
User Action
    ↓
React Component (local state + TanStack Query)
    ↓
Supabase Client (supabase.from() or supabase.auth)
    ↓
Supabase Postgres (RLS enforced — auth.uid() = user_id)
    ↓
Toast feedback (sonner) + Query invalidation
```

---

## SOP Index

| File | Scope |
|---|---|
| `SOP-000-overview.md` | This file — system overview |
| `SOP-001-settings.md` | Settings page logic & gaps |

---

## Routing Guard Pattern

```tsx
// All internal pages wrap their element in <ProtectedRoute>
<Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />

// Only public routes — no guard
<Route path="/auth" element={<Auth />} />
<Route path="/portal/:token" element={<ClientPortal />} />
```

## Insert Pattern (Always set user_id)

```typescript
const { data, error } = await supabase
  .from('clients')
  .insert({
    user_id: user.id,  // ← ALWAYS explicit
    name,
    email,
    // ...
  });
```

## Query Pattern (TanStack Query v5)

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['clients'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
});
```
