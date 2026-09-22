CREATE TYPE public.foundation_status AS ENUM ('planned','active','completed','archived');

CREATE TABLE public.foundation_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' AND char_length(slug) <= 160),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  summary text CHECK (summary IS NULL OR char_length(summary) <= 1000),
  description text CHECK (description IS NULL OR char_length(description) <= 20000),
  category text NOT NULL DEFAULT 'community_support' CHECK (char_length(category) <= 80),
  location text CHECK (location IS NULL OR char_length(location) <= 160),
  image_path text CHECK (image_path IS NULL OR char_length(image_path) <= 500),
  media jsonb NOT NULL DEFAULT '[]'::jsonb,
  start_date date,
  end_date date,
  status public.foundation_status NOT NULL DEFAULT 'planned',
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order BETWEEN -100000 AND 100000),
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.foundation_projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.foundation_projects TO authenticated;
GRANT ALL ON public.foundation_projects TO service_role;

ALTER TABLE public.foundation_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published foundation projects are public"
  ON public.foundation_projects FOR SELECT TO anon, authenticated
  USING (is_published = true AND status <> 'archived');

CREATE POLICY "Admins read every foundation project"
  ON public.foundation_projects FOR SELECT TO authenticated
  USING (public.is_content_admin(auth.uid()));

CREATE POLICY "Admins create foundation projects"
  ON public.foundation_projects FOR INSERT TO authenticated
  WITH CHECK (public.is_content_admin(auth.uid()));

CREATE POLICY "Admins update foundation projects"
  ON public.foundation_projects FOR UPDATE TO authenticated
  USING (public.is_content_admin(auth.uid()))
  WITH CHECK (public.is_content_admin(auth.uid()));

CREATE POLICY "Super admins delete foundation projects"
  ON public.foundation_projects FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER foundation_projects_updated_at
  BEFORE UPDATE ON public.foundation_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.foundation_project_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.foundation_projects(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  body text CHECK (body IS NULL OR char_length(body) <= 5000),
  image_path text CHECK (image_path IS NULL OR char_length(image_path) <= 500),
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.foundation_project_updates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.foundation_project_updates TO authenticated;
GRANT ALL ON public.foundation_project_updates TO service_role;

ALTER TABLE public.foundation_project_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published foundation updates are public"
  ON public.foundation_project_updates FOR SELECT TO anon, authenticated
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM public.foundation_projects p
      WHERE p.id = project_id AND p.is_published = true AND p.status <> 'archived'
    )
  );

CREATE POLICY "Admins read every foundation update"
  ON public.foundation_project_updates FOR SELECT TO authenticated
  USING (public.is_content_admin(auth.uid()));

CREATE POLICY "Admins create foundation updates"
  ON public.foundation_project_updates FOR INSERT TO authenticated
  WITH CHECK (public.is_content_admin(auth.uid()));

CREATE POLICY "Admins update foundation updates"
  ON public.foundation_project_updates FOR UPDATE TO authenticated
  USING (public.is_content_admin(auth.uid()))
  WITH CHECK (public.is_content_admin(auth.uid()));

CREATE POLICY "Admins delete foundation updates"
  ON public.foundation_project_updates FOR DELETE TO authenticated
  USING (public.is_content_admin(auth.uid()));

CREATE TRIGGER foundation_project_updates_updated_at
  BEFORE UPDATE ON public.foundation_project_updates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.capture_foundation_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  action_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.admin_audit_logs (admin_id, action, content_type, content_id, content_label)
    VALUES (auth.uid(), 'project created', 'foundation_project', NEW.id, NEW.title);
    RETURN NEW;
  END IF;

  action_name := CASE
    WHEN NEW.status = 'archived' AND OLD.status <> 'archived' THEN 'project archived'
    WHEN OLD.is_published = false AND NEW.is_published = true THEN 'project published'
    WHEN OLD.is_published = true AND NEW.is_published = false THEN 'project unpublished'
    WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'project status changed to ' || NEW.status::text
    ELSE 'project updated'
  END;

  INSERT INTO public.admin_audit_logs (admin_id, action, content_type, content_id, content_label)
  VALUES (auth.uid(), action_name, 'foundation_project', NEW.id, NEW.title);
  RETURN NEW;
END;
$$;

CREATE TRIGGER foundation_projects_audit
  AFTER INSERT OR UPDATE ON public.foundation_projects
  FOR EACH ROW EXECUTE FUNCTION public.capture_foundation_change();

CREATE INDEX foundation_projects_public_idx ON public.foundation_projects (is_published, status, sort_order);
CREATE INDEX foundation_project_updates_project_idx ON public.foundation_project_updates (project_id, created_at DESC);

ALTER TABLE public.content_entries DROP CONSTRAINT content_entries_content_type_check;
ALTER TABLE public.content_entries ADD CONSTRAINT content_entries_content_type_check CHECK (content_type = ANY (ARRAY[
  'homepage','about','service','project','blog_post','blog_category','business',
  'umrah','umrah_step','umrah_faq','umrah_notice','umrah_requirement','umrah_information','umrah_contact',
  'foundation','foundation_initiative','foundation_update','foundation_mission','foundation_vision','foundation_what_we_do',
  'community','contact'
]));