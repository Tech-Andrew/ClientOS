
-- Table to store portal access tokens for clients
CREATE TABLE public.client_portal_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_portal_tokens ENABLE ROW LEVEL SECURITY;

-- Business owners can manage their own tokens
CREATE POLICY "Users can manage their portal tokens"
  ON public.client_portal_tokens FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public read for portal access (token-based, checked in app)
CREATE POLICY "Anyone can read tokens for portal access"
  ON public.client_portal_tokens FOR SELECT
  TO anon, authenticated
  USING (true);
