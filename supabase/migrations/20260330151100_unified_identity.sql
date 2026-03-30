-- Add Auth Provider tracking to Client/Profile system
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS auth_provider text DEFAULT 'email';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS firebase_uid text UNIQUE;

-- Enforce ClientFlow OS identity policy: 1 Identity per email
-- This ensures that Apple users can't accidentally create duplicate accounts if they use the same email via Google.
-- However, we'll keep it flexible for now or use the existing email-based lookup.
