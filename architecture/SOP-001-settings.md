# SOP-001: Settings Page Architecture

**Layer:** Architecture (Layer 1)
**Status:** Active
**Last Updated:** 2026-03-29

---

## Goal

The Settings page (`/settings`) provides authenticated users with control over their account, security, notification preferences, and UI appearance.

---

## Inputs

- `user` object from `useAuth()` hook (Supabase auth session)
- Local state for all form fields

## Outputs

- `supabase.auth.updateUser()` calls for profile/password changes
- Future: `user_settings` table read/write for persisted preferences

---

## Tab Architecture

### 1. Profile Tab
- Fields: `display_name`, `email` (read-only)
- Save: `supabase.auth.updateUser({ data: { full_name } })`
- Toast: success/error

### 2. Security Tab
- Fields: `new_password`, `confirm_password` (toggle visibility)
- Validation: passwords match, min 6 chars
- Save: `supabase.auth.updateUser({ password })`
- Toast: success/error

### 3. Notifications Tab ⚠️ UI-ONLY
- Toggles: Email, Approvals, Messages, Billing
- **Current State:** Local state only — resets on refresh
- **Required:** `user_settings` Supabase table with RLS policy
- Toast: stub success message only

### 4. Appearance Tab ⚠️ STUB
- Toggles: Compact Mode, Animations
- Theme Swatches: Dark, Slate, Midnight
- **Current State:** Theme swatches fire `toast.info("coming soon")`
- **Required:** Wire `next-themes` ThemeProvider in `App.tsx`

---

## Edge Cases

- If user changes display name but has no `user_metadata` yet → initialize as empty string ✅ (handled in useState default)
- Password field left empty → button disabled ✅ (handled via `!newPw || !confirmPw`)
- Supabase session expired during save → catch block fires `toast.error()` ✅

---

## Known Gaps (TODOs)

| Gap | Priority | Fix |
|---|---|---|
| Notification persistence | Medium | Add `user_settings` table migration |
| Theme switching | Low | Wire `next-themes` in `App.tsx` |
| Integrations tab | Low | New tab for webhook / API key management |
| Danger Zone tab | Low | Account deletion + data export |
