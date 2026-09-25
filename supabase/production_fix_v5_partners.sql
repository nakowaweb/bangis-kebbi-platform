-- =====================================================================
-- BANGISKEBBI — v5: Umrah partner location, logo and display order
-- Run AFTER v3 and v4. Safe to re-run. Adds columns only; deletes nothing.
-- RLS, grants, storage buckets and storage rules are NOT changed.
-- =====================================================================
ALTER TABLE public.umrah_partners ADD COLUMN IF NOT EXISTS state_region text;
ALTER TABLE public.umrah_partners ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.umrah_partners ADD COLUMN IF NOT EXISTS logo_path text;
ALTER TABLE public.umrah_partners ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

ALTER TABLE public.umrah_partners DROP CONSTRAINT IF EXISTS umrah_partners_location_len_check;
ALTER TABLE public.umrah_partners ADD CONSTRAINT umrah_partners_location_len_check
  CHECK ((state_region IS NULL OR char_length(state_region) <= 120)
     AND (city IS NULL OR char_length(city) <= 120)
     AND (logo_path IS NULL OR char_length(logo_path) <= 500));

CREATE INDEX IF NOT EXISTS umrah_partners_public_order_idx
  ON public.umrah_partners (sort_order, name) WHERE verification_status = 'verified' AND is_visible;

-- Check: expect 4 rows
SELECT column_name, data_type FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'umrah_partners'
   AND column_name IN ('state_region','city','logo_path','sort_order');
