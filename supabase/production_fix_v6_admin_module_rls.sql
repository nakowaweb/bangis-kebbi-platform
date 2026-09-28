-- =====================================================================
-- BangisKebbi.com — v6 (REVISED r2): per-admin module permissions via RLS.
-- FOR INDEPENDENT REVIEW. Do not run without explicit approval.
-- Run AFTER v3, v4 and v5. Safe to re-run. Deletes no rows. Never disables RLS.
--
-- Every policy here is AS RESTRICTIVE. Postgres ANDs restrictive policies
-- with the existing permissive ones (v3/v4/v5), so this file can only
-- NARROW access. It never adds a permissive policy and never widens grants.
--
--   SUPER_ADMIN -> passes every module check.
--   ADMIN       -> passes only modules granted in public.admin_permissions.
--   MEMBER      -> own rows only (unchanged); never passes a module check.
--   anon        -> untouched (restrictive policies are TO authenticated only).
--
-- r2 corrections (see v6_v7_change_report.md):
--   * member-documents storage split per command: owner-only writes, admins read-only.
--   * guard_profile_active_flag no longer relies on current_user (always the
--     function owner inside SECURITY DEFINER, so the old check never fired).
--   * Optional tables/buckets are skipped instead of aborting.
--   * Re-run cleanup drops only this file's own policy names.
--   * Bucket privacy update touches only buckets that are currently public.
-- =====================================================================
BEGIN;

-- ---------------------------------------------------------------------
-- 0. Preconditions (abort before any change)
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.admin_permissions') IS NULL THEN
    RAISE EXCEPTION 'Run production_fix_v4_admin_security.sql first (admin_permissions missing).';
  END IF;
  IF to_regprocedure('public.has_role(uuid,public.app_role)') IS NULL THEN
    RAISE EXCEPTION 'has_role(uuid, app_role) missing — run v3 first.';
  END IF;
  IF (SELECT count(*) FROM public.user_roles WHERE role = 'super_admin') <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one Super Admin. Stop and investigate before running v6.';
  END IF;
END $$;

-- Helper that runs a statement only when a table exists (session-temporary).
CREATE OR REPLACE FUNCTION pg_temp.if_table(_t text, _sql text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF to_regclass(_t) IS NOT NULL THEN EXECUTE _sql; END IF;
END $$;

-- ---------------------------------------------------------------------
-- 1. Module helpers (read auth.uid() themselves; callers cannot spoof a user)
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

-- ---------------------------------------------------------------------
-- 2. Re-run cleanup: drop ONLY this file's own policy names.
-- ---------------------------------------------------------------------
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname FROM pg_policies
     WHERE policyname LIKE 'rbac: %'
       AND permissive = 'RESTRICTIVE'
       AND ((schemaname = 'public' AND tablename IN (
              'content_entries','content_revisions','site_settings','media_assets',
              'content_translations','site_social_links','profiles','user_roles',
              'admin_permissions','member_activities','notification_messages',
              'notification_recipients','notifications','umrah_applications',
              'umrah_documents','umrah_application_history','member_documents',
              'umrah_partners','foundation_projects','foundation_project_updates',
              'admin_audit_logs'))
         OR (schemaname = 'storage' AND tablename = 'objects'))
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 3. CONTENT (module: content / credentials)
-- ---------------------------------------------------------------------
CREATE POLICY "rbac: content select" ON public.content_entries AS RESTRICTIVE FOR SELECT TO authenticated
  USING ((status = 'published' AND is_enabled = true AND deleted_at IS NULL) OR public.admin_can_entry(category));
CREATE POLICY "rbac: content insert" ON public.content_entries AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.admin_can_entry(category));
CREATE POLICY "rbac: content update" ON public.content_entries AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.admin_can_entry(category)) WITH CHECK (public.admin_can_entry(category));
CREATE POLICY "rbac: content delete" ON public.content_entries AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.admin_can_entry(category));

SELECT pg_temp.if_table('public.content_revisions', $p$
  CREATE POLICY "rbac: revisions all" ON public.content_revisions AS RESTRICTIVE FOR ALL TO authenticated
    USING (public.admin_can('content') OR public.admin_can('credentials') OR public.admin_can('translations'))
    WITH CHECK (public.admin_can('content') OR public.admin_can('credentials') OR public.admin_can('translations'))
$p$);

