ALTER TABLE public.content_entries
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS author text,
  ADD COLUMN IF NOT EXISTS image_alt text,
  ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS project_url text,
  ADD COLUMN IF NOT EXISTS completed_on date,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS og_title text,
  ADD COLUMN IF NOT EXISTS og_description text,
  ADD COLUMN IF NOT EXISTS og_image_path text;

ALTER TABLE public.content_entries
  ADD CONSTRAINT content_entries_language_check CHECK (language IN ('en','ha','ar')) NOT VALID;

CREATE INDEX IF NOT EXISTS content_entries_type_slug_idx ON public.content_entries (content_type, slug);
CREATE INDEX IF NOT EXISTS content_entries_status_idx ON public.content_entries (status, is_enabled);