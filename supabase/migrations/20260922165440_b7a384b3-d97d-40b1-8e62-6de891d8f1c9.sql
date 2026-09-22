
REVOKE EXECUTE ON FUNCTION public.guard_notification_recipient_update() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.activity_from_profile() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.activity_from_umrah_application() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.activity_from_umrah_document() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.activity_from_foundation_project() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_umrah_member_update() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin(uuid) FROM public, anon;
