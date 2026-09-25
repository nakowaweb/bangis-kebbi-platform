-- =====================================================================
-- BangisKebbi.com — v6: per-admin module permissions enforced by RLS.
-- Run AFTER v3, v4 and v5. Safe to re-run. Deletes no data. Never disables RLS.
--
-- How it works: every relevant table gets RESTRICTIVE policies. Postgres
-- ANDs restrictive policies with the existing permissive ones, so this file
-- can only NARROW access — it can never widen anything that v3/v4/v5 allow.
--
--   SUPER_ADMIN -> passes every module check.
--   ADMIN       -> passes only modules granted in public.admin_permissions.
--   MEMBER      -> own rows only (unchanged); never passes a module check.
--   anon        -> untouched (public read policies from v3 still apply).
-- =====================================================================
BEGIN;

-- ---------------------------------------------------------------------
-- 0. Preconditions
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.admin_permissions') IS NULL THEN
    RAISE EXCEPTION 'Run production_fix_v4_admin_security.sql first.';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 1. Module helper (reads auth.uid() itself; callers cannot spoof a user)
--    A leftover permission row is ignored unless the user is still an admin.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_can(_module text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND (
    public.has_role(auth.uid(), 'super_admin')
    OR (
      public.has_role(auth.uid(), 'admin')
      AND EXISTS (SELECT 1 FROM public.admin_permissions
                  WHERE user_id = auth.uid() AND module = _module)
    )
  );
$$;
REVOKE EXECUTE ON FUNCTION public.admin_can(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_can(text) TO authenticated;

-- Content entries: credentials live in content_entries with category 'company_credential'.
CREATE OR REPLACE FUNCTION public.admin_can_entry(_category text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN _category = 'company_credential'
              THEN public.admin_can('credentials')
              ELSE public.admin_can('content') END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_can_entry(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_can_entry(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'super_admin');
$$;
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- Remove every previous v6 policy so this file is fully re-runnable.
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT schemaname, tablename, policyname FROM pg_policies
           WHERE policyname LIKE 'rbac: %' AND schemaname IN ('public','storage')
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 2. CONTENT (module: content / credentials)
-- ---------------------------------------------------------------------
CREATE POLICY "rbac: content select" ON public.content_entries AS RESTRICTIVE FOR SELECT TO authenticated
  USING ((status = 'published' AND is_enabled = true AND deleted_at IS NULL) OR public.admin_can_entry(category));
CREATE POLICY "rbac: content insert" ON public.content_entries AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.admin_can_entry(category));
CREATE POLICY "rbac: content update" ON public.content_entries AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.admin_can_entry(category)) WITH CHECK (public.admin_can_entry(category));
CREATE POLICY "rbac: content delete" ON public.content_entries AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.admin_can_entry(category));

CREATE POLICY "rbac: revisions all" ON public.content_revisions AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.admin_can('content') OR public.admin_can('credentials') OR public.admin_can('translations'))
  WITH CHECK (public.admin_can('content') OR public.admin_can('credentials') OR public.admin_can('translations'));

CREATE POLICY "rbac: settings select" ON public.site_settings AS RESTRICTIVE FOR SELECT TO authenticated
  USING (is_active = true OR public.admin_can('content'));
CREATE POLICY "rbac: settings insert" ON public.site_settings AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.admin_can('content'));
CREATE POLICY "rbac: settings update" ON public.site_settings AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.admin_can('content')) WITH CHECK (public.admin_can('content'));
CREATE POLICY "rbac: settings delete" ON public.site_settings AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.admin_can('content'));

-- Media Library records: uploads come from content, credentials, Umrah partner logos
-- and Foundations; archive/delete is Media Library (content) only.
CREATE POLICY "rbac: media select" ON public.media_assets AS RESTRICTIVE FOR SELECT TO authenticated
  USING (public.admin_can('content') OR public.admin_can('credentials') OR public.admin_can('umrah') OR public.admin_can('foundations'));
CREATE POLICY "rbac: media insert" ON public.media_assets AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.admin_can('content') OR public.admin_can('credentials') OR public.admin_can('umrah') OR public.admin_can('foundations'));
CREATE POLICY "rbac: media update" ON public.media_assets AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.admin_can('content')) WITH CHECK (public.admin_can('content'));
CREATE POLICY "rbac: media delete" ON public.media_assets AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.admin_can('content'));