CREATE POLICY "rbac: settings select" ON public.site_settings AS RESTRICTIVE FOR SELECT TO authenticated
  USING (is_active = true OR public.admin_can('content'));
CREATE POLICY "rbac: settings insert" ON public.site_settings AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.admin_can('content'));
CREATE POLICY "rbac: settings update" ON public.site_settings AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.admin_can('content')) WITH CHECK (public.admin_can('content'));
CREATE POLICY "rbac: settings delete" ON public.site_settings AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.admin_can('content'));

SELECT pg_temp.if_table('public.media_assets', $p$
  CREATE POLICY "rbac: media select" ON public.media_assets AS RESTRICTIVE FOR SELECT TO authenticated
    USING (public.admin_can('content') OR public.admin_can('credentials') OR public.admin_can('umrah') OR public.admin_can('foundations'))
$p$);
SELECT pg_temp.if_table('public.media_assets', $p$
  CREATE POLICY "rbac: media insert" ON public.media_assets AS RESTRICTIVE FOR INSERT TO authenticated
    WITH CHECK (public.admin_can('content') OR public.admin_can('credentials') OR public.admin_can('umrah') OR public.admin_can('foundations'))
$p$);
SELECT pg_temp.if_table('public.media_assets', $p$
  CREATE POLICY "rbac: media update" ON public.media_assets AS RESTRICTIVE FOR UPDATE TO authenticated
    USING (public.admin_can('content')) WITH CHECK (public.admin_can('content'))
$p$);
SELECT pg_temp.if_table('public.media_assets', $p$
  CREATE POLICY "rbac: media delete" ON public.media_assets AS RESTRICTIVE FOR DELETE TO authenticated
    USING (public.admin_can('content'))
$p$);

-- ---------------------------------------------------------------------
-- 4. LANGUAGES (module: translations)
-- ---------------------------------------------------------------------
SELECT pg_temp.if_table('public.content_translations', $p$
  CREATE POLICY "rbac: translations select" ON public.content_translations AS RESTRICTIVE FOR SELECT TO authenticated
    USING (status = 'published' OR public.admin_can('translations'))
$p$);
SELECT pg_temp.if_table('public.content_translations', $p$
  CREATE POLICY "rbac: translations insert" ON public.content_translations AS RESTRICTIVE FOR INSERT TO authenticated
    WITH CHECK (public.admin_can('translations'))
$p$);
SELECT pg_temp.if_table('public.content_translations', $p$
  CREATE POLICY "rbac: translations update" ON public.content_translations AS RESTRICTIVE FOR UPDATE TO authenticated
    USING (public.admin_can('translations')) WITH CHECK (public.admin_can('translations'))
$p$);
SELECT pg_temp.if_table('public.content_translations', $p$
  CREATE POLICY "rbac: translations delete" ON public.content_translations AS RESTRICTIVE FOR DELETE TO authenticated
    USING (public.admin_can('translations'))
$p$);

-- ---------------------------------------------------------------------
-- 5. SOCIAL LINKS (module: social)
-- ---------------------------------------------------------------------
SELECT pg_temp.if_table('public.site_social_links', $p$
  CREATE POLICY "rbac: social select" ON public.site_social_links AS RESTRICTIVE FOR SELECT TO authenticated
    USING (is_enabled = true OR public.admin_can('social'))
$p$);
SELECT pg_temp.if_table('public.site_social_links', $p$
  CREATE POLICY "rbac: social insert" ON public.site_social_links AS RESTRICTIVE FOR INSERT TO authenticated
    WITH CHECK (public.admin_can('social'))
$p$);
SELECT pg_temp.if_table('public.site_social_links', $p$
  CREATE POLICY "rbac: social update" ON public.site_social_links AS RESTRICTIVE FOR UPDATE TO authenticated
    USING (public.admin_can('social')) WITH CHECK (public.admin_can('social'))
$p$);
SELECT pg_temp.if_table('public.site_social_links', $p$
  CREATE POLICY "rbac: social delete" ON public.site_social_links AS RESTRICTIVE FOR DELETE TO authenticated
    USING (public.admin_can('social'))
$p$);

