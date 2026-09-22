UPDATE public.umrah_applications SET status = 'submitted' WHERE status = 'approved' AND reviewed_by IS NULL;

CREATE OR REPLACE FUNCTION public.guard_umrah_member_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_platform_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF OLD.status NOT IN ('draft','documents_required') THEN
    RAISE EXCEPTION 'This application can no longer be edited.';
  END IF;
  NEW.status := OLD.status;
  NEW.admin_message := OLD.admin_message;
  NEW.internal_note := OLD.internal_note;
  NEW.reviewed_by := OLD.reviewed_by;
  NEW.submitted_at := OLD.submitted_at;
  NEW.application_number := OLD.application_number;
  NEW.user_id := OLD.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS umrah_applications_member_guard ON public.umrah_applications;
CREATE TRIGGER umrah_applications_member_guard
BEFORE UPDATE ON public.umrah_applications
FOR EACH ROW EXECUTE FUNCTION public.guard_umrah_member_update();