# V8 Media Gallery release — reviewed checklist

## Review result (V8 checked against the schema, permissions and security rules)
- Super Admin can save captions, publish status and order: yes. Both functions run with the caller's own permissions and pass both checks: `is_content_admin` (the existing rule for editing media) and V6 `rbac: media update` (`admin_can('content')`, which Super Admin always passes).
- Public listings: no public or anon policy on `media_assets`. Visitors never read that table; public pages load images through CMS content paths. Drafts cannot leak, and V8 adds no public access.
- Existing uploads: set to `published` BEFORE the default changes to `draft`. Only new uploads start as drafts. That affects admin labels only, not how public pages show images.
- Audit logs: inserts pass `Content admins can add audit logs` and V6 `rbac: audit insert` (`admin_id = auth.uid()`).
- Required: the caption/publish and reorder buttons fail until V8 is applied. File: `production_fix_v8_media_review.sql` (revised r3: draft guard trigger, exact URL-aware reference matching, advisory-lock serialisation; tested in an isolated Postgres 17 database).

## Step 1 — read-only preflight
Live result 2026-09-30: V7 applied (do NOT rerun), V6 present, V8 not applied, NGN/USDT off.

Full V8 check (all true = V8 fully applied; any mix = partial, stop and report):
```sql
SELECT
  (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='media_assets'
     AND column_name IN ('caption','status','sort_order')) = 3                         AS v8_columns,
  EXISTS (SELECT 1 FROM pg_constraint WHERE conname='media_assets_status_check')       AS v8_status_check,
  to_regprocedure('public.update_media_asset_review(uuid,text,text)') IS NOT NULL      AS v8_review_fn,
  to_regprocedure('public.reorder_media_assets(uuid[])') IS NOT NULL                   AS v8_reorder_fn,
  to_regprocedure('public.media_path_in_published_content(text)') IS NOT NULL          AS v8_in_use_fn,
  to_regprocedure('public.publish_media_used_by_content()') IS NOT NULL                AS v8_autopublish_fn,
  EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='content_entries_publish_media')       AS v8_trigger,
  EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='media_assets_guard_draft')            AS v8_guard_trigger,
  to_regprocedure('public.media_ref_key(text)') IS NOT NULL                            AS v8_ref_key_fn;
SELECT deposits_enabled FROM public.umrah_settings;          -- expect false
```

## Step 2 — apply V8 (after approval)
Run `supabase/production_fix_v8_media_review.sql` once. The same file ends with read-only postchecks.

## Step 3 — deploy to Hostinger
1. Keep the existing production `.env` values (Supabase URL and publishable key). Do not use the editor's test backend values.
2. `bun install && bun run build`
3. Back up the current Hostinger site folder (e.g. `public_html_backup_YYYYMMDD`).
4. Upload the new build output and replace the old files.
5. Hard-refresh the live site. Check the homepage, /credentials, /umrah and /login, then sign in as Super Admin.

## Rollback
- Site: restore the backup folder from Step 3.3.
- Database (only if V8 must be undone; this is safe and does not delete media or files):
```sql
BEGIN;
DROP TRIGGER IF EXISTS content_entries_publish_media ON public.content_entries;
DROP TRIGGER IF EXISTS media_assets_guard_draft ON public.media_assets;
DROP FUNCTION IF EXISTS public.publish_media_used_by_content();
DROP FUNCTION IF EXISTS public.guard_media_draft_in_use();
DROP FUNCTION IF EXISTS public.media_path_in_published_content(text);
DROP FUNCTION IF EXISTS public.content_media_refs(text,text,jsonb,jsonb);
DROP FUNCTION IF EXISTS public.media_ref_key(text);
DROP FUNCTION IF EXISTS public.reorder_media_assets(uuid[]);
DROP FUNCTION IF EXISTS public.update_media_asset_review(uuid,text,text);
ALTER TABLE public.media_assets DROP CONSTRAINT IF EXISTS media_assets_status_check;
ALTER TABLE public.media_assets ALTER COLUMN status DROP NOT NULL, ALTER COLUMN status DROP DEFAULT;
NOTIFY pgrst, 'reload schema';
COMMIT;
-- caption/status/sort_order columns are left in place (harmless; the old site ignores them).
```

## Owner checks after deployment (untested by the agent)
- Settings: section on/off and order, motion setting, EN/AR/HA text boxes still saved after refresh
- Service illustration Replace / "Use built-in"
- Contact social buttons follow the Social links order
- Media Gallery: caption, publish/draft, reorder arrows, audit log entries
- Certificate preview; Download shown only when "Allow visitors to download" is on
- Umrah payments remain OFF
