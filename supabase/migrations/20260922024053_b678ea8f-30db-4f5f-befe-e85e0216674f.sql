CREATE OR REPLACE FUNCTION public.guard_umrah_member_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR public.is_platform_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF OLD.status NOT IN ('draft','documents_required') THEN
    RAISE EXCEPTION 'This application can no longer be edited.';
  END IF;
  -- Members may only move their own application forward to "submitted".
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'submitted' THEN
    NEW.status := OLD.status;
    NEW.submitted_at := OLD.submitted_at;
  END IF;
  NEW.admin_message := OLD.admin_message;
  NEW.internal_note := OLD.internal_note;
  NEW.reviewed_by := OLD.reviewed_by;
  NEW.application_number := OLD.application_number;
  NEW.user_id := OLD.user_id;
  RETURN NEW;
END;
$function$;