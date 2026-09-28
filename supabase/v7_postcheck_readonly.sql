-- =====================================================================
-- BANGISKEBBI — v6/v7 POST-MIGRATION CHECKS (READ-ONLY, r2). Changes nothing.
-- NULL-safe: sections for absent tables return NULL instead of erroring.
-- =====================================================================

-- C0. v6 installed
SELECT to_regprocedure('public.admin_can(text)') IS NOT NULL AS admin_can,
       to_regprocedure('public.is_super_admin()') IS NOT NULL AS is_super_admin,
       (SELECT count(*) FROM pg_policies WHERE policyname LIKE 'rbac: %' AND permissive='RESTRICTIVE') AS rbac_policies,
       (SELECT count(*) FROM pg_policies WHERE policyname LIKE 'rbac: %' AND permissive<>'RESTRICTIVE') AS non_restrictive_rbac; -- expect 0
SELECT policyname, cmd FROM pg_policies
 WHERE schemaname='storage' AND tablename='objects' AND policyname LIKE 'rbac: member-documents%' ORDER BY 1; -- expect 4

-- C1. Exactly one Super Admin, same user as preflight P2; role counts equal P2
SELECT ur.user_id, p.email FROM public.user_roles ur
  LEFT JOIN public.profiles p ON p.id=ur.user_id WHERE ur.role='super_admin';
SELECT role, count(*) FROM public.user_roles GROUP BY role ORDER BY role;

-- C2. Counts identical to P4 (audit_logs may only be equal or higher)
SELECT t AS table_name,
       CASE WHEN to_regclass(t) IS NULL THEN NULL
            ELSE (xpath('/row/c/text()', query_to_xml('SELECT count(*) AS c FROM '||t, false, true, '')))[1]::text::bigint
       END AS row_count
  FROM unnest(ARRAY['auth.users','public.profiles','public.user_roles','public.umrah_applications',
                    'public.umrah_documents','public.member_documents','public.umrah_partners',
                    'public.admin_audit_logs','public.umrah_goals','public.umrah_transactions']) t;
SELECT bucket_id, count(*) FROM storage.objects GROUP BY 1 ORDER BY 1;

-- C3. Collection OFF (expect deposits_on=0, methods_on=0)
SELECT
  CASE WHEN to_regclass('public.umrah_settings') IS NULL THEN NULL ELSE
    (xpath('/row/c/text()', query_to_xml('SELECT count(*) AS c FROM public.umrah_settings WHERE deposits_enabled', false, true, '')))[1]::text::int END AS deposits_on,
  CASE WHEN to_regclass('public.umrah_payment_methods') IS NULL THEN NULL ELSE
    (xpath('/row/c/text()', query_to_xml('SELECT count(*) AS c FROM public.umrah_payment_methods WHERE is_enabled', false, true, '')))[1]::text::int END AS methods_on;

-- C4. Packages: 3 rows, no price, unavailable
SELECT CASE WHEN to_regclass('public.umrah_packages') IS NULL THEN NULL ELSE
  query_to_xml('SELECT tier, price, is_available FROM public.umrah_packages ORDER BY sort_order', false, true, '') END AS packages;

-- C5. RLS on every Umrah table (expect all true)
SELECT c.relname, c.relrowsecurity FROM pg_class c
 WHERE c.relnamespace='public'::regnamespace AND c.relkind='r' AND c.relname LIKE 'umrah_%' ORDER BY 1;

-- C6. Partner contacts: 4 columns, defaults false, none showing yet
SELECT column_name, column_default FROM information_schema.columns
 WHERE table_schema='public' AND table_name='umrah_partners'
   AND column_name IN ('whatsapp','show_phone','show_whatsapp','show_email');
SELECT count(*) FILTER (WHERE show_phone OR show_whatsapp OR show_email) AS partners_showing_contacts
  FROM public.umrah_partners;   -- expect 0

-- C7. Grants: no UPDATE/DELETE on transactions, no DELETE on goals, anon read-only
SELECT table_name, grantee, string_agg(privilege_type, ',' ORDER BY privilege_type) AS privileges
  FROM information_schema.role_table_grants
 WHERE table_schema='public' AND table_name LIKE 'umrah_%' AND grantee IN ('anon','authenticated')
 GROUP BY 1,2 ORDER BY 1,2;

-- C8. Function privileges (all expect false)
SELECT
  has_function_privilege('authenticated','public.claim_first_super_admin()','EXECUTE') AS claim_auth,
  has_function_privilege('anon','public.review_umrah_transaction(uuid,boolean,text)','EXECUTE') AS review_anon,
  has_function_privilege('anon','public.record_umrah_refund(uuid,numeric,text,text)','EXECUTE') AS refund_anon,
  has_function_privilege('anon','public.is_platform_admin(uuid)','EXECUTE') AS isadmin_anon,
  has_function_privilege('anon','public.umrah_admin()','EXECUTE') AS umrahadmin_anon,
  has_function_privilege('anon','public.admin_can(text)','EXECUTE') AS admincan_anon;

-- C9. Constraints and triggers present
SELECT conname FROM pg_constraint WHERE conname IN
  ('umrah_tx_method_currency_chk','umrah_tx_receipt_path_chk','umrah_tx_review_consistency_chk',
   'umrah_goals_balance_nonneg_chk','umrah_goals_currency_chk','umrah_goals_status_chk') ORDER BY 1; -- expect 6
SELECT tgname FROM pg_trigger WHERE tgname IN
  ('umrah_goals_guard','umrah_transactions_stamp','guard_profile_active_flag') ORDER BY 1;          -- expect 3

-- C10. Storage private; receipt policies present
SELECT id, public FROM storage.buckets WHERE id IN ('site-media','foundation-media','member-documents');
SELECT policyname, permissive, cmd FROM pg_policies
 WHERE schemaname='storage' AND tablename='objects' AND policyname ILIKE '%receipt%' ORDER BY 1; -- expect 3

-- C11. One-application-per-member rule still present
SELECT indexname, indexdef FROM pg_indexes
 WHERE schemaname='public' AND tablename IN ('umrah_applications','umrah_goals','umrah_transactions');

-- C12. No finance audit entries yet (nothing approved)
SELECT action, count(*) FROM public.admin_audit_logs WHERE action ILIKE '%umrah%' GROUP BY 1;

-- =====================================================================
-- C13. OPTIONAL ROLLED-BACK SIMULATION as a MEMBER (changes nothing:
--      ends in ROLLBACK). Replace MEMBER_EMAIL. Run only with approval.
-- =====================================================================
-- BEGIN;
-- SELECT set_config('request.jwt.claims', json_build_object('sub',
--   (SELECT id FROM auth.users WHERE email='MEMBER_EMAIL'),'role','authenticated')::text, true);
-- SET LOCAL ROLE authenticated;
-- SELECT public.umrah_admin();                                   -- expect false
-- UPDATE public.umrah_goals SET balance = 999, status = 'completed' RETURNING balance, status; -- balance unchanged, status not completed
-- SELECT public.review_umrah_transaction(gen_random_uuid(), true); -- expect 'Not authorized'
-- ROLLBACK;
