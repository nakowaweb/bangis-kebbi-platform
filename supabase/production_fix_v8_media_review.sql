-- BangisKebbi.com V8 — Media review metadata (revised r2)
-- REVIEW ONLY: do not execute on production without explicit approval.
-- Non-destructive: existing rows and files remain; existing assets are preserved as published.

BEGIN;

ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS caption text,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

UPDATE public.media_assets SET status = 'published' WHERE status IS NULL;

ALTER TABLE public.media_assets
  ALTER COLUMN status SET DEFAULT 'draft',
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.media_assets DROP CONSTRAINT IF EXISTS media_assets_status_check;
ALTER TABLE public.media_assets
  ADD CONSTRAINT media_assets_status_check CHECK (status IN ('draft', 'published'));

-- Does any published, non-deleted content entry show this storage path?
CREATE OR REPLACE FUNCTION public.media_path_in_published_content(_path text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.content_entries c
    WHERE c.status = 'published' AND c.deleted_at IS NULL
      AND (c.image_path = _path OR c.og_image_path = _path
           OR strpos(c.gallery::text, _path) > 0
           OR strpos(c.payload::text, _path) > 0)
  );
$$;
REVOKE ALL ON FUNCTION public.media_path_in_published_content(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.media_path_in_published_content(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.update_media_asset_review(_id uuid, _caption text, _status text)
RETURNS public.media_assets
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  updated public.media_assets;
  current_path text;
BEGIN
  IF _status NOT IN ('draft', 'published') THEN
    RAISE EXCEPTION 'Invalid media review status';
  END IF;
  IF NOT public.is_content_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Content administrator access is required';
  END IF;
  SELECT storage_path INTO current_path FROM public.media_assets WHERE id = _id;
  IF current_path IS NULL THEN RAISE EXCEPTION 'Media not found'; END IF;
  IF _status = 'draft' AND public.media_path_in_published_content(current_path) THEN
    RAISE EXCEPTION 'Image is used on published content; remove it from content before setting draft';
  END IF;

  UPDATE public.media_assets
  SET caption = NULLIF(btrim(_caption), ''), status = _status
  WHERE id = _id
  RETURNING * INTO updated;

  INSERT INTO public.admin_audit_logs (admin_id, action, content_type, content_id, content_label, metadata)
  VALUES (auth.uid(), 'updated media review', 'media', updated.id, updated.name,
          jsonb_build_object('status', updated.status));
  RETURN updated;
END;
$$;
REVOKE ALL ON FUNCTION public.update_media_asset_review(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_media_asset_review(uuid,text,text) TO authenticated, service_role;

-- Auto-publish draft media referenced by published content, in the same transaction
-- as the content save (a failed save rolls this back too). Audited per asset.
CREATE OR REPLACE FUNCTION public.publish_media_used_by_content()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  actor uuid := COALESCE(auth.uid(), NEW.updated_by);
  m record;
BEGIN
  IF NEW.status <> 'published' OR NEW.deleted_at IS NOT NULL THEN RETURN NEW; END IF;
  FOR m IN
    UPDATE public.media_assets a SET status = 'published'
    WHERE a.status = 'draft' AND a.deleted_at IS NULL
      AND (a.storage_path = NEW.image_path OR a.storage_path = NEW.og_image_path
           OR strpos(NEW.gallery::text, a.storage_path) > 0
           OR strpos(NEW.payload::text, a.storage_path) > 0)
    RETURNING a.id, a.name
  LOOP
    IF actor IS NOT NULL THEN
      INSERT INTO public.admin_audit_logs (admin_id, action, content_type, content_id, content_label, metadata)
      VALUES (actor, 'auto-published media used by published content', 'media', m.id, m.name,
              jsonb_build_object('content_entry_id', NEW.id, 'content_title', NEW.title));
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.publish_media_used_by_content() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS content_entries_publish_media ON public.content_entries;
CREATE TRIGGER content_entries_publish_media
  AFTER INSERT OR UPDATE ON public.content_entries
  FOR EACH ROW EXECUTE FUNCTION public.publish_media_used_by_content();

CREATE OR REPLACE FUNCTION public.reorder_media_assets(_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  IF NOT public.is_content_admin(auth.uid()) THEN RAISE EXCEPTION 'Content administrator access is required'; END IF;
  UPDATE public.media_assets m SET sort_order = o.ord FROM unnest(_ids) WITH ORDINALITY AS o(id, ord) WHERE m.id = o.id;
  INSERT INTO public.admin_audit_logs (admin_id, action, content_type, content_label, metadata)
  VALUES (auth.uid(), 'reordered media', 'media', 'Media Library', jsonb_build_object('count', coalesce(array_length(_ids,1),0)));
END $$;
REVOKE ALL ON FUNCTION public.reorder_media_assets(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reorder_media_assets(uuid[]) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;

-- Read-only postchecks
SELECT status, count(*) FROM public.media_assets GROUP BY status ORDER BY status;
SELECT count(*) FILTER (WHERE caption IS NOT NULL) AS captioned_assets FROM public.media_assets;
