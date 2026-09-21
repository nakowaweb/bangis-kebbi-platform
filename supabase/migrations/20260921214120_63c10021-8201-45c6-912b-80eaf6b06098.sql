CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'content_manager', 'support', 'finance');
CREATE TYPE public.content_status AS ENUM ('draft', 'published', 'unpublished', 'archived');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_content_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin', 'admin', 'content_manager')
  );
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_content_admin(uuid) TO authenticated;

CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE DEFAULT 'primary',
  website_name text NOT NULL DEFAULT 'BangisKebbi.com' CHECK (char_length(website_name) BETWEEN 1 AND 120),
  company_name text NOT NULL DEFAULT 'BANGISKEBBI GLOBAL LTD' CHECK (char_length(company_name) BETWEEN 1 AND 160),
  location text NOT NULL DEFAULT 'Abuja, Nigeria' CHECK (char_length(location) BETWEEN 1 AND 160),
  global_status text NOT NULL DEFAULT 'Working globally' CHECK (char_length(global_status) BETWEEN 1 AND 160),
  contact_email text CHECK (contact_email IS NULL OR char_length(contact_email) <= 254),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 40),
  whatsapp text CHECK (whatsapp IS NULL OR char_length(whatsapp) <= 40),
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  footer_content text NOT NULL DEFAULT 'More than a website — a global platform.' CHECK (char_length(footer_content) <= 500),
  default_language text NOT NULL DEFAULT 'en' CHECK (default_language IN ('en', 'ha', 'ar')),
  seo_title text NOT NULL DEFAULT 'Bangis Kebbi — AI Web Designer, Developer & Digital Entrepreneur' CHECK (char_length(seo_title) <= 180),
  seo_description text NOT NULL DEFAULT 'BangisKebbi.com is a global platform for technology, business, community and real opportunities.' CHECK (char_length(seo_description) <= 500),
  logo_path text,
  favicon_path text,
  profile_image_path text,
  open_graph_image_path text,
  is_active boolean NOT NULL DEFAULT true,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active site settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (is_active = true OR public.is_content_admin(auth.uid()));
CREATE POLICY "Content admins can add site settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (public.is_content_admin(auth.uid()) AND updated_by = auth.uid());
CREATE POLICY "Content admins can edit site settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.is_content_admin(auth.uid())) WITH CHECK (public.is_content_admin(auth.uid()) AND updated_by = auth.uid());
CREATE POLICY "Super admins can delete site settings" ON public.site_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.content_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('homepage', 'about', 'service', 'project', 'blog_post', 'blog_category', 'business', 'umrah', 'umrah_step', 'umrah_faq', 'umrah_notice', 'foundation', 'foundation_initiative', 'foundation_update', 'community', 'contact')),
  slug text NOT NULL CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' AND char_length(slug) <= 160),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  summary text CHECK (summary IS NULL OR char_length(summary) <= 1000),
  body text CHECK (body IS NULL OR char_length(body) <= 20000),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_path text,
  status public.content_status NOT NULL DEFAULT 'draft',
  is_enabled boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order BETWEEN -100000 AND 100000),
  published_at timestamptz,
  scheduled_for timestamptz,
  deleted_at timestamptz,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_type, slug)
);
GRANT SELECT ON public.content_entries TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.content_entries TO authenticated;
GRANT ALL ON public.content_entries TO service_role;
ALTER TABLE public.content_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published content" ON public.content_entries FOR SELECT TO anon, authenticated USING ((status = 'published' AND is_enabled = true AND deleted_at IS NULL AND (published_at IS NULL OR published_at <= now())) OR public.is_content_admin(auth.uid()));
CREATE POLICY "Content admins can add content" ON public.content_entries FOR INSERT TO authenticated WITH CHECK (public.is_content_admin(auth.uid()) AND updated_by = auth.uid());
CREATE POLICY "Content admins can edit content" ON public.content_entries FOR UPDATE TO authenticated USING (public.is_content_admin(auth.uid())) WITH CHECK (public.is_content_admin(auth.uid()) AND updated_by = auth.uid());
CREATE POLICY "Super admins can permanently delete content" ON public.content_entries FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE INDEX content_entries_public_idx ON public.content_entries (content_type, status, is_enabled, sort_order) WHERE deleted_at IS NULL;
CREATE INDEX content_entries_admin_idx ON public.content_entries (content_type, updated_at DESC);
CREATE TRIGGER content_entries_updated_at BEFORE UPDATE ON public.content_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  storage_path text NOT NULL UNIQUE CHECK (char_length(storage_path) <= 500),
  mime_type text NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml')),
  alt_text text NOT NULL DEFAULT '' CHECK (char_length(alt_text) <= 500),
  byte_size bigint NOT NULL CHECK (byte_size > 0 AND byte_size <= 10485760),
  width integer CHECK (width IS NULL OR width > 0),
  height integer CHECK (height IS NULL OR height > 0),
  is_protected boolean NOT NULL DEFAULT false,
  usage_count integer NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  uploaded_by uuid NOT NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Content admins can view media" ON public.media_assets FOR SELECT TO authenticated USING (public.is_content_admin(auth.uid()));
