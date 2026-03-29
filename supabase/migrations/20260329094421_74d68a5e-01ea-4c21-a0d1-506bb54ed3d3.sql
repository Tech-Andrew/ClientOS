
-- Messages table for real-time project-based chat
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  sender_type text NOT NULL DEFAULT 'business',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
  ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON public.messages FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Client update posts (AI-generated summaries)
CREATE TABLE public.client_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own updates"
  ON public.client_updates FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create updates"
  ON public.client_updates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own updates"
  ON public.client_updates FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Public read for portal access
CREATE POLICY "Anon can read updates for portal"
  ON public.client_updates FOR SELECT TO anon
  USING (true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