-- ---------------------------------------------------------------------
-- 3. LANGUAGES (module: translations)
-- ---------------------------------------------------------------------
CREATE POLICY "rbac: translations select" ON public.content_translations AS RESTRICTIVE FOR SELECT TO authenticated
  USING (status = 'published' OR public.admin_can('translations'));
CREATE POLICY "rbac: translations insert" ON public.content_translations AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.admin_can('translations'));
CREATE POLICY "rbac: translations update" ON public.content_translations AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.admin_can('translations')) WITH CHECK (public.admin_can('translations'));
CREATE POLICY "rbac: translations delete" ON public.content_translations AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.admin_can('translations'));

-- ---------------------------------------------------------------------
-- 4. SOCIAL LINKS (module: social)
-- ---------------------------------------------------------------------
CREATE POLICY "rbac: social select" ON public.site_social_links AS RESTRICTIVE FOR SELECT TO authenticated
  USING (is_enabled = true OR public.admin_can('social'));
CREATE POLICY "rbac: social insert" ON public.site_social_links AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.admin_can('social'));
CREATE POLICY "rbac: social update" ON public.site_social_links AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.admin_can('social')) WITH CHECK (public.admin_can('social'));
CREATE POLICY "rbac: social delete" ON public.site_social_links AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.admin_can('social'));

-- ---------------------------------------------------------------------
-- 5. MEMBERS (module: members = view only; changes are Super Admin only)
-- ---------------------------------------------------------------------
CREATE POLICY "rbac: profiles select" ON public.profiles AS RESTRICTIVE FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.admin_can('members') OR public.admin_can('umrah') OR public.admin_can('notifications'));
CREATE POLICY "rbac: profiles insert" ON public.profiles AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.is_super_admin());
CREATE POLICY "rbac: profiles update" ON public.profiles AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_super_admin())
  WITH CHECK (id = auth.uid() OR public.is_super_admin());
-- The Super Admin profile can only be changed by the Super Admin.
CREATE POLICY "rbac: protect super admin profile" ON public.profiles AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (id = auth.uid() OR NOT public.has_role(id, 'super_admin'))
  WITH CHECK (id = auth.uid() OR NOT public.has_role(id, 'super_admin'));
-- Members cannot reactivate their own account.
CREATE OR REPLACE FUNCTION public.guard_profile_active_flag()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_active IS DISTINCT FROM OLD.is_active
     AND current_user = 'authenticated'
     AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only the Super Admin can activate or deactivate accounts.';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_profile_active_flag ON public.profiles;
CREATE TRIGGER guard_profile_active_flag BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_active_flag();

CREATE POLICY "rbac: roles select" ON public.user_roles AS RESTRICTIVE FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.admin_can('members'));
CREATE POLICY "rbac: roles insert" ON public.user_roles AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin() AND role <> 'super_admin');
CREATE POLICY "rbac: roles delete" ON public.user_roles AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.is_super_admin() AND role <> 'super_admin');
CREATE POLICY "rbac: roles update" ON public.user_roles AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "rbac: permissions write" ON public.admin_permissions AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());
CREATE POLICY "rbac: permissions delete" ON public.admin_permissions AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "rbac: activities select" ON public.member_activities AS RESTRICTIVE FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.admin_can('members'));

-- ---------------------------------------------------------------------
-- 6. NOTIFICATIONS (module: notifications)
-- ---------------------------------------------------------------------
CREATE POLICY "rbac: notif msg select" ON public.notification_messages AS RESTRICTIVE FOR SELECT TO authenticated
  USING (status = 'published' OR public.admin_can('notifications'));
CREATE POLICY "rbac: notif msg insert" ON public.notification_messages AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.admin_can('notifications'));
CREATE POLICY "rbac: notif msg update" ON public.notification_messages AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.admin_can('notifications')) WITH CHECK (public.admin_can('notifications'));
CREATE POLICY "rbac: notif msg delete" ON public.notification_messages AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.admin_can('notifications'));

CREATE POLICY "rbac: notif rcpt select" ON public.notification_recipients AS RESTRICTIVE FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.admin_can('notifications'));
CREATE POLICY "rbac: notif rcpt update" ON public.notification_recipients AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.admin_can('notifications'))
  WITH CHECK (user_id = auth.uid() OR public.admin_can('notifications'));
