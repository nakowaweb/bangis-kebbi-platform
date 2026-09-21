REVOKE ALL ON FUNCTION public.is_platform_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ensure_member_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.claim_first_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ensure_member_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_first_super_admin() TO authenticated, service_role;