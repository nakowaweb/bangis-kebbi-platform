CREATE TYPE public.translation_status AS ENUM ('draft', 'ready', 'published');

CREATE TABLE public.site_social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  url text NOT NULL,
  display_label text NOT NULL DEFAULT '',
  icon_key text,
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_social_links_platform_check CHECK (platform IN ('linkedin','whatsapp','facebook','tiktok','youtube','instagram','x','telegram')),
  CONSTRAINT site_social_links_url_check CHECK (url ~* '^https://[^\s]+$'),
  CONSTRAINT site_social_links_platform_unique UNIQUE (platform)
);

GRANT SELECT ON public.site_social_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_social_links TO authenticated;
GRANT ALL ON public.site_social_links TO service_role;

ALTER TABLE public.site_social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read enabled social links"
  ON public.site_social_links FOR SELECT
  TO anon, authenticated
  USING (is_enabled = true OR public.is_content_admin(auth.uid()));

CREATE POLICY "Admins can add social links"
  ON public.site_social_links FOR INSERT
  TO authenticated
  WITH CHECK (public.is_content_admin(auth.uid()));

CREATE POLICY "Admins can edit social links"
  ON public.site_social_links FOR UPDATE
  TO authenticated
  USING (public.is_content_admin(auth.uid()))
  WITH CHECK (public.is_content_admin(auth.uid()));

CREATE POLICY "Admins can remove social links"
  ON public.site_social_links FOR DELETE
  TO authenticated
  USING (public.is_content_admin(auth.uid()));

CREATE TRIGGER site_social_links_updated_at
  BEFORE UPDATE ON public.site_social_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.content_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_entry_id uuid NOT NULL REFERENCES public.content_entries(id) ON DELETE CASCADE,
  language text NOT NULL,
  title text NOT NULL DEFAULT '',
  summary text,
  body text,
  image_alt text,
  seo_title text,
  seo_description text,
  og_title text,
  og_description text,
  status public.translation_status NOT NULL DEFAULT 'draft',
  is_machine_generated boolean NOT NULL DEFAULT false,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_translations_language_check CHECK (language IN ('ha','ar')),
  CONSTRAINT content_translations_unique UNIQUE (content_entry_id, language)
);

GRANT SELECT ON public.content_translations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_translations TO authenticated;
GRANT ALL ON public.content_translations TO service_role;

ALTER TABLE public.content_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published translations"
  ON public.content_translations FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.content_entries e
      WHERE e.id = content_entry_id
        AND e.status = 'published'
        AND e.is_enabled = true
        AND e.deleted_at IS NULL
    )
  );

CREATE POLICY "Admins can read all translations"
  ON public.content_translations FOR SELECT
  TO authenticated
  USING (public.is_content_admin(auth.uid()));

CREATE POLICY "Admins can add translations"
  ON public.content_translations FOR INSERT
  TO authenticated
  WITH CHECK (public.is_content_admin(auth.uid()));

CREATE POLICY "Admins can edit translations"
  ON public.content_translations FOR UPDATE
  TO authenticated
  USING (public.is_content_admin(auth.uid()))
  WITH CHECK (public.is_content_admin(auth.uid()));

CREATE POLICY "Admins can remove translations"
  ON public.content_translations FOR DELETE
  TO authenticated
  USING (public.is_content_admin(auth.uid()));

CREATE TRIGGER content_translations_updated_at
  BEFORE UPDATE ON public.content_translations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX content_translations_lookup ON public.content_translations (content_entry_id, language, status);