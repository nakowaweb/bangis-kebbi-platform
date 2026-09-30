# V8 Media Gallery release — reviewed checklist

## Review result (V8 checked against the schema, permissions and security rules)
- Super Admin can save captions, publish status and order: yes. Both functions run with the caller's own permissions and pass both checks: `is_content_admin` (the existing rule for editing media) and V6 `rbac: media update` (`admin_can('content')`, which Super Admin always passes).
- Public listings: no public or anon policy on `media_assets`. Visitors never read that table; public pages load images through CMS content paths. Drafts cannot leak, and V8 adds no public access.
- Existing uploads: set to `published` BEFORE the default changes to `draft`. Only new uploads start as drafts. That affects admin labels only, not how public pages show images.
- Audit logs: inserts pass `Content admins can add audit logs` and V6 `rbac: audit insert` (`admin_id = auth.uid()`).
- Required: the caption/publish and reorder buttons fail until V8 is applied. File: `production_fix_v8_media_review.sql` (unchanged).

## Step 1 — read-only preflight (run in the production SQL editor)
```sql
SELECT to_regclass('public.umrah_transactions') IS NOT NULL AS v7_transactions,
       to_regclass('public.umrah_settings')     IS NOT NULL AS v7_settings,
       to_regprocedure('public.review_umrah_transaction(uuid,boolean,text)') IS NOT NULL AS v7_review_fn,
       to_regprocedure('public.admin_can(text)') IS NOT NULL AS v6_admin_can,
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public'
               AND table_name='media_assets' AND column_name='status') AS v8_already_applied;
SELECT deposits_enabled FROM public.umrah_settings;          -- expect false
SELECT code, is_enabled FROM public.umrah_payment_methods;   -- expect all false
```
- If all V7 values are true, V7 is already applied. Do NOT rerun it.
- If `v6_admin_can` is false, stop. V6 must be applied before V8.
- If `v8_already_applied` is true, skip Step 2.

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
