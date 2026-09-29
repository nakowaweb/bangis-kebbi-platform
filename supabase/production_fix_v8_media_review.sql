-- BangisKebbi.com V8 — Media review metadata
-- REVIEW ONLY: do not execute on production without explicit approval.
-- Non-destructive: existing rows and files remain; existing assets are preserved as published.

BEGIN;

ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS caption text,
  ADD COLUMN IF NOT EXISTS status text;

UPDATE public.media_assets
SET status = 'published'
WHERE status IS NULL;

ALTER TABLE public.media_assets
  ALTER COLUMN status SET DEFAULT 'draft',
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.media_assets
  DROP CONSTRAINT IF EXISTS media_assets_status_check;

ALTER TABLE public.media_assets
  ADD CONSTRAINT media_assets_status_check
  CHECK (status IN ('draft', 'published'));

CREATE OR REPLACE FUNCTION public.update_media_asset_review(
  _id uuid,
  _caption text,
  _status text
)
RETURNS public.media_assets
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  updated public.media_assets;
BEGIN
  IF _status NOT IN ('draft', 'published') THEN
    RAISE EXCEPTION 'Invalid media review status';
  END IF;
  IF NOT public.is_content_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Content administrator access is required';
  END IF;

  UPDATE public.media_assets
  SET caption = NULLIF(btrim(_caption), ''), status = _status
  WHERE id = _id
  RETURNING * INTO updated;

  IF updated.id IS NULL THEN RAISE EXCEPTION 'Media not found'; END IF;

  INSERT INTO public.admin_audit_logs
    (admin_id, action, content_type, content_id, content_label, metadata)
  VALUES
    (auth.uid(), 'updated media review', 'media', updated.id, updated.name,
     jsonb_build_object('status', updated.status));
  RETURN updated;
END;
$$;

REVOKE ALL ON FUNCTION public.update_media_asset_review(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_media_asset_review(uuid,text,text) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;

-- Read-only postcheck
SELECT status, count(*) FROM public.media_assets GROUP BY status ORDER BY status;
SELECT count(*) FILTER (WHERE caption IS NOT NULL) AS captioned_assets FROM public.media_assets;