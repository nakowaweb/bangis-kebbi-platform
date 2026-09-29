-- =====================================================================
-- BANGISKEBBI — v6/v7 PREFLIGHT (READ-ONLY, r2). Run BEFORE v6 and v7.
-- Every statement is a SELECT. Safe when optional tables do not exist:
-- counts on optional tables go through pg_temp-free query_to_xml and
-- return NULL instead of failing.
-- =====================================================================

-- Safe counter: NULL when the table is missing, otherwise the row count.
--   Usage pattern below: (xpath('/row/c/text()', query_to_xml(...)))[1]
-- P1. Which earlier scripts are applied? (true = present)
SELECT
  to_regclass('public.umrah_partners')   IS NOT NULL AS v3_umrah_partners,
  to_regclass('public.admin_audit_logs') IS NOT NULL AS v3_admin_audit_logs,
  to_regprocedure('public.is_content_admin(uuid)') IS NOT NULL AS v3_is_content_admin,
  to_regprocedure('public.set_updated_at()') IS NOT NULL AS v3_set_updated_at,
  to_regclass('public.admin_permissions') IS NOT NULL AS v4_admin_permissions,
  to_regprocedure('public.has_admin_permission(uuid,text)') IS NOT NULL AS v4_has_admin_permission,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public'
          AND table_name='umrah_partners' AND column_name='logo_path') AS v5_partner_logo_path,
  to_regprocedure('public.admin_can(text)') IS NOT NULL AS v6_admin_can,
  to_regprocedure('public.is_super_admin()') IS NOT NULL AS v6_is_super_admin,
  (SELECT count(*) FROM pg_policies WHERE policyname LIKE 'rbac: %') AS v6_rbac_policies,
  EXISTS (SELECT 1 FROM storage.buckets WHERE id='member-documents') AS bucket_member_documents,
  (SELECT public FROM storage.buckets WHERE id='member-documents') AS member_documents_is_public; -- expect false

-- P2. Super Admin and roles (expect exactly 1 super_admin). Note any
--     'content_manager' rows: after v6 they no longer pass module checks.
SELECT role, count(*) FROM public.user_roles GROUP BY role ORDER BY role;
SELECT ur.user_id, p.email, ur.created_at
  FROM public.user_roles ur LEFT JOIN public.profiles p ON p.id = ur.user_id
 WHERE ur.role = 'super_admin';

-- P3. Admin module grants (NULL-safe if v4 missing)
SELECT CASE WHEN to_regclass('public.admin_permissions') IS NULL THEN NULL
       ELSE query_to_xml('SELECT user_id, module FROM public.admin_permissions ORDER BY 1,2', false, true, '')
       END AS admin_permissions_xml;
-- Admins WITHOUT any module grant (they lose admin sections after v6)
SELECT ur.user_id, p.email FROM public.user_roles ur LEFT JOIN public.profiles p ON p.id=ur.user_id
 WHERE ur.role = 'admin'
   AND (to_regclass('public.admin_permissions') IS NULL
        OR (xpath('/row/c/text()', query_to_xml(format(
             'SELECT count(*) AS c FROM public.admin_permissions WHERE user_id = %L', ur.user_id),
             false, true, '')))[1]::text::int = 0);

-- P4. Baseline counts (record; compare with postcheck C2)
SELECT t AS table_name,
       CASE WHEN to_regclass(t) IS NULL THEN NULL
            ELSE (xpath('/row/c/text()', query_to_xml('SELECT count(*) AS c FROM '||t, false, true, '')))[1]::text::bigint
       END AS row_count
  FROM unnest(ARRAY['auth.users','public.profiles','public.user_roles','public.umrah_applications',
                    'public.umrah_documents','public.member_documents','public.umrah_partners',
                    'public.admin_audit_logs','public.umrah_packages','public.umrah_goals',
                    'public.umrah_payment_methods','public.umrah_settings','public.umrah_transactions']) t;
SELECT bucket_id, count(*) FROM storage.objects GROUP BY 1 ORDER BY 1;

-- P5. v7 objects already present?
SELECT t, to_regclass('public.'||t) IS NOT NULL AS exists
  FROM unnest(ARRAY['umrah_packages','umrah_goals','umrah_payment_methods',
                    'umrah_settings','umrah_transactions']) t;
SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname='umrah_tier') AS umrah_tier_exists;

-- P6. Columns, constraints, grants and policies of existing Umrah tables
SELECT table_name, column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
 WHERE table_schema='public' AND table_name LIKE 'umrah_%'
 ORDER BY table_name, ordinal_position;
