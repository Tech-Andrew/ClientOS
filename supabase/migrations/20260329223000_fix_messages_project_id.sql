-- Make project_id nullable in messages table
ALTER TABLE public.messages ALTER COLUMN project_id DROP NOT NULL;
