
-- =============== types ===============
DO $$ BEGIN
  CREATE TYPE public.notification_category AS ENUM ('system','umrah','foundation','account','announcement');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_status AS ENUM ('draft','published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============== notification_messages ===============
CREATE TABLE public.notification_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text,
  category public.notification_category NOT NULL DEFAULT 'system',
  link_path text,
  status public.notification_status NOT NULL DEFAULT 'draft',
  audience text NOT NULL DEFAULT 'selected',
  created_by uuid,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.notification_messages TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.notification_messages TO authenticated;
GRANT ALL ON public.notification_messages TO service_role;

ALTER TABLE public.notification_messages ENABLE ROW LEVEL SECURITY;

-- =============== notification_recipients ===============
CREATE TABLE public.notification_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.notification_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);

CREATE INDEX notification_recipients_user_idx ON public.notification_recipients (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_recipients TO authenticated;
GRANT ALL ON public.notification_recipients TO service_role;

ALTER TABLE public.notification_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read their notification messages"
ON public.notification_messages FOR SELECT TO authenticated
USING (
  public.is_platform_admin(auth.uid())
  OR (status = 'published' AND EXISTS (
    SELECT 1 FROM public.notification_recipients r
    WHERE r.message_id = notification_messages.id AND r.user_id = auth.uid()
  ))
);

CREATE POLICY "Admins create notification messages"
ON public.notification_messages FOR INSERT TO authenticated
WITH CHECK (public.is_platform_admin(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Admins update notification messages"
ON public.notification_messages FOR UPDATE TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "Admins delete draft notification messages"
ON public.notification_messages FOR DELETE TO authenticated
USING (public.is_platform_admin(auth.uid()) AND status = 'draft');

CREATE POLICY "Members read their notification recipients"
ON public.notification_recipients FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "Admins add notification recipients"
ON public.notification_recipients FOR INSERT TO authenticated
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "Members mark their notifications read"
ON public.notification_recipients FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()))
WITH CHECK (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "Admins remove notification recipients"
ON public.notification_recipients FOR DELETE TO authenticated
USING (public.is_platform_admin(auth.uid()));

CREATE TRIGGER notification_messages_updated_at
BEFORE UPDATE ON public.notification_messages
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Members must not silently rewrite notification content through the read-state update.
CREATE OR REPLACE FUNCTION public.guard_notification_recipient_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_platform_admin(auth.uid()) THEN RETURN NEW; END IF;
  NEW.message_id := OLD.message_id;
  NEW.user_id := OLD.user_id;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END $$;

CREATE TRIGGER notification_recipients_guard
BEFORE UPDATE ON public.notification_recipients
FOR EACH ROW EXECUTE FUNCTION public.guard_notification_recipient_update();

-- =============== member_activities ===============
CREATE TABLE public.member_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  description text,
  section text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX member_activities_user_idx ON public.member_activities (user_id, created_at DESC);

GRANT SELECT ON public.member_activities TO authenticated;
GRANT ALL ON public.member_activities TO service_role;

ALTER TABLE public.member_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read their own activities"
ON public.member_activities FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

-- =============== system helpers ===============
CREATE OR REPLACE FUNCTION public.log_member_activity(
  _user_id uuid, _kind text, _title text, _description text DEFAULT NULL, _section text DEFAULT NULL
) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.member_activities (user_id, kind, title, description, section)
  VALUES (_user_id, _kind, _title, _description, _section);
$$;

REVOKE EXECUTE ON FUNCTION public.log_member_activity(uuid, text, text, text, text) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_system_notification(
  _title text, _body text, _category public.notification_category,
  _link text, _created_by uuid, _recipients uuid[]
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE mid uuid;
BEGIN
  IF _recipients IS NULL OR array_length(_recipients, 1) IS NULL THEN RETURN NULL; END IF;
  INSERT INTO public.notification_messages (title, body, category, link_path, status, audience, created_by, published_at)
  VALUES (_title, NULLIF(_body, ''), _category, _link, 'published', 'selected', _created_by, now())
  RETURNING id INTO mid;
  INSERT INTO public.notification_recipients (message_id, user_id)
  SELECT mid, u FROM unnest(_recipients) u
  ON CONFLICT (message_id, user_id) DO NOTHING;
  RETURN mid;
END $$;

REVOKE EXECUTE ON FUNCTION public.create_system_notification(text, text, public.notification_category, text, uuid, uuid[]) FROM public, anon, authenticated;

-- =============== automatic events ===============
CREATE OR REPLACE FUNCTION public.activity_from_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_member_activity(NEW.id, 'account_registered', 'Account created',
      'Welcome to BangisKebbi.com. Your member account is ready.', 'profile');
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
      PERFORM public.log_member_activity(NEW.id, 'account_status', 
        CASE WHEN NEW.is_active THEN 'Account activated' ELSE 'Account deactivated' END,
        'Your account status was changed by an administrator.', 'profile');
      PERFORM public.create_system_notification(
        CASE WHEN NEW.is_active THEN 'Your account is active' ELSE 'Your account was deactivated' END,
        'Contact support if you have any question about this change.', 'account', '/dashboard', NULL, ARRAY[NEW.id]);
    ELSIF (OLD.full_name, OLD.phone, OLD.country, OLD.city, OLD.preferred_language)
       IS DISTINCT FROM (NEW.full_name, NEW.phone, NEW.country, NEW.city, NEW.preferred_language) THEN
      PERFORM public.log_member_activity(NEW.id, 'profile_updated', 'Profile updated',
        'Your personal details were updated.', 'profile');
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER profiles_activity
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.activity_from_profile();

CREATE OR REPLACE FUNCTION public.activity_from_umrah_application()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_member_activity(NEW.user_id, 'umrah_saved', 'Umrah application saved',
      'Your Umrah application ' || NEW.application_number || ' was created.', 'umrah');
    RETURN NEW;
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.log_member_activity(NEW.user_id,
      CASE WHEN NEW.status = 'submitted' THEN 'umrah_submitted' ELSE 'umrah_status' END,
      CASE WHEN NEW.status = 'submitted' THEN 'Umrah application submitted'
           ELSE 'Umrah application status: ' || replace(NEW.status::text, '_', ' ') END,
      'Application ' || NEW.application_number || '.', 'umrah');
    PERFORM public.create_system_notification(
      CASE
        WHEN NEW.status = 'submitted' THEN 'Umrah application submitted'
        WHEN NEW.status = 'documents_required' THEN 'Documents required for your Umrah application'
        WHEN NEW.status = 'approved' THEN 'Your Umrah application was approved'
        WHEN NEW.status = 'rejected' THEN 'Your Umrah application was not approved'
        ELSE 'Umrah application status updated'
      END,
      'Application ' || NEW.application_number || ' is now ' || replace(NEW.status::text, '_', ' ') || '.',
      'umrah', '/dashboard', NULL, ARRAY[NEW.user_id]);
  ELSIF OLD.admin_message IS DISTINCT FROM NEW.admin_message AND COALESCE(NEW.admin_message, '') <> '' THEN
    PERFORM public.log_member_activity(NEW.user_id, 'umrah_message', 'Message about your Umrah application',
      'An administrator sent you a message.', 'umrah');
    PERFORM public.create_system_notification('Message about your Umrah application',
      NEW.admin_message, 'umrah', '/dashboard', NULL, ARRAY[NEW.user_id]);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER umrah_applications_activity
AFTER INSERT OR UPDATE ON public.umrah_applications
FOR EACH ROW EXECUTE FUNCTION public.activity_from_umrah_application();

CREATE OR REPLACE FUNCTION public.activity_from_umrah_document()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.log_member_activity(NEW.user_id, 'document_uploaded', 'Document uploaded',
    replace(initcap(replace(NEW.document_type, '_', ' ')), '  ', ' ') || ' was added to your Umrah application.', 'umrah');
  RETURN NEW;
END $$;

CREATE TRIGGER umrah_documents_activity
AFTER INSERT ON public.umrah_documents
FOR EACH ROW EXECUTE FUNCTION public.activity_from_umrah_document();

CREATE OR REPLACE FUNCTION public.activity_from_foundation_project()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE members uuid[];
BEGIN
  IF NOT (NEW.is_published AND (TG_OP = 'INSERT' OR OLD.is_published = false)) THEN
    RETURN NEW;
  END IF;
  SELECT array_agg(id) INTO members FROM public.profiles WHERE is_active = true;
  IF members IS NULL THEN RETURN NEW; END IF;

  PERFORM public.create_system_notification(
    'New BK Foundations project: ' || NEW.title,
    COALESCE(NEW.summary, 'A new community project was published.'),
    'foundation', '/foundation/' || NEW.slug, NULL, members);

  INSERT INTO public.member_activities (user_id, kind, title, description, section)
  SELECT m, 'foundation_published', 'New BK Foundations project',
         NEW.title, 'foundations'
  FROM unnest(members) m;
  RETURN NEW;
END $$;

CREATE TRIGGER foundation_projects_activity
AFTER INSERT OR UPDATE ON public.foundation_projects
FOR EACH ROW EXECUTE FUNCTION public.activity_from_foundation_project();

-- =============== migrate existing notifications ===============
WITH moved AS (
  INSERT INTO public.notification_messages (title, body, category, status, audience, created_by, published_at, created_at)
  SELECT n.title, n.body,
         CASE
           WHEN n.category = 'umrah' THEN 'umrah'::public.notification_category
           WHEN n.category = 'foundation' THEN 'foundation'::public.notification_category
           WHEN n.category IN ('general','community','platform') THEN 'announcement'::public.notification_category
           ELSE 'system'::public.notification_category
         END,
         'published', 'selected', n.created_by, n.created_at, n.created_at
  FROM public.notifications n
  RETURNING id, title, created_at
)
SELECT 1;

INSERT INTO public.notification_recipients (message_id, user_id, read_at, created_at)
SELECT m.id, n.user_id, n.read_at, n.created_at
FROM public.notifications n
JOIN LATERAL (
  SELECT nm.id FROM public.notification_messages nm
  WHERE nm.title = n.title AND nm.created_at = n.created_at
    AND NOT EXISTS (SELECT 1 FROM public.notification_recipients r WHERE r.message_id = nm.id)
  LIMIT 1
) m ON true
ON CONFLICT (message_id, user_id) DO NOTHING;

-- backfill registration activity for existing members
INSERT INTO public.member_activities (user_id, kind, title, description, section, created_at)
SELECT p.id, 'account_registered', 'Account created', 'Your member account was created.', 'profile', p.created_at
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.member_activities a WHERE a.user_id = p.id AND a.kind = 'account_registered'
);
