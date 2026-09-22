DROP POLICY "Public sees verified visible partners" ON public.umrah_partners;

CREATE POLICY "Public sees verified visible partners" ON public.umrah_partners
  FOR SELECT TO anon, authenticated
  USING (verification_status = 'verified' AND is_visible = true);

CREATE POLICY "Admins see all partners" ON public.umrah_partners
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));