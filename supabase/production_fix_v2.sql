-- =====================================================================
-- BangisKebbi.com — production permissions + storage fix (v2)
-- Run once in the Supabase SQL Editor of the NEW project.
-- Safe to re-run. Row security stays ON everywhere. No data is deleted.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Table access for the app (row security still decides WHICH rows)
-- ---------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'admin_audit_logs','content_entries','content_revisions','content_translations',
    'foundation_project_updates','foundation_projects','media_assets','member_activities',
    'member_documents','notification_messages','notification_recipients','notifications',
    'profiles','site_settings','site_social_links','umrah_application_history',
    'umrah_applications','umrah_documents','umrah_partners'
  ] LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      RAISE NOTICE 'MISSING TABLE: public.% (not migrated)', t;
    ELSE
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
      EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    END IF;
  END LOOP;

  -- Visitors (not signed in) may only READ public tables whose rules
  -- already limit them to published/enabled rows.
  FOREACH t IN ARRAY ARRAY[
    'content_entries','content_translations','foundation_projects',
    'foundation_project_updates','site_settings','site_social_links','umrah_partners'
  ] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
    END IF;
  END LOOP;
END $$;

-- Roles: signed-in users can only READ (their own row per existing rules).
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- Private tables are never readable by visitors.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['admin_audit_logs','member_activities','member_documents',
    'notification_messages','notification_recipients','notifications','profiles',
    'umrah_application_history','umrah_applications','umrah_documents','media_assets',
    'content_revisions','user_roles'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    END IF;
  END LOOP;
END $$;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- ---------------------------------------------------------------------
-- 2. Functions: only the permission checks the app calls.
--    (claim_first_super_admin is NOT granted — it stays locked.)
-- ---------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_content_admin(uuid)          TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid)         TO authenticated, service_role;
DO $$ BEGIN
  IF to_regprocedure('public.claim_first_super_admin()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.claim_first_super_admin() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 3. Umrah form: state / province / region field
-- ---------------------------------------------------------------------
ALTER TABLE public.umrah_applications ADD COLUMN IF NOT EXISTS state_region text
  CHECK (state_region IS NULL OR char_length(state_region) <= 120);

-- ---------------------------------------------------------------------
-- 4. Media Library: allow PDFs (credentials) and videos up to 50 MB
-- ---------------------------------------------------------------------
ALTER TABLE public.media_assets DROP CONSTRAINT IF EXISTS media_assets_mime_type_check;
ALTER TABLE public.media_assets DROP CONSTRAINT IF EXISTS media_assets_byte_size_check;
ALTER TABLE public.media_assets ADD CONSTRAINT media_assets_mime_type_check CHECK (mime_type IN (
  'image/jpeg','image/png','image/webp','image/avif','image/svg+xml',
  'application/pdf','video/mp4','video/webm','video/quicktime'));
ALTER TABLE public.media_assets ADD CONSTRAINT media_assets_byte_size_check
  CHECK (byte_size > 0 AND byte_size <= 52428800);

-- ---------------------------------------------------------------------
-- 5. Storage buckets — all PRIVATE (images are shown via short-lived links)
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('site-media','site-media',false,52428800),
       ('foundation-media','foundation-media',false,10485760),
       ('member-documents','member-documents',false,10485760)
ON CONFLICT (id) DO UPDATE SET public = false;
UPDATE storage.buckets SET file_size_limit = 52428800 WHERE id = 'site-media';

-- ---------------------------------------------------------------------
-- 6. Storage rules (recreated exactly; nothing becomes public)
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Content admins can view site media"   ON storage.objects;
DROP POLICY IF EXISTS "Content admins can upload site media" ON storage.objects;
DROP POLICY IF EXISTS "Content admins can update site media" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can delete site media"   ON storage.objects;
CREATE POLICY "Content admins can view site media" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'site-media' AND public.is_content_admin(auth.uid()));
CREATE POLICY "Content admins can upload site media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-media' AND public.is_content_admin(auth.uid()));
CREATE POLICY "Content admins can update site media" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'site-media' AND public.is_content_admin(auth.uid()))
  WITH CHECK (bucket_id = 'site-media' AND public.is_content_admin(auth.uid()));
CREATE POLICY "Super admins can delete site media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site-media' AND public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Foundation media readable by signed-in users" ON storage.objects;
DROP POLICY IF EXISTS "Foundation media upload by content admins"    ON storage.objects;
DROP POLICY IF EXISTS "Foundation media update by content admins"    ON storage.objects;
DROP POLICY IF EXISTS "Foundation media delete by content admins"    ON storage.objects;
CREATE POLICY "Foundation media readable by signed-in users" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'foundation-media');
CREATE POLICY "Foundation media upload by content admins" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'foundation-media' AND public.is_content_admin(auth.uid()));
CREATE POLICY "Foundation media update by content admins" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'foundation-media' AND public.is_content_admin(auth.uid()))
  WITH CHECK (bucket_id = 'foundation-media' AND public.is_content_admin(auth.uid()));
CREATE POLICY "Foundation media delete by content admins" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'foundation-media' AND public.is_content_admin(auth.uid()));

DROP POLICY IF EXISTS "Members manage own document files"  ON storage.objects;
DROP POLICY IF EXISTS "Admins read member document files"  ON storage.objects;
CREATE POLICY "Members manage own document files" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'member-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'member-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Admins read member document files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'member-documents' AND public.is_platform_admin(auth.uid()));

COMMIT;

-- =====================================================================
-- 7. CHECKS — run after the fix and send me the results
-- =====================================================================
-- a) Every table must show rowsecurity = true
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY 1;

-- b) Your account must list super_admin (replace the email)
SELECT u.email, r.role FROM auth.users u JOIN public.user_roles r ON r.user_id = u.id
WHERE u.email = 'YOUR-LOGIN-EMAIL@example.com';
-- If empty, grant it (replace the email) and run again:
-- INSERT INTO public.user_roles (user_id, role)
--   SELECT id, 'super_admin' FROM auth.users WHERE email = 'YOUR-LOGIN-EMAIL@example.com'
--   ON CONFLICT DO NOTHING;

-- c) What data actually came across in the move
SELECT 'content_entries' t, count(*) FROM public.content_entries
UNION ALL SELECT 'media_assets', count(*) FROM public.media_assets
UNION ALL SELECT 'foundation_projects', count(*) FROM public.foundation_projects
UNION ALL SELECT 'umrah_applications', count(*) FROM public.umrah_applications
UNION ALL SELECT 'umrah_partners', count(*) FROM public.umrah_partners
UNION ALL SELECT 'profiles', count(*) FROM public.profiles
UNION ALL SELECT 'site_social_links', count(*) FROM public.site_social_links;

-- d) Files present in each bucket
SELECT bucket_id, count(*) FROM storage.objects GROUP BY 1 ORDER BY 1;

-- e) Media records whose file is MISSING from storage (needs re-upload)
SELECT m.name, m.storage_path FROM public.media_assets m
LEFT JOIN storage.objects o ON o.bucket_id = 'site-media' AND o.name = m.storage_path
WHERE o.id IS NULL AND m.deleted_at IS NULL;

-- f) Page images pointing to files that are MISSING from storage
SELECT c.content_type, c.slug, c.image_path FROM public.content_entries c
LEFT JOIN storage.objects o ON o.bucket_id = 'site-media' AND o.name = c.image_path
WHERE c.image_path IS NOT NULL AND c.image_path NOT LIKE 'http%' AND o.id IS NULL;
