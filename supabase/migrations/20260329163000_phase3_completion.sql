-- 1. Create user_settings table
CREATE TABLE public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications boolean NOT NULL DEFAULT true,
  app_notifications boolean NOT NULL DEFAULT true,
  marketing_emails boolean NOT NULL DEFAULT false,
  theme text NOT NULL DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings"
  ON public.user_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 2. Create api_keys table
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL,
  prefix text NOT NULL,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own API keys"
  ON public.api_keys FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 3. Create webhooks table
CREATE TABLE public.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  endpoint_url text NOT NULL,
  secret_key text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  events text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own webhooks"
  ON public.webhooks FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER webhooks_updated_at
  BEFORE UPDATE ON public.webhooks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 4. Portal Token Verification Helper
CREATE OR REPLACE FUNCTION public.verify_portal_access(p_client_id uuid)
RETURNS boolean AS $$
DECLARE
  v_headers json;
  v_token text;
BEGIN
  BEGIN
    v_headers := current_setting('request.headers', true)::json;
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;
  
  IF v_headers IS NULL THEN
    RETURN false;
  END IF;

  v_token := v_headers->>'x-portal-token';
  
  IF v_token IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.client_portal_tokens
    WHERE token = v_token 
      AND client_id = p_client_id 
      AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Add Anon Policies mapping verify_portal_access() to tables
CREATE POLICY "Portal access to clients"
  ON public.clients FOR SELECT TO anon
  USING (verify_portal_access(id));

CREATE POLICY "Portal access to projects"
  ON public.projects FOR SELECT TO anon
  USING (verify_portal_access(client_id));

CREATE POLICY "Portal access to tasks"
  ON public.tasks FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = public.tasks.project_id AND verify_portal_access(p.client_id)
    )
  );

CREATE POLICY "Portal access to invoices"
  ON public.invoices FOR SELECT TO anon
  USING (verify_portal_access(client_id));

CREATE POLICY "Portal access to read messages"
  ON public.messages FOR SELECT TO anon
  USING (verify_portal_access(client_id));

CREATE POLICY "Portal access to send messages"
  ON public.messages FOR INSERT TO anon
  WITH CHECK (
    verify_portal_access(client_id) 
    AND sender_type = 'client'
  );
