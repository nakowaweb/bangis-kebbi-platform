-- =====================================================================
-- BangisKebbi.com — production permissions + storage fix (v3, FINAL)
-- Run in the Supabase SQL Editor of the NEW project.
-- Safe to re-run. Row security stays ON everywhere. No rows or files deleted.
--
-- Principles:
--  * anon (visitors): SELECT only, only on public tables, and only rows the
--    policies allow (published / enabled / verified). No writes anywhere.
--  * authenticated: exactly the operations for which a row-security policy
--    exists. Policies decide member vs admin vs super admin.
--  * Public-read policies no longer call admin helper functions, so visitors
--    need NO function permissions at all.
--  * Storage buckets stay private; public images use server-signed links.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 0. Stop if any expected table is missing (prevents a half-applied fix)
-- ---------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'admin_audit_logs','content_entries','content_revisions','content_translations',
    'foundation_project_updates','foundation_projects','media_assets','member_activities',
    'member_documents','notification_messages','notification_recipients','notifications',
    'profiles','site_settings','site_social_links','umrah_application_history',
    'umrah_applications','umrah_documents','umrah_partners','user_roles'
  ] LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      RAISE EXCEPTION 'MISSING TABLE: public.% — migrate the schema first', t;
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 1. Row security ON for every table in public (never disabled)
-- ---------------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 2. Reset table privileges, then grant only what the policies support
-- ---------------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', r.tablename);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', r.tablename);
  END LOOP;
END $$;

-- 2a. Visitors: read-only on public tables (rows limited by policies)
GRANT SELECT ON public.content_entries            TO anon;  -- published + enabled only
GRANT SELECT ON public.content_translations       TO anon;  -- published translations only
GRANT SELECT ON public.foundation_projects        TO anon;  -- published, not archived
GRANT SELECT ON public.foundation_project_updates TO anon;  -- published updates only
GRANT SELECT ON public.site_settings              TO anon;  -- active settings only
GRANT SELECT ON public.site_social_links          TO anon;  -- enabled links only
GRANT SELECT ON public.umrah_partners             TO anon;  -- verified + visible only

-- 2b. Signed-in users: operation-by-operation, matching existing policies
--     (policy for each operation noted; admin checks happen inside policies)
GRANT SELECT, INSERT                 ON public.admin_audit_logs           TO authenticated; -- content admins
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_entries            TO authenticated; -- S public/admin, I/U admin, D super admin
GRANT SELECT, INSERT                 ON public.content_revisions          TO authenticated; -- content admins
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_translations       TO authenticated; -- S public/admin, I/U/D admin
GRANT SELECT, INSERT, UPDATE, DELETE ON public.foundation_project_updates TO authenticated; -- S public/admin, I/U/D admin
GRANT SELECT, INSERT, UPDATE, DELETE ON public.foundation_projects        TO authenticated; -- S public/admin, I/U admin, D super admin
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets               TO authenticated; -- S/I/U admin, D super admin (unprotected)
GRANT SELECT                         ON public.member_activities          TO authenticated; -- own rows only
GRANT SELECT, INSERT, DELETE         ON public.member_documents           TO authenticated; -- own rows; delete own pending
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_messages      TO authenticated; -- S recipients/admin, I/U/D admin
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_recipients    TO authenticated; -- S/U own, I/D admin
GRANT SELECT, INSERT, UPDATE         ON public.notifications              TO authenticated; -- S/U own, I admin
GRANT SELECT, INSERT, UPDATE         ON public.profiles                   TO authenticated; -- own; admin can view/update
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings              TO authenticated; -- S public, I/U admin, D super admin
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_social_links          TO authenticated; -- S public/admin, I/U/D admin
GRANT SELECT, INSERT                 ON public.umrah_application_history  TO authenticated; -- participants
GRANT SELECT, INSERT, UPDATE         ON public.umrah_applications         TO authenticated; -- own drafts; admin review
GRANT SELECT, INSERT, UPDATE, DELETE ON public.umrah_documents            TO authenticated; -- own upload/delete pending; admin review
GRANT SELECT, INSERT, UPDATE, DELETE ON public.umrah_partners             TO authenticated; -- S public/admin, I/U admin, D super admin
GRANT SELECT, INSERT, DELETE         ON public.user_roles                 TO authenticated; -- S own/admin, I/D super admin only

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- ---------------------------------------------------------------------
-- 3. Public-read policies: remove admin function calls from the visitor path
--    (admin read access is kept in separate signed-in-only policies)
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view published content" ON public.content_entries;
CREATE POLICY "Public can view published content" ON public.content_entries
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND is_enabled = true AND deleted_at IS NULL
         AND (published_at IS NULL OR published_at <= now()));