-- ---------------------------------------------------------------------
-- 6. MEMBERS (module: members = view only; changes are Super Admin only)
-- ---------------------------------------------------------------------
CREATE POLICY "rbac: profiles select" ON public.profiles AS RESTRICTIVE FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.admin_can('members') OR public.admin_can('umrah') OR public.admin_can('notifications'));
CREATE POLICY "rbac: profiles insert" ON public.profiles AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.is_super_admin());
CREATE POLICY "rbac: profiles update" ON public.profiles AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_super_admin())
  WITH CHECK (id = auth.uid() OR public.is_super_admin());
CREATE POLICY "rbac: protect super admin profile" ON public.profiles AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (id = auth.uid() OR NOT public.has_role(id, 'super_admin'))
  WITH CHECK (id = auth.uid() OR NOT public.has_role(id, 'super_admin'));

-- Members cannot (re)activate or deactivate accounts. Only the Super Admin can.
-- r2: decide by the API caller (auth.uid()), not current_user. Server-side
-- maintenance with no end-user JWT (auth.uid() IS NULL) is unaffected.
CREATE OR REPLACE FUNCTION public.guard_profile_active_flag()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_active IS DISTINCT FROM OLD.is_active
     AND auth.uid() IS NOT NULL
     AND NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Only the Super Admin can activate or deactivate accounts.';
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.guard_profile_active_flag() FROM PUBLIC, anon, authenticated;
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

CREATE POLICY "rbac: permissions insert" ON public.admin_permissions AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());
CREATE POLICY "rbac: permissions delete" ON public.admin_permissions AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.is_super_admin());
CREATE POLICY "rbac: permissions update" ON public.admin_permissions AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (false) WITH CHECK (false);

SELECT pg_temp.if_table('public.member_activities', $p$
  CREATE POLICY "rbac: activities select" ON public.member_activities AS RESTRICTIVE FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.admin_can('members'))
$p$);

-- ---------------------------------------------------------------------
-- 7. NOTIFICATIONS (module: notifications). System notifications are
--    written by SECURITY DEFINER functions and are not affected.
-- ---------------------------------------------------------------------
SELECT pg_temp.if_table('public.notification_messages', $p$
  CREATE POLICY "rbac: notif msg select" ON public.notification_messages AS RESTRICTIVE FOR SELECT TO authenticated
    USING (status = 'published' OR public.admin_can('notifications'))
$p$);
SELECT pg_temp.if_table('public.notification_messages', $p$
  CREATE POLICY "rbac: notif msg insert" ON public.notification_messages AS RESTRICTIVE FOR INSERT TO authenticated
    WITH CHECK (public.admin_can('notifications'))
$p$);
SELECT pg_temp.if_table('public.notification_messages', $p$
  CREATE POLICY "rbac: notif msg update" ON public.notification_messages AS RESTRICTIVE FOR UPDATE TO authenticated
    USING (public.admin_can('notifications')) WITH CHECK (public.admin_can('notifications'))
$p$);
SELECT pg_temp.if_table('public.notification_messages', $p$
  CREATE POLICY "rbac: notif msg delete" ON public.notification_messages AS RESTRICTIVE FOR DELETE TO authenticated
    USING (public.admin_can('notifications'))
$p$);
SELECT pg_temp.if_table('public.notification_recipients', $p$
  CREATE POLICY "rbac: notif rcpt select" ON public.notification_recipients AS RESTRICTIVE FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.admin_can('notifications'))
$p$);
SELECT pg_temp.if_table('public.notification_recipients', $p$
  CREATE POLICY "rbac: notif rcpt update" ON public.notification_recipients AS RESTRICTIVE FOR UPDATE TO authenticated
    USING (user_id = auth.uid() OR public.admin_can('notifications'))
    WITH CHECK (user_id = auth.uid() OR public.admin_can('notifications'))
$p$);
SELECT pg_temp.if_table('public.notification_recipients', $p$
  CREATE POLICY "rbac: notif rcpt insert" ON public.notification_recipients AS RESTRICTIVE FOR INSERT TO authenticated
    WITH CHECK (public.admin_can('notifications'))
$p$);
SELECT pg_temp.if_table('public.notification_recipients', $p$
  CREATE POLICY "rbac: notif rcpt delete" ON public.notification_recipients AS RESTRICTIVE FOR DELETE TO authenticated
    USING (public.admin_can('notifications'))
$p$);
SELECT pg_temp.if_table('public.notifications', $p$
  CREATE POLICY "rbac: notifications select" ON public.notifications AS RESTRICTIVE FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.admin_can('notifications'))
