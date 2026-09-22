-- Status workflow
CREATE TYPE public.umrah_status AS ENUM ('draft','submitted','under_review','documents_required','approved','processing','completed','rejected','cancelled');

-- Application numbers
CREATE SEQUENCE IF NOT EXISTS public.umrah_application_seq;

CREATE TABLE public.umrah_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_number text NOT NULL UNIQUE DEFAULT ('UMR-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.umrah_application_seq')::text, 5, '0')),
  status public.umrah_status NOT NULL DEFAULT 'draft',
  full_name text NOT NULL DEFAULT '',
  date_of_birth date,
  phone text,
  email text,
  nationality text,
  country_of_residence text,
  city text,
  passport_number text,
  passport_issue_date date,
  passport_expiry_date date,
  passport_issuing_country text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  preferred_travel_period text,
  travel_notes text,
  member_notes text,
  admin_message text,
  internal_note text,
  submitted_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

GRANT SELECT, INSERT, UPDATE ON public.umrah_applications TO authenticated;
GRANT ALL ON public.umrah_applications TO service_role;
GRANT USAGE ON SEQUENCE public.umrah_application_seq TO authenticated, service_role;
ALTER TABLE public.umrah_applications ENABLE ROW LEVEL SECURITY;

-- Members never read internal_note directly: reads go through a column-projected server function,
-- but we also keep admin-only visibility enforced in the safe view below.
CREATE POLICY "Members read their own application" ON public.umrah_applications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_platform_admin(auth.uid()));

CREATE POLICY "Members create their own application" ON public.umrah_applications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'draft');

CREATE POLICY "Members edit their own open application" ON public.umrah_applications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status IN ('draft','documents_required'))
  WITH CHECK (auth.uid() = user_id AND status IN ('draft','submitted','documents_required'));

CREATE POLICY "Admins manage applications" ON public.umrah_applications
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE TRIGGER umrah_applications_updated_at
  BEFORE UPDATE ON public.umrah_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Documents
CREATE TABLE public.umrah_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.umrah_applications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('passport','identification','photograph','other')),
  storage_path text NOT NULL UNIQUE,
  original_name text NOT NULL,
  mime_type text NOT NULL,
  byte_size bigint NOT NULL,
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','accepted','rejected')),
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.umrah_documents TO authenticated;
GRANT ALL ON public.umrah_documents TO service_role;
ALTER TABLE public.umrah_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read their own umrah documents" ON public.umrah_documents
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_platform_admin(auth.uid()));

CREATE POLICY "Members upload their own umrah documents" ON public.umrah_documents
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members delete their own pending umrah documents" ON public.umrah_documents
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND review_status = 'pending');

CREATE POLICY "Admins review umrah documents" ON public.umrah_documents
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE TRIGGER umrah_documents_updated_at
  BEFORE UPDATE ON public.umrah_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- History
CREATE TABLE public.umrah_application_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.umrah_applications(id) ON DELETE CASCADE,
  actor_id uuid,
  actor_role text NOT NULL DEFAULT 'member' CHECK (actor_role IN ('member','admin','system')),
  action text NOT NULL,
  from_status public.umrah_status,
  to_status public.umrah_status,
  member_visible boolean NOT NULL DEFAULT true,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.umrah_application_history TO authenticated;
GRANT ALL ON public.umrah_application_history TO service_role;
ALTER TABLE public.umrah_application_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read visible history of their application" ON public.umrah_application_history
  FOR SELECT TO authenticated
  USING (
    public.is_platform_admin(auth.uid())
    OR (member_visible AND EXISTS (
      SELECT 1 FROM public.umrah_applications a
      WHERE a.id = application_id AND a.user_id = auth.uid()
    ))
  );

CREATE POLICY "Participants add history" ON public.umrah_application_history
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND (
      public.is_platform_admin(auth.uid())
      OR EXISTS (SELECT 1 FROM public.umrah_applications a WHERE a.id = application_id AND a.user_id = auth.uid())
    )
  );

CREATE INDEX umrah_history_application_idx ON public.umrah_application_history (application_id, created_at DESC);
CREATE INDEX umrah_documents_application_idx ON public.umrah_documents (application_id, created_at DESC);
CREATE INDEX umrah_applications_status_idx ON public.umrah_applications (status, created_at DESC);

-- Partners (empty by design; nothing is claimed until a Super Admin adds and verifies it)
CREATE TABLE public.umrah_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text,
  contact_email text,
  contact_phone text,
  website_url text,
  services text,
  verification_status text NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified','pending','verified')),
  is_visible boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.umrah_partners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.umrah_partners TO authenticated;
GRANT ALL ON public.umrah_partners TO service_role;
ALTER TABLE public.umrah_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public sees verified visible partners" ON public.umrah_partners
  FOR SELECT TO anon, authenticated
  USING ((verification_status = 'verified' AND is_visible = true) OR public.is_platform_admin(auth.uid()));

CREATE POLICY "Admins add partners" ON public.umrah_partners
  FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Admins edit partners" ON public.umrah_partners
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "Super admins delete partners" ON public.umrah_partners
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE TRIGGER umrah_partners_updated_at
  BEFORE UPDATE ON public.umrah_partners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Extend editable content areas with Umrah requirements and general Umrah information
ALTER TABLE public.content_entries DROP CONSTRAINT IF EXISTS content_entries_content_type_check;
ALTER TABLE public.content_entries ADD CONSTRAINT content_entries_content_type_check
  CHECK (content_type IN ('homepage','about','service','project','blog_post','blog_category','business','umrah','umrah_step','umrah_faq','umrah_notice','umrah_requirement','umrah_information','umrah_contact','foundation','foundation_initiative','foundation_update','community','contact'));