CREATE POLICY "rbac: notif rcpt insert" ON public.notification_recipients AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.admin_can('notifications'));
CREATE POLICY "rbac: notif rcpt delete" ON public.notification_recipients AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.admin_can('notifications'));

CREATE POLICY "rbac: notifications select" ON public.notifications AS RESTRICTIVE FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.admin_can('notifications'));
CREATE POLICY "rbac: notifications update" ON public.notifications AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.admin_can('notifications'))
  WITH CHECK (user_id = auth.uid() OR public.admin_can('notifications'));
CREATE POLICY "rbac: notifications insert" ON public.notifications AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.admin_can('notifications'));

-- ---------------------------------------------------------------------
-- 7. UMRAH (module: umrah) — members keep their own rows
-- ---------------------------------------------------------------------
CREATE POLICY "rbac: umrah apps all" ON public.umrah_applications AS RESTRICTIVE FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.admin_can('umrah'))
  WITH CHECK (user_id = auth.uid() OR public.admin_can('umrah'));

CREATE POLICY "rbac: umrah docs all" ON public.umrah_documents AS RESTRICTIVE FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.admin_can('umrah'))
  WITH CHECK (user_id = auth.uid() OR public.admin_can('umrah'));

CREATE POLICY "rbac: umrah history all" ON public.umrah_application_history AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.admin_can('umrah') OR EXISTS (
    SELECT 1 FROM public.umrah_applications a WHERE a.id = application_id AND a.user_id = auth.uid()))
  WITH CHECK (public.admin_can('umrah') OR EXISTS (
    SELECT 1 FROM public.umrah_applications a WHERE a.id = application_id AND a.user_id = auth.uid()));

CREATE POLICY "rbac: member docs all" ON public.member_documents AS RESTRICTIVE FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.admin_can('umrah'))
  WITH CHECK (user_id = auth.uid() OR public.admin_can('umrah'));

CREATE POLICY "rbac: partners select" ON public.umrah_partners AS RESTRICTIVE FOR SELECT TO authenticated
  USING ((verification_status = 'verified' AND is_visible = true) OR public.admin_can('umrah'));
CREATE POLICY "rbac: partners insert" ON public.umrah_partners AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.admin_can('umrah'));
CREATE POLICY "rbac: partners update" ON public.umrah_partners AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.admin_can('umrah')) WITH CHECK (public.admin_can('umrah'));
CREATE POLICY "rbac: partners delete" ON public.umrah_partners AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.admin_can('umrah'));

-- ---------------------------------------------------------------------
-- 8. BK FOUNDATIONS (module: foundations)
-- ---------------------------------------------------------------------
CREATE POLICY "rbac: foundation select" ON public.foundation_projects AS RESTRICTIVE FOR SELECT TO authenticated
  USING (is_published = true OR public.admin_can('foundations'));
CREATE POLICY "rbac: foundation insert" ON public.foundation_projects AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.admin_can('foundations'));
CREATE POLICY "rbac: foundation update" ON public.foundation_projects AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.admin_can('foundations')) WITH CHECK (public.admin_can('foundations'));
CREATE POLICY "rbac: foundation delete" ON public.foundation_projects AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.admin_can('foundations'));

CREATE POLICY "rbac: foundation upd select" ON public.foundation_project_updates AS RESTRICTIVE FOR SELECT TO authenticated
  USING (is_published = true OR public.admin_can('foundations'));
CREATE POLICY "rbac: foundation upd insert" ON public.foundation_project_updates AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.admin_can('foundations'));
CREATE POLICY "rbac: foundation upd update" ON public.foundation_project_updates AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.admin_can('foundations')) WITH CHECK (public.admin_can('foundations'));
CREATE POLICY "rbac: foundation upd delete" ON public.foundation_project_updates AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.admin_can('foundations'));

-- ---------------------------------------------------------------------
-- 9. AUDIT LOG — admins write only as themselves; Super Admin reads all
-- ---------------------------------------------------------------------
CREATE POLICY "rbac: audit insert" ON public.admin_audit_logs AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (admin_id = auth.uid());
CREATE POLICY "rbac: audit select" ON public.admin_audit_logs AS RESTRICTIVE FOR SELECT TO authenticated
  USING (admin_id = auth.uid() OR public.is_super_admin());

