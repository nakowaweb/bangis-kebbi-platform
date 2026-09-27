ALTER TABLE public.umrah_applications
  ADD COLUMN IF NOT EXISTS state_region text;

ALTER TABLE public.umrah_partners
  ADD COLUMN IF NOT EXISTS state_region text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS logo_path text,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

ALTER TYPE public.translation_status ADD VALUE IF NOT EXISTS 'unpublished';
ALTER TYPE public.translation_status ADD VALUE IF NOT EXISTS 'archived';