$p$);
SELECT pg_temp.if_table('public.notifications', $p$
  CREATE POLICY "rbac: notifications update" ON public.notifications AS RESTRICTIVE FOR UPDATE TO authenticated
    USING (user_id = auth.uid() OR public.admin_can('notifications'))
    WITH CHECK (user_id = auth.uid() OR public.admin_can('notifications'))
$p$);
SELECT pg_temp.if_table('public.notifications', $p$
  CREATE POLICY "rbac: notifications insert" ON public.notifications AS RESTRICTIVE FOR INSERT TO authenticated
    WITH CHECK (public.admin_can('notifications'))
$p$);

-- ---------------------------------------------------------------------
-- 8. UMRAH (module: umrah) — members keep their own rows exactly as today
-- ---------------------------------------------------------------------
CREATE POLICY "rbac: umrah apps all" ON public.umrah_applications AS RESTRICTIVE FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.admin_can('umrah'))
  WITH CHECK (user_id = auth.uid() OR public.admin_can('umrah'));

SELECT pg_temp.if_table('public.umrah_documents', $p$
  CREATE POLICY "rbac: umrah docs all" ON public.umrah_documents AS RESTRICTIVE FOR ALL TO authenticated
    USING (user_id = auth.uid() OR public.admin_can('umrah'))
    WITH CHECK (user_id = auth.uid() OR public.admin_can('umrah'))
$p$);
SELECT pg_temp.if_table('public.umrah_application_history', $p$
  CREATE POLICY "rbac: umrah history all" ON public.umrah_application_history AS RESTRICTIVE FOR ALL TO authenticated
    USING (public.admin_can('umrah') OR EXISTS (
      SELECT 1 FROM public.umrah_applications a WHERE a.id = application_id AND a.user_id = auth.uid()))
    WITH CHECK (public.admin_can('umrah') OR EXISTS (
      SELECT 1 FROM public.umrah_applications a WHERE a.id = application_id AND a.user_id = auth.uid()))
$p$);
SELECT pg_temp.if_table('public.member_documents', $p$
  CREATE POLICY "rbac: member docs all" ON public.member_documents AS RESTRICTIVE FOR ALL TO authenticated
    USING (user_id = auth.uid() OR public.admin_can('umrah'))
    WITH CHECK (user_id = auth.uid() OR public.admin_can('umrah'))
$p$);

CREATE POLICY "rbac: partners select" ON public.umrah_partners AS RESTRICTIVE FOR SELECT TO authenticated
  USING ((verification_status = 'verified' AND is_visible = true) OR public.admin_can('umrah'));
CREATE POLICY "rbac: partners insert" ON public.umrah_partners AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.admin_can('umrah'));
CREATE POLICY "rbac: partners update" ON public.umrah_partners AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.admin_can('umrah')) WITH CHECK (public.admin_can('umrah'));
CREATE POLICY "rbac: partners delete" ON public.umrah_partners AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.admin_can('umrah'));