SELECT conrelid::regclass AS table_name, conname, pg_get_constraintdef(oid) AS definition
  FROM pg_constraint
 WHERE connamespace='public'::regnamespace AND conrelid::regclass::text LIKE 'umrah_%'
 ORDER BY 1,2;
SELECT table_name, grantee, string_agg(privilege_type, ',' ORDER BY privilege_type) AS privileges
  FROM information_schema.role_table_grants
 WHERE table_schema='public' AND table_name LIKE 'umrah_%' AND grantee IN ('anon','authenticated')
 GROUP BY 1,2 ORDER BY 1,2;
SELECT schemaname, tablename, policyname, permissive, cmd, roles, qual, with_check
  FROM pg_policies
 WHERE (schemaname='public' AND tablename LIKE 'umrah_%')
    OR (schemaname='storage' AND tablename='objects')
 ORDER BY 1,2,3;

-- P7. Conflicts that would make v7 abort (NULL = table absent = fine; else expect 0)
SELECT
  CASE WHEN to_regclass('public.umrah_goals') IS NULL THEN NULL ELSE
    (xpath('/row/c/text()', query_to_xml($q$SELECT count(*) AS c FROM public.umrah_goals
      WHERE currency NOT IN ('NGN','USDT') OR status NOT IN ('not_started','active','completed')
         OR (target_amount IS NOT NULL AND target_amount <= 0) OR balance <> 0$q$, false, true, '')))[1]::text::int END AS bad_goals,
  CASE WHEN to_regclass('public.umrah_transactions') IS NULL THEN NULL ELSE
    (xpath('/row/c/text()', query_to_xml($q$SELECT count(*) AS c FROM public.umrah_transactions
      WHERE currency NOT IN ('NGN','USDT') OR method_code NOT IN ('usdt','ngn')
         OR upper(method_code) <> currency OR status = 'approved'$q$, false, true, '')))[1]::text::int END AS bad_transactions,
  CASE WHEN to_regclass('public.umrah_payment_methods') IS NULL THEN NULL ELSE
    (xpath('/row/c/text()', query_to_xml($q$SELECT count(*) AS c FROM public.umrah_payment_methods
      WHERE code NOT IN ('usdt','ngn')$q$, false, true, '')))[1]::text::int END AS bad_methods;

-- P8. Current switches (NULL = table absent). v7 forces all OFF.
SELECT
  CASE WHEN to_regclass('public.umrah_settings') IS NULL THEN NULL ELSE
    query_to_xml('SELECT deposits_enabled FROM public.umrah_settings', false, true, '') END AS settings,
  CASE WHEN to_regclass('public.umrah_payment_methods') IS NULL THEN NULL ELSE
    query_to_xml('SELECT code, is_enabled FROM public.umrah_payment_methods', false, true, '') END AS methods;

-- P9. Existing functions v6/v7 replace (return type must match or v6/v7 roll back)
SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args,
       pg_get_function_result(p.oid) AS returns, p.prosecdef AS security_definer
  FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.proname IN
   ('admin_can','admin_can_entry','is_super_admin','guard_profile_active_flag','umrah_admin',
    'guard_umrah_goal','stamp_umrah_transaction','review_umrah_transaction','record_umrah_refund',
    'is_platform_admin','claim_first_super_admin','ensure_member_role','set_updated_at','has_role');

-- P10. Partner contact visibility today (expect 0 showing if columns exist)
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public'
                          AND table_name='umrah_partners' AND column_name='show_email')
       THEN query_to_xml('SELECT count(*) FILTER (WHERE show_phone OR show_whatsapp OR show_email) AS c FROM public.umrah_partners', false, true, '')
       END AS partners_showing_contacts;

-- P11. Permanent Member ID readiness (existing IDs must be unique if present)
SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='member_id') AS member_id_column_exists,
       to_regclass('public.member_id_seq') IS NOT NULL AS member_id_sequence_exists,
       to_regprocedure('public.guard_profile_member_id()') IS NOT NULL AS member_id_guard_exists;
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='member_id')
       THEN query_to_xml('SELECT count(*) FILTER (WHERE member_id IS NULL) AS missing, count(*) - count(DISTINCT member_id) AS duplicates FROM public.profiles', false, true, '')
       END AS existing_member_id_quality;

-- P12. Structured payment destinations (values are intentionally not selected)
SELECT column_name FROM information_schema.columns
 WHERE table_schema='public' AND table_name='umrah_payment_methods'
   AND column_name IN ('bank_name','account_name','account_number','wallet_address') ORDER BY 1;
