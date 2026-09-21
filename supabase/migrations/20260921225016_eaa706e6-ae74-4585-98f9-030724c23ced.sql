-- Member profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text,
  country text,
  city text,
  preferred_language text NOT NULL DEFAULT 'en',
  avatar_path text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('super_admin','admin'));
$$;

CREATE POLICY "Members view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_platform_admin(auth.uid()));
CREATE POLICY "Members create their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Members update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins update member profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Role administration
CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "Super admins grant roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins revoke roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- Every signed-in person gets the baseline member role once
CREATE OR REPLACE FUNCTION public.ensure_member_role()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'member')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;
GRANT EXECUTE ON FUNCTION public.ensure_member_role() TO authenticated;

-- One-time bootstrap: the very first account can claim super admin while none exists
CREATE OR REPLACE FUNCTION public.claim_first_super_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'super_admin') THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'super_admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.admin_audit_logs (admin_id, action, content_type, content_label)
  VALUES (auth.uid(), 'claimed super admin (bootstrap)', 'user_roles', 'super_admin');
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_first_super_admin() TO authenticated;

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  category text NOT NULL DEFAULT 'general',
  read_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read their notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_platform_admin(auth.uid()));
CREATE POLICY "Members mark their notifications read" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins send notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (public.is_platform_admin(auth.uid()) AND created_by = auth.uid());
GRANT INSERT ON public.notifications TO authenticated;
CREATE INDEX notifications_user_created_idx ON public.notifications (user_id, created_at DESC);

-- Private member documents (metadata only; files live in a private bucket)
CREATE TABLE public.member_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  original_name text NOT NULL,
  mime_type text NOT NULL,
  byte_size bigint NOT NULL,
  review_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.member_documents TO authenticated;
GRANT ALL ON public.member_documents TO service_role;
ALTER TABLE public.member_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read their own documents" ON public.member_documents
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_platform_admin(auth.uid()));
CREATE POLICY "Members upload their own documents" ON public.member_documents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members delete their own pending documents" ON public.member_documents
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND review_status = 'pending');
CREATE TRIGGER member_documents_updated_at BEFORE UPDATE ON public.member_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Private storage policies for member documents (bucket created separately)
CREATE POLICY "Members manage own document files" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'member-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'member-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Admins read member document files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'member-documents' AND public.is_platform_admin(auth.uid()));