DROP POLICY IF EXISTS "Content admins can view all content" ON public.content_entries;
CREATE POLICY "Content admins can view all content" ON public.content_entries
  FOR SELECT TO authenticated USING (public.is_content_admin(auth.uid()));

DROP POLICY IF EXISTS "Public can view active site settings" ON public.site_settings;
CREATE POLICY "Public can view active site settings" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS "Content admins can view all site settings" ON public.site_settings;
CREATE POLICY "Content admins can view all site settings" ON public.site_settings
  FOR SELECT TO authenticated USING (public.is_content_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can read enabled social links" ON public.site_social_links;
CREATE POLICY "Anyone can read enabled social links" ON public.site_social_links
  FOR SELECT TO anon, authenticated USING (is_enabled = true);
DROP POLICY IF EXISTS "Admins can read all social links" ON public.site_social_links;
CREATE POLICY "Admins can read all social links" ON public.site_social_links
  FOR SELECT TO authenticated USING (public.is_content_admin(auth.uid()));

DROP POLICY IF EXISTS "Public sees verified visible partners" ON public.umrah_partners;
CREATE POLICY "Public sees verified visible partners" ON public.umrah_partners
  FOR SELECT TO anon, authenticated USING (verification_status = 'verified' AND is_visible = true);
DROP POLICY IF EXISTS "Admins see all partners" ON public.umrah_partners;
CREATE POLICY "Admins see all partners" ON public.umrah_partners
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));

-- ---------------------------------------------------------------------
-- 4. Functions: nobody by default; signed-in users get only the 4 the app calls
-- ---------------------------------------------------------------------
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.sig);
  END LOOP;
END $$;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_content_admin(uuid)          TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid)         TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_member_role()            TO authenticated;
-- claim_first_super_admin, super_admin_exists, log/notification helpers and
-- trigger functions stay locked (triggers run without caller permission).

-- ---------------------------------------------------------------------
-- 5. Umrah form: state / province / region field
-- ---------------------------------------------------------------------
ALTER TABLE public.umrah_applications ADD COLUMN IF NOT EXISTS state_region text;
ALTER TABLE public.umrah_applications DROP CONSTRAINT IF EXISTS umrah_applications_state_region_check;
ALTER TABLE public.umrah_applications ADD CONSTRAINT umrah_applications_state_region_check
  CHECK (state_region IS NULL OR char_length(state_region) <= 120);

-- ---------------------------------------------------------------------
-- 6. Media Library: allow PDFs (credentials) and videos up to 50 MB
-- ---------------------------------------------------------------------
ALTER TABLE public.media_assets DROP CONSTRAINT IF EXISTS media_assets_mime_type_check;
ALTER TABLE public.media_assets DROP CONSTRAINT IF EXISTS media_assets_byte_size_check;
ALTER TABLE public.media_assets ADD CONSTRAINT media_assets_mime_type_check CHECK (mime_type IN (
  'image/jpeg','image/png','image/webp','image/avif','image/svg+xml',
  'application/pdf','video/mp4','video/webm','video/quicktime'));
ALTER TABLE public.media_assets ADD CONSTRAINT media_assets_byte_size_check
  CHECK (byte_size > 0 AND byte_size <= 52428800);

-- ---------------------------------------------------------------------
-- 7. Storage buckets — all PRIVATE
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('site-media','site-media',false,52428800),
       ('foundation-media','foundation-media',false,10485760),
       ('member-documents','member-documents',false,10485760)
ON CONFLICT (id) DO UPDATE SET public = false;
UPDATE storage.buckets SET file_size_limit = 52428800 WHERE id = 'site-media';

-- ---------------------------------------------------------------------
-- 8. Storage rules (minimum access; public pages use server-signed links)
-- ---------------------------------------------------------------------
-- site-media: content admins only; delete = super admin
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

-- foundation-media: CHANGED — no longer readable by every signed-in member.
-- Visitors and members see approved Foundation images via server-signed links.
DROP POLICY IF EXISTS "Foundation media readable by signed-in users" ON storage.objects;
DROP POLICY IF EXISTS "Foundation media readable by content admins"  ON storage.objects;
DROP POLICY IF EXISTS "Foundation media upload by content admins"    ON storage.objects;
DROP POLICY IF EXISTS "Foundation media update by content admins"    ON storage.objects;
DROP POLICY IF EXISTS "Foundation media delete by content admins"    ON storage.objects;
DROP POLICY IF EXISTS "Admins upload foundation media"               ON storage.objects;
DROP POLICY IF EXISTS "Admins update foundation media"               ON storage.objects;
DROP POLICY IF EXISTS "Admins delete foundation media"               ON storage.objects;
CREATE POLICY "Foundation media readable by content admins" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'foundation-media' AND public.is_content_admin(auth.uid()));
CREATE POLICY "Foundation media upload by content admins" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'foundation-media' AND public.is_content_admin(auth.uid()));
CREATE POLICY "Foundation media update by content admins" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'foundation-media' AND public.is_content_admin(auth.uid()))
  WITH CHECK (bucket_id = 'foundation-media' AND public.is_content_admin(auth.uid()));
