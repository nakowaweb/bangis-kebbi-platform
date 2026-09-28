GRANT SELECT ON public.umrah_partners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.umrah_partners TO authenticated;
GRANT ALL ON public.umrah_partners TO service_role;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';