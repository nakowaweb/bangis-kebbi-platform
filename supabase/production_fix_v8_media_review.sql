-- BangisKebbi.com V8 — Media review metadata (revised r3)
-- REVIEW ONLY: do not execute on production without explicit approval.
-- Non-destructive: existing rows and files remain; existing assets are preserved as published.
--
-- r3 changes:
--  * Draft protection is enforced by a BEFORE trigger on media_assets, so a direct
--    UPDATE cannot bypass update_media_asset_review().
--  * References are matched exactly on normalised paths extracted from every string
--    in gallery/payload (any nesting depth), including full storage URLs
--    (public / sign / authenticated, with ?token=... query strings). No substring matching.
--  * Content publication and media draft changes serialise on one transaction-scoped
--    advisory lock, so concurrent saves cannot leave published content on a draft asset.

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

-- Normalise a stored reference to a site-media object path.
-- 'folder/a.webp', '/folder/a.webp', 'site-media/folder/a.webp' and full
-- storage URLs on OUR storage origin
-- ('https://zeaircwpegicobsikabx.supabase.co/storage/v1/object/{public|sign|authenticated/}site-media/folder/a.webp?token=..')
-- all become 'folder/a.webp'. URLs on any other host, other buckets, or other
-- sites return NULL (a foreign host serving the same path is NOT our asset).
CREATE OR REPLACE FUNCTION public.media_ref_key(_value text)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE
  v text;
  storage_origin constant text := 'https://zeaircwpegicobsikabx.supabase.co';
BEGIN
  IF _value IS NULL THEN RETURN NULL; END IF;
  v := split_part(split_part(btrim(_value), '#', 1), '?', 1);
  IF v ~* '^[a-z][a-z0-9+.-]*://' OR v LIKE '%/storage/v1/object/%' THEN
    -- Full URLs must belong to our own storage origin.
    IF lower(v) NOT LIKE lower(storage_origin) || '/%' THEN RETURN NULL; END IF;
    IF v !~ '/storage/v1/object/(public/|sign/|authenticated/)?site-media/' THEN RETURN NULL; END IF;
    v := regexp_replace(v, '^.*?/storage/v1/object/(public/|sign/|authenticated/)?site-media/', '');
  END IF;
  v := ltrim(v, '/');
  IF v LIKE 'site-media/%' THEN v := substr(v, 12); END IF;
  RETURN NULLIF(v, '');
END $$;
REVOKE ALL ON FUNCTION public.media_ref_key(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.media_ref_key(text) TO authenticated, service_role;

-- Every normalised media path referenced by one content row.
CREATE OR REPLACE FUNCTION public.content_media_refs(_image text, _og text, _gallery jsonb, _payload jsonb)
RETURNS SETOF text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT DISTINCT k FROM (
    SELECT public.media_ref_key(_image) AS k
    UNION ALL SELECT public.media_ref_key(_og)
    UNION ALL SELECT public.media_ref_key(j #>> '{}')
      FROM jsonb_path_query(COALESCE(_gallery, '[]'::jsonb), 'strict $.**') j
      WHERE jsonb_typeof(j) = 'string'
    UNION ALL SELECT public.media_ref_key(j #>> '{}')
      FROM jsonb_path_query(COALESCE(_payload, '{}'::jsonb), 'strict $.**') j
      WHERE jsonb_typeof(j) = 'string'
  ) s WHERE k IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.content_media_refs(text,text,jsonb,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.content_media_refs(text,text,jsonb,jsonb) TO authenticated, service_role;

-- Does any published, non-deleted content entry reference this storage path?
CREATE OR REPLACE FUNCTION public.media_path_in_published_content(_path text)
-- VOLATILE on purpose: takes a fresh snapshot after the advisory lock is acquired.
RETURNS boolean LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.content_entries c
    CROSS JOIN LATERAL public.content_media_refs(c.image_path, c.og_image_path, c.gallery, c.payload) r
    WHERE c.status = 'published' AND c.deleted_at IS NULL
      AND r = public.media_ref_key(_path)
  );
$$;
REVOKE ALL ON FUNCTION public.media_path_in_published_content(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.media_path_in_published_content(text) TO authenticated, service_role;

-- Shared lock key for content publication vs. media draft changes.
-- Both triggers take it before checking, so whichever commits second sees the first.

-- Guard: media may not be (or become) draft while published content references it.
CREATE OR REPLACE FUNCTION public.guard_media_draft_in_use()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status <> 'draft' OR NEW.deleted_at IS NOT NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'draft' AND OLD.storage_path = NEW.storage_path
     AND OLD.deleted_at IS NULL THEN
    RETURN NEW;  -- unchanged draft (caption/order edit)
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('public.media_publication'));
  IF public.media_path_in_published_content(NEW.storage_path) THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status := 'published';  -- new upload already used by published content
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Image is used on published content; remove it from content before setting draft'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_media_draft_in_use() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS media_assets_guard_draft ON public.media_assets;
CREATE TRIGGER media_assets_guard_draft
  BEFORE INSERT OR UPDATE ON public.media_assets
  FOR EACH ROW EXECUTE FUNCTION public.guard_media_draft_in_use();

CREATE OR REPLACE FUNCTION public.update_media_asset_review(_id uuid, _caption text, _status text)
RETURNS public.media_assets
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  updated public.media_assets;
BEGIN
  IF _status NOT IN ('draft', 'published') THEN
    RAISE EXCEPTION 'Invalid media review status';
  END IF;
  IF NOT public.is_content_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Content administrator access is required';
  END IF;

  -- The media_assets_guard_draft trigger enforces the in-use rule.
  UPDATE public.media_assets
  SET caption = NULLIF(btrim(_caption), ''), status = _status
  WHERE id = _id
  RETURNING * INTO updated;
  IF updated.id IS NULL THEN RAISE EXCEPTION 'Media not found'; END IF;

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
  PERFORM pg_advisory_xact_lock(hashtext('public.media_publication'));
  FOR m IN
    UPDATE public.media_assets a SET status = 'published'
    WHERE a.status = 'draft' AND a.deleted_at IS NULL
      AND public.media_ref_key(a.storage_path) IN (
        SELECT public.content_media_refs(NEW.image_path, NEW.og_image_path, NEW.gallery, NEW.payload))
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
-- Expect 0: published content using a draft asset
SELECT count(*) AS published_content_on_draft_media FROM public.media_assets a
 WHERE a.status = 'draft' AND a.deleted_at IS NULL AND public.media_path_in_published_content(a.storage_path);
