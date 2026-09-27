CREATE TABLE public.ui_text_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language text NOT NULL CHECK (language ~ '^[a-z]{2,3}(-[A-Za-z]{2,4})?$'),
  source_hash text NOT NULL,
  source_text text NOT NULL,
  translated_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (language, source_hash)
);
GRANT SELECT ON public.ui_text_translations TO anon, authenticated;
GRANT ALL ON public.ui_text_translations TO service_role;
ALTER TABLE public.ui_text_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read cached website translations" ON public.ui_text_translations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Content admins can remove cached translations" ON public.ui_text_translations FOR DELETE TO authenticated USING (public.is_content_admin(auth.uid()));
GRANT DELETE ON public.ui_text_translations TO authenticated;