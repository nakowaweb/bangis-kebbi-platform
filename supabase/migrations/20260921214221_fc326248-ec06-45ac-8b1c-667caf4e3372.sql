CREATE OR REPLACE FUNCTION public.capture_content_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  next_revision integer;
  action_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.admin_audit_logs (admin_id, action, content_type, content_id, content_label)
    VALUES (auth.uid(), 'created', NEW.content_type, NEW.id, NEW.title);
    RETURN NEW;
  END IF;

  SELECT COALESCE(MAX(revision_number), 0) + 1 INTO next_revision
  FROM public.content_revisions
  WHERE content_entry_id = OLD.id;

  INSERT INTO public.content_revisions (content_entry_id, revision_number, snapshot, change_note, created_by)
  VALUES (OLD.id, next_revision, to_jsonb(OLD), 'Automatic snapshot before change', auth.uid());

  action_name := CASE
    WHEN OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN 'archived'
    WHEN OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN 'restored'
    WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'status changed to ' || NEW.status::text
    ELSE 'edited'
  END;

  INSERT INTO public.admin_audit_logs (admin_id, action, content_type, content_id, content_label)
  VALUES (auth.uid(), action_name, NEW.content_type, NEW.id, NEW.title);
  RETURN NEW;
END;
$$;

CREATE TRIGGER content_entries_audit
AFTER INSERT OR UPDATE ON public.content_entries
FOR EACH ROW EXECUTE FUNCTION public.capture_content_change();

CREATE OR REPLACE FUNCTION public.capture_settings_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  next_revision integer;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    SELECT COALESCE(MAX(revision_number), 0) + 1 INTO next_revision
    FROM public.content_revisions
    WHERE site_settings_id = OLD.id;

    INSERT INTO public.content_revisions (site_settings_id, revision_number, snapshot, change_note, created_by)
    VALUES (OLD.id, next_revision, to_jsonb(OLD), 'Automatic snapshot before settings change', auth.uid());
  END IF;

  INSERT INTO public.admin_audit_logs (admin_id, action, content_type, content_id, content_label)
  VALUES (auth.uid(), CASE WHEN TG_OP = 'INSERT' THEN 'created' ELSE 'edited' END, 'site_settings', NEW.id, NEW.website_name);
  RETURN NEW;
END;
$$;

CREATE TRIGGER site_settings_audit
AFTER INSERT OR UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.capture_settings_change();

CREATE OR REPLACE FUNCTION public.protect_core_media()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF OLD.is_protected THEN
    RAISE EXCEPTION 'Protected brand media must be unprotected through an explicit Super Admin confirmation before deletion.';
  END IF;
  IF OLD.usage_count > 0 THEN
    RAISE EXCEPTION 'Media in active use cannot be deleted.';
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER media_assets_delete_guard
BEFORE DELETE ON public.media_assets
FOR EACH ROW EXECUTE FUNCTION public.protect_core_media();