CREATE POLICY "Foundation media delete by content admins" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'foundation-media' AND public.is_content_admin(auth.uid()));

-- member-documents: owner folder only; admins read (downloads use signed links)
DROP POLICY IF EXISTS "Members manage own document files" ON storage.objects;
DROP POLICY IF EXISTS "Admins read member document files" ON storage.objects;
CREATE POLICY "Members manage own document files" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'member-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'member-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Admins read member document files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'member-documents' AND public.is_platform_admin(auth.uid()));

COMMIT;

-- =====================================================================
-- 9. FINAL CHECKS — run after the fix. Expected result noted on each.
-- =====================================================================

-- a) RLS enabled — EXPECT: 0 rows
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity;

-- b) anon write grants — EXPECT: 0 rows
SELECT table_name, privilege_type FROM information_schema.role_table_grants
WHERE grantee = 'anon' AND table_schema = 'public' AND privilege_type <> 'SELECT';

-- c) anon read grants — EXPECT exactly the 7 public tables
SELECT table_name FROM information_schema.role_table_grants
WHERE grantee = 'anon' AND table_schema = 'public' ORDER BY 1;

-- d) authenticated privileges differing from the intended list — EXPECT: 0 rows
WITH intended(t, p) AS (VALUES
 ('admin_audit_logs','SELECT'),('admin_audit_logs','INSERT'),
 ('content_entries','SELECT'),('content_entries','INSERT'),('content_entries','UPDATE'),('content_entries','DELETE'),
 ('content_revisions','SELECT'),('content_revisions','INSERT'),
 ('content_translations','SELECT'),('content_translations','INSERT'),('content_translations','UPDATE'),('content_translations','DELETE'),
 ('foundation_project_updates','SELECT'),('foundation_project_updates','INSERT'),('foundation_project_updates','UPDATE'),('foundation_project_updates','DELETE'),
 ('foundation_projects','SELECT'),('foundation_projects','INSERT'),('foundation_projects','UPDATE'),('foundation_projects','DELETE'),
 ('media_assets','SELECT'),('media_assets','INSERT'),('media_assets','UPDATE'),('media_assets','DELETE'),
 ('member_activities','SELECT'),
 ('member_documents','SELECT'),('member_documents','INSERT'),('member_documents','DELETE'),
 ('notification_messages','SELECT'),('notification_messages','INSERT'),('notification_messages','UPDATE'),('notification_messages','DELETE'),
 ('notification_recipients','SELECT'),('notification_recipients','INSERT'),('notification_recipients','UPDATE'),('notification_recipients','DELETE'),
 ('notifications','SELECT'),('notifications','INSERT'),('notifications','UPDATE'),
 ('profiles','SELECT'),('profiles','INSERT'),('profiles','UPDATE'),
 ('site_settings','SELECT'),('site_settings','INSERT'),('site_settings','UPDATE'),('site_settings','DELETE'),
 ('site_social_links','SELECT'),('site_social_links','INSERT'),('site_social_links','UPDATE'),('site_social_links','DELETE'),
 ('umrah_application_history','SELECT'),('umrah_application_history','INSERT'),
 ('umrah_applications','SELECT'),('umrah_applications','INSERT'),('umrah_applications','UPDATE'),
 ('umrah_documents','SELECT'),('umrah_documents','INSERT'),('umrah_documents','UPDATE'),('umrah_documents','DELETE'),
 ('umrah_partners','SELECT'),('umrah_partners','INSERT'),('umrah_partners','UPDATE'),('umrah_partners','DELETE'),
 ('user_roles','SELECT'),('user_roles','INSERT'),('user_roles','DELETE')),
actual AS (SELECT table_name t, privilege_type p FROM information_schema.role_table_grants
           WHERE grantee = 'authenticated' AND table_schema = 'public')
SELECT 'unexpected' AS issue, * FROM (SELECT * FROM actual EXCEPT SELECT * FROM intended) x
UNION ALL
SELECT 'missing', * FROM (SELECT * FROM intended EXCEPT SELECT * FROM actual) y;

-- e) Every granted operation has a policy — EXPECT: 0 rows
SELECT g.table_name, g.privilege_type FROM information_schema.role_table_grants g
WHERE g.grantee = 'authenticated' AND g.table_schema = 'public'
  AND g.privilege_type IN ('SELECT','INSERT','UPDATE','DELETE')
  AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public'
    AND p.tablename = g.table_name AND p.cmd IN (g.privilege_type, 'ALL')
    AND ('authenticated' = ANY(p.roles) OR 'public' = ANY(p.roles)));