-- ---------------------------------------------------------------------
-- 10. STORAGE (buckets stay private; only narrows existing policies)
-- ---------------------------------------------------------------------
CREATE POLICY "rbac: site-media modules" ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated
  USING (bucket_id <> 'site-media' OR public.admin_can('content') OR public.admin_can('credentials')
         OR public.admin_can('umrah') OR public.admin_can('foundations'))
  WITH CHECK (bucket_id <> 'site-media' OR public.admin_can('content') OR public.admin_can('credentials')
         OR public.admin_can('umrah') OR public.admin_can('foundations'));
CREATE POLICY "rbac: foundation-media module" ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated
  USING (bucket_id <> 'foundation-media' OR public.admin_can('foundations'))
  WITH CHECK (bucket_id <> 'foundation-media' OR public.admin_can('foundations'));
CREATE POLICY "rbac: member-documents owner or umrah" ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated
  USING (bucket_id <> 'member-documents' OR (storage.foldername(name))[1] = auth.uid()::text OR public.admin_can('umrah'))
  WITH CHECK (bucket_id <> 'member-documents' OR (storage.foldername(name))[1] = auth.uid()::text);

UPDATE storage.buckets SET public = false WHERE id IN ('site-media','foundation-media','member-documents');

COMMIT;

-- ============================ CHECKS ================================
-- a) RLS enabled on every public table (expect: no rows)
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity;

-- b) anon has no write grants (expect: no rows)
SELECT table_name, privilege_type FROM information_schema.role_table_grants
WHERE grantee = 'anon' AND table_schema = 'public' AND privilege_type <> 'SELECT';

-- c) restrictive module policies installed (expect about 60)
SELECT count(*) AS rbac_policies FROM pg_policies WHERE policyname LIKE 'rbac: %';

-- d) anon cannot run the helpers (expect all false)
SELECT has_function_privilege('anon','public.admin_can(text)','EXECUTE') AS anon_admin_can,
       has_function_privilege('anon','public.admin_can_entry(text)','EXECUTE') AS anon_entry,
       has_function_privilege('anon','public.is_super_admin()','EXECUTE') AS anon_super;

-- e) buckets private (expect all false)
SELECT id, public FROM storage.buckets WHERE id IN ('site-media','foundation-media','member-documents');

-- f) exactly one Super Admin (expect 1)
SELECT count(*) FROM public.user_roles WHERE role = 'super_admin';

-- =====================================================================
-- g) DIRECT BYPASS TEST — acts exactly like an API request from an ADMIN.
--    Replace the email with a real account that has the 'admin' role and
--    does NOT have the 'umrah' or 'foundations' module ticked.
--    Everything runs inside a transaction that is rolled back: no changes stay.
-- =====================================================================
BEGIN;
SELECT set_config('request.jwt.claims',
  json_build_object('sub', (SELECT id FROM auth.users WHERE email = 'ADMIN_EMAIL_HERE'), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;

SELECT public.admin_can('umrah')        AS has_umrah,        -- expect false
       public.admin_can('foundations')  AS has_foundations;  -- expect false
SELECT count(*) AS umrah_apps_visible   FROM public.umrah_applications;           -- expect 0 (unless own)
SELECT count(*) AS unpublished_projects FROM public.foundation_projects WHERE NOT is_published; -- expect 0
SELECT count(*) AS hidden_partners      FROM public.umrah_partners WHERE NOT is_visible;        -- expect 0
UPDATE public.umrah_applications SET internal_note = internal_note RETURNING id;  -- expect 0 rows
DELETE FROM public.umrah_partners RETURNING id;                                   -- expect 0 rows
DELETE FROM public.user_roles WHERE role = 'super_admin' RETURNING id;            -- expect 0 rows
UPDATE public.profiles SET full_name = full_name
  WHERE id IN (SELECT user_id FROM public.user_roles WHERE role = 'super_admin') RETURNING id; -- expect 0 rows
-- Each of these should fail with "row-level security" (run one at a time if needed):
-- INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'super_admin');
-- INSERT INTO public.admin_permissions (user_id, module) VALUES (auth.uid(), 'umrah');
-- INSERT INTO public.foundation_projects (title, slug) VALUES ('x', 'x-test');
ROLLBACK;
