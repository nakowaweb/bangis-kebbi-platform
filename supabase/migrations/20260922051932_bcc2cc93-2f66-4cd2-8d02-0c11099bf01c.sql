CREATE POLICY "Foundation media readable by signed-in users"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'foundation-media');

CREATE POLICY "Admins upload foundation media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'foundation-media' AND public.is_content_admin(auth.uid()));

CREATE POLICY "Admins update foundation media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'foundation-media' AND public.is_content_admin(auth.uid()))
  WITH CHECK (bucket_id = 'foundation-media' AND public.is_content_admin(auth.uid()));

CREATE POLICY "Admins delete foundation media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'foundation-media' AND public.is_content_admin(auth.uid()));