-- f) Functions callable by anon — EXPECT: 0 rows
SELECT p.oid::regprocedure FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND has_function_privilege('anon', p.oid, 'EXECUTE')
  AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e');

-- g) Functions callable by authenticated — EXPECT exactly: has_role, is_content_admin,
--    is_platform_admin, ensure_member_role
SELECT p.oid::regprocedure FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
  AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e');

-- h) Super Admin exists — EXPECT: at least 1 row (your email)
SELECT u.email, r.role FROM auth.users u JOIN public.user_roles r ON r.user_id = u.id
WHERE r.role = 'super_admin';
-- If empty, grant it (replace the email) and run (h) again:
-- INSERT INTO public.user_roles (user_id, role)
--   SELECT id, 'super_admin' FROM auth.users WHERE email = 'YOUR-LOGIN-EMAIL@example.com'
--   ON CONFLICT DO NOTHING;

-- i) Buckets private — EXPECT: 3 rows, all public = false
SELECT id, public, file_size_limit FROM storage.buckets
WHERE id IN ('site-media','foundation-media','member-documents') ORDER BY 1;

-- j) Storage policies — EXPECT exactly these 11, all TO {authenticated}
SELECT policyname, cmd, roles FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects' ORDER BY policyname;
-- Admins read member document files (SELECT), Content admins can update/upload/view
-- site media (UPDATE/INSERT/SELECT), Foundation media delete/readable/update/upload by
-- content admins (DELETE/SELECT/UPDATE/INSERT), Members manage own document files (ALL),
-- Super admins can delete site media (DELETE). Any other row = leftover to review.

-- k) Super Admin access simulation — EXPECT: every column true.
--    Replace the email, run as one block. Reads only; changes nothing.
BEGIN;
SELECT set_config('request.jwt.claims',
  json_build_object('sub', (SELECT id FROM auth.users WHERE email = 'YOUR-LOGIN-EMAIL@example.com'),
                    'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;
SELECT
  public.has_role(auth.uid(), 'super_admin')  AS is_super_admin,
  public.is_content_admin(auth.uid())          AS content_admin,
  public.is_platform_admin(auth.uid())         AS platform_admin,
  (SELECT count(*) >= 0 FROM public.content_entries)       AS content_ok,
  (SELECT count(*) >= 0 FROM public.media_assets)          AS media_ok,
  (SELECT count(*) >= 0 FROM public.foundation_projects)   AS foundation_ok,
  (SELECT count(*) >= 0 FROM public.umrah_applications)    AS umrah_ok,
  (SELECT count(*) >= 0 FROM public.umrah_documents)       AS umrah_docs_ok,
  (SELECT count(*) >= 0 FROM public.profiles)              AS members_ok,
  (SELECT count(*) >= 0 FROM public.user_roles)            AS roles_ok,
  (SELECT count(*) >= 0 FROM public.notification_messages) AS notifications_ok,
  (SELECT count(*) >= 0 FROM public.admin_audit_logs)      AS audit_ok,
  (SELECT count(*) >= 0 FROM public.site_social_links)     AS social_ok,
  (SELECT count(*) >= 0 FROM public.content_translations)  AS translations_ok;
ROLLBACK;

-- l) Visitor simulation — EXPECT: private tables raise "permission denied".
--    Run each line separately; the first must succeed, the second must FAIL.
-- BEGIN; SET LOCAL ROLE anon; SELECT count(*) FROM public.content_entries; ROLLBACK;
-- BEGIN; SET LOCAL ROLE anon; SELECT count(*) FROM public.profiles;        ROLLBACK;

-- m) What data came across in the move
SELECT 'content_entries' t, count(*) FROM public.content_entries
UNION ALL SELECT 'media_assets', count(*) FROM public.media_assets
UNION ALL SELECT 'foundation_projects', count(*) FROM public.foundation_projects
UNION ALL SELECT 'umrah_applications', count(*) FROM public.umrah_applications
UNION ALL SELECT 'umrah_partners', count(*) FROM public.umrah_partners
UNION ALL SELECT 'profiles', count(*) FROM public.profiles
UNION ALL SELECT 'site_social_links', count(*) FROM public.site_social_links;

-- n) Media records whose file is MISSING from storage (re-upload these)
SELECT m.name, m.storage_path FROM public.media_assets m
LEFT JOIN storage.objects o ON o.bucket_id = 'site-media' AND o.name = m.storage_path
WHERE o.id IS NULL AND m.deleted_at IS NULL;