CREATE POLICY "Content admins can upload media records" ON public.media_assets FOR INSERT TO authenticated WITH CHECK (public.is_content_admin(auth.uid()) AND uploaded_by = auth.uid());
CREATE POLICY "Content admins can edit media records" ON public.media_assets FOR UPDATE TO authenticated USING (public.is_content_admin(auth.uid())) WITH CHECK (public.is_content_admin(auth.uid()));
CREATE POLICY "Super admins can remove unprotected media" ON public.media_assets FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'super_admin') AND is_protected = false AND usage_count = 0);
CREATE INDEX media_assets_admin_idx ON public.media_assets (deleted_at, created_at DESC);
CREATE TRIGGER media_assets_updated_at BEFORE UPDATE ON public.media_assets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.content_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_entry_id uuid REFERENCES public.content_entries(id) ON DELETE CASCADE,
  site_settings_id uuid REFERENCES public.site_settings(id) ON DELETE CASCADE,
  revision_number integer NOT NULL CHECK (revision_number > 0),
  snapshot jsonb NOT NULL,
  change_note text CHECK (change_note IS NULL OR char_length(change_note) <= 500),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((content_entry_id IS NOT NULL)::int + (site_settings_id IS NOT NULL)::int = 1)
);
GRANT SELECT, INSERT ON public.content_revisions TO authenticated;
GRANT ALL ON public.content_revisions TO service_role;
ALTER TABLE public.content_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Content admins can view revisions" ON public.content_revisions FOR SELECT TO authenticated USING (public.is_content_admin(auth.uid()));
CREATE POLICY "Content admins can add revisions" ON public.content_revisions FOR INSERT TO authenticated WITH CHECK (public.is_content_admin(auth.uid()) AND created_by = auth.uid());
CREATE UNIQUE INDEX content_revision_number_idx ON public.content_revisions (content_entry_id, revision_number) WHERE content_entry_id IS NOT NULL;
CREATE UNIQUE INDEX settings_revision_number_idx ON public.content_revisions (site_settings_id, revision_number) WHERE site_settings_id IS NOT NULL;

CREATE TABLE public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL CHECK (char_length(action) BETWEEN 1 AND 120),
  content_type text NOT NULL CHECK (char_length(content_type) BETWEEN 1 AND 80),
  content_id uuid,
  content_label text CHECK (content_label IS NULL OR char_length(content_label) <= 200),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Content admins can view audit logs" ON public.admin_audit_logs FOR SELECT TO authenticated USING (public.is_content_admin(auth.uid()));
CREATE POLICY "Content admins can add audit logs" ON public.admin_audit_logs FOR INSERT TO authenticated WITH CHECK (public.is_content_admin(auth.uid()) AND admin_id = auth.uid());
CREATE INDEX admin_audit_logs_recent_idx ON public.admin_audit_logs (created_at DESC);

CREATE POLICY "Content admins can view site media" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'site-media' AND public.is_content_admin(auth.uid()));
CREATE POLICY "Content admins can upload site media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-media' AND public.is_content_admin(auth.uid()) AND owner_id = auth.uid()::text);
CREATE POLICY "Content admins can update site media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'site-media' AND public.is_content_admin(auth.uid())) WITH CHECK (bucket_id = 'site-media' AND public.is_content_admin(auth.uid()));
CREATE POLICY "Super admins can delete site media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'site-media' AND public.has_role(auth.uid(), 'super_admin'));

INSERT INTO public.site_settings (
  setting_key, website_name, company_name, location, global_status, footer_content,
  default_language, seo_title, seo_description, is_active
) VALUES (
  'primary', 'BangisKebbi.com', 'BANGISKEBBI GLOBAL LTD', 'Abuja, Nigeria', 'Working globally',
  'More than a website — a global platform.', 'en',
  'Bangis Kebbi — AI Web Designer, Developer & Digital Entrepreneur',
  'BangisKebbi.com is a global platform for technology, business, community and real opportunities.', true
);

INSERT INTO public.content_entries (content_type, slug, title, summary, payload, status, is_enabled, is_featured, sort_order, published_at)
VALUES
  ('homepage', 'hero', 'A GLOBAL PLATFORM', 'Turning Ideas Into Real Opportunities', '{"eyebrow":"More than a website","description":"Technology, people and practical digital solutions working together for a brighter future.","primaryCta":"Hire Me","secondaryCta":"Explore My Work"}'::jsonb, 'published', true, true, 0, now()),
  ('about', 'summary', 'A passion for technology, people and impact.', 'I build practical digital solutions, connect people to opportunities and support initiatives that make a positive difference.', '{}'::jsonb, 'published', true, true, 0, now()),
  ('contact', 'homepage-cta', 'Let’s build something meaningful together.', 'Have a project, idea or partnership in mind? I’d love to hear from you.', '{}'::jsonb, 'published', true, true, 0, now());