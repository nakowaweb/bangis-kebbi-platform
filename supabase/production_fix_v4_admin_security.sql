-- =====================================================================
-- BangisKebbi.com — v4: Super Admin protection, admin module permissions,
-- forced password change. Run AFTER production_fix_v3.sql.
-- Safe to re-run. Deletes no data. Never disables RLS.
-- =====================================================================
BEGIN;

-- 1. Forced password change flag (never stores passwords)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

-- 2. Exactly one Super Admin
DO $$
BEGIN
  IF (SELECT count(*) FROM public.user_roles WHERE role = 'super_admin') > 1 THEN
    RAISE EXCEPTION 'More than one super_admin exists. Remove the extra rows manually, then re-run.';
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_single_super_admin
  ON public.user_roles ((role)) WHERE role = 'super_admin';

-- Block creating, changing, or removing the super_admin row through the app.
-- (Also blocks deleting the Super Admin auth account, because the cascade
-- delete of their role row fires this trigger.)
CREATE OR REPLACE FUNCTION public.protect_super_admin_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.role = 'super_admin' THEN
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'super_admin') THEN
      RAISE EXCEPTION 'A Super Admin already exists. A second Super Admin cannot be created.';
    END IF;
    IF current_user NOT IN ('postgres', 'supabase_admin') THEN
      RAISE EXCEPTION 'The Super Admin role can only be assigned directly in the database.';
    END IF;
  END IF;
  IF TG_OP = 'UPDATE' AND (OLD.role = 'super_admin' OR NEW.role = 'super_admin') THEN
    RAISE EXCEPTION 'The Super Admin role cannot be changed.';
  END IF;
  IF TG_OP = 'DELETE' AND OLD.role = 'super_admin' AND current_user NOT IN ('postgres', 'supabase_admin') THEN
    RAISE EXCEPTION 'The Super Admin cannot be removed, demoted or deleted.';
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
DROP TRIGGER IF EXISTS protect_super_admin_role ON public.user_roles;
CREATE TRIGGER protect_super_admin_role
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin_role();

-- Nobody can claim Super Admin from the app.
DO $$ BEGIN
  IF to_regprocedure('public.claim_first_super_admin()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.claim_first_super_admin() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;

-- 3. Admin module permissions (chosen by the Super Admin)
CREATE TABLE IF NOT EXISTS public.admin_permissions (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module text NOT NULL CHECK (module IN ('content','translations','social','credentials','members','notifications','umrah','foundations')),
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, module)
);
GRANT SELECT, INSERT, DELETE ON public.admin_permissions TO authenticated;
GRANT ALL ON public.admin_permissions TO service_role;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Own or super admin reads permissions" ON public.admin_permissions;
CREATE POLICY "Own or super admin reads permissions" ON public.admin_permissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));
DROP POLICY IF EXISTS "Super admin grants permissions" ON public.admin_permissions;
CREATE POLICY "Super admin grants permissions" ON public.admin_permissions
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
DROP POLICY IF EXISTS "Super admin removes permissions" ON public.admin_permissions;
CREATE POLICY "Super admin removes permissions" ON public.admin_permissions
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

CREATE OR REPLACE FUNCTION public.has_admin_permission(_user_id uuid, _module text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'super_admin')
      OR EXISTS (SELECT 1 FROM public.admin_permissions WHERE user_id = _user_id AND module = _module);
$$;
REVOKE EXECUTE ON FUNCTION public.has_admin_permission(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_admin_permission(uuid, text) TO authenticated;

-- 4. Only the Super Admin may insert/delete role rows (re-assert v3 policy intent)
DROP POLICY IF EXISTS "Super admin inserts roles" ON public.user_roles;
CREATE POLICY "Super admin inserts roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'super_admin') AND role <> 'super_admin');
DROP POLICY IF EXISTS "Super admin deletes roles" ON public.user_roles;
CREATE POLICY "Super admin deletes roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'super_admin') AND role <> 'super_admin');

COMMIT;

-- ============================ CHECKS ================================
-- a) exactly one super admin (expect 1)
SELECT count(*) AS super_admins FROM public.user_roles WHERE role = 'super_admin';
-- b) RLS on new table (expect true)
SELECT relrowsecurity FROM pg_class WHERE oid = 'public.admin_permissions'::regclass;
-- c) anon cannot execute the permission helper (expect false)
SELECT has_function_privilege('anon', 'public.has_admin_permission(uuid,text)', 'EXECUTE') AS anon_exec;
-- d) claim function locked for authenticated (expect false or no row)
SELECT has_function_privilege('authenticated', p.oid, 'EXECUTE') AS claim_open
FROM pg_proc p WHERE p.proname = 'claim_first_super_admin';
-- e) protection trigger present (expect 1 row)
SELECT tgname FROM pg_trigger WHERE tgname = 'protect_super_admin_role';
