
-- Create storage bucket for client files
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-files', 'client-files', false);

-- Allow authenticated users to upload files
CREATE POLICY "Users can upload client files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'client-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to view their files
CREATE POLICY "Users can view their client files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'client-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their files
CREATE POLICY "Users can delete their client files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'client-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Table to track file metadata
CREATE TABLE public.client_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  storage_path text NOT NULL,
  content_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their client files metadata"
  ON public.client_files FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert client files metadata"
  ON public.client_files FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their client files metadata"
  ON public.client_files FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