-- ---------------------------------------------------------------------
-- 9. BK FOUNDATIONS (module: foundations)
-- ---------------------------------------------------------------------
SELECT pg_temp.if_table('public.foundation_projects', $p$
  CREATE POLICY "rbac: foundation select" ON public.foundation_projects AS RESTRICTIVE FOR SELECT TO authenticated
    USING (is_published = true OR public.admin_can('foundations'))
$p$);
SELECT pg_temp.if_table('public.foundation_projects', $p$
  CREATE POLICY "rbac: foundation insert" ON public.foundation_projects AS RESTRICTIVE FOR INSERT TO authenticated
    WITH CHECK (public.admin_can('foundations'))
$p$);
SELECT pg_temp.if_table('public.foundation_projects', $p$
  CREATE POLICY "rbac: foundation update" ON public.foundation_projects AS RESTRICTIVE FOR UPDATE TO authenticated
    USING (public.admin_can('foundations')) WITH CHECK (public.admin_can('foundations'))
$p$);
SELECT pg_temp.if_table('public.foundation_projects', $p$
  CREATE POLICY "rbac: foundation delete" ON public.foundation_projects AS RESTRICTIVE FOR DELETE TO authenticated
    USING (public.admin_can('foundations'))
$p$);
SELECT pg_temp.if_table('public.foundation_project_updates', $p$
  CREATE POLICY "rbac: foundation upd select" ON public.foundation_project_updates AS RESTRICTIVE FOR SELECT TO authenticated
    USING (is_published = true OR public.admin_can('foundations'))
$p$);
SELECT pg_temp.if_table('public.foundation_project_updates', $p$
  CREATE POLICY "rbac: foundation upd insert" ON public.foundation_project_updates AS RESTRICTIVE FOR INSERT TO authenticated
    WITH CHECK (public.admin_can('foundations'))
$p$);
SELECT pg_temp.if_table('public.foundation_project_updates', $p$
  CREATE POLICY "rbac: foundation upd update" ON public.foundation_project_updates AS RESTRICTIVE FOR UPDATE TO authenticated
    USING (public.admin_can('foundations')) WITH CHECK (public.admin_can('foundations'))
$p$);
SELECT pg_temp.if_table('public.foundation_project_updates', $p$
  CREATE POLICY "rbac: foundation upd delete" ON public.foundation_project_updates AS RESTRICTIVE FOR DELETE TO authenticated
    USING (public.admin_can('foundations'))
$p$);

-- ---------------------------------------------------------------------
-- 10. AUDIT LOG — admins write only as themselves; Super Admin reads all.
--     SECURITY DEFINER functions (owner) are not subject to these.
-- ---------------------------------------------------------------------
CREATE POLICY "rbac: audit insert" ON public.admin_audit_logs AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (admin_id = auth.uid());
CREATE POLICY "rbac: audit select" ON public.admin_audit_logs AS RESTRICTIVE FOR SELECT TO authenticated
  USING (admin_id = auth.uid() OR public.is_super_admin());

-- ---------------------------------------------------------------------
-- 11. STORAGE (only narrows existing v3 policies; buckets stay private)
--   site-media        : existing v3 rule = is_content_admin; now also needs a module.
--   foundation-media  : foundations module only.
--   member-documents  : r2 — split by command.
--       SELECT : owner folder, or Umrah-module admin (signed links).
--       INSERT/UPDATE/DELETE : owner folder ONLY. Admins can never write,
--       replace or delete a member's private files (the old FOR ALL policy
--       let an admin's DELETE pass the restrictive USING clause).
-- ---------------------------------------------------------------------
CREATE POLICY "rbac: site-media modules" ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated
  USING (bucket_id <> 'site-media' OR public.admin_can('content') OR public.admin_can('credentials')
         OR public.admin_can('umrah') OR public.admin_can('foundations'))
  WITH CHECK (bucket_id <> 'site-media' OR public.admin_can('content') OR public.admin_can('credentials')
         OR public.admin_can('umrah') OR public.admin_can('foundations'));
CREATE POLICY "rbac: foundation-media module" ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated
  USING (bucket_id <> 'foundation-media' OR public.admin_can('foundations'))
  WITH CHECK (bucket_id <> 'foundation-media' OR public.admin_can('foundations'));

CREATE POLICY "rbac: member-documents read" ON storage.objects AS RESTRICTIVE FOR SELECT TO authenticated
  USING (bucket_id <> 'member-documents'
         OR (storage.foldername(name))[1] = auth.uid()::text
         OR public.admin_can('umrah'));
CREATE POLICY "rbac: member-documents insert" ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (bucket_id <> 'member-documents' OR (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "rbac: member-documents update" ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (bucket_id <> 'member-documents' OR (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id <> 'member-documents' OR (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "rbac: member-documents delete" ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
  USING (bucket_id <> 'member-documents' OR (storage.foldername(name))[1] = auth.uid()::text);

-- Only flips a bucket that is currently public; never makes anything public.
UPDATE storage.buckets SET public = false
 WHERE id IN ('site-media','foundation-media','member-documents') AND public = true;

COMMIT;

-- Read-only checks: see v6_postcheck section in v7_postcheck_readonly.sql (C0).
