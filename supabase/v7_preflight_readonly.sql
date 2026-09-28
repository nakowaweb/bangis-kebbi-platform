-- =====================================================================
-- BANGISKEBBI — v7 PREFLIGHT (READ-ONLY). Run BEFORE v7. Changes nothing.
-- Every statement is a SELECT. Save the output of each section.
-- =====================================================================

-- P1. Which earlier scripts are applied? (each column: true = present)
SELECT
  -- v3: base permissions/storage (partners + audit log tables, content-admin check)
  to_regclass('public.umrah_partners')   IS NOT NULL AS v3_umrah_partners,
  to_regclass('public.admin_audit_logs') IS NOT NULL AS v3_admin_audit_logs,
  to_regprocedure('public.is_content_admin(uuid)') IS NOT NULL AS v3_is_content_admin,
  -- v4: Super Admin protection + module permissions
  to_regclass('public.admin_permissions') IS NOT NULL AS v4_admin_permissions_table,
  EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
          WHERE n.nspname='public' AND p.proname='has_admin_permission') AS v4_has_admin_permission,
  EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
          WHERE n.nspname='public' AND p.proname='protect_super_admin_role') AS v4_protect_super_admin_role,
  -- v5: partner location/logo columns
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public'
          AND table_name='umrah_partners' AND column_name='logo_path') AS v5_partner_logo_path,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public'
          AND table_name='umrah_partners' AND column_name='state_region') AS v5_partner_state_region,
  -- v6: module permissions enforced in RLS
  to_regprocedure('public.admin_can(text)') IS NOT NULL AS v6_admin_can,
  EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
          WHERE n.nspname='public' AND p.proname='is_super_admin') AS v6_is_super_admin,
  EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND policyname LIKE 'rbac%') AS v6_rbac_policies,
  -- storage prerequisite
  EXISTS (SELECT 1 FROM storage.buckets WHERE id='member-documents') AS bucket_member_documents,
  (SELECT public FROM storage.buckets WHERE id='member-documents') AS member_documents_is_public; -- expect false

-- P2. Super Admin and roles (expect exactly 1 super_admin)
SELECT role, count(*) FROM public.user_roles GROUP BY role ORDER BY role;
SELECT ur.user_id, p.email, ur.created_at
  FROM public.user_roles ur LEFT JOIN public.profiles p ON p.id = ur.user_id
 WHERE ur.role = 'super_admin';

-- P3. Admin module grants (who currently has "umrah"; others lose Umrah finance access)
SELECT * FROM public.admin_permissions ORDER BY 1 LIMIT 200;   -- skip if v4 missing

-- P4. Baseline counts — record these, compare after
SELECT
  (SELECT count(*) FROM auth.users)                 AS users,
  (SELECT count(*) FROM public.profiles)            AS profiles,
  (SELECT count(*) FROM public.user_roles)          AS user_roles,
  (SELECT count(*) FROM public.umrah_applications)  AS applications,
  (SELECT count(*) FROM public.umrah_documents)     AS umrah_documents,
  (SELECT count(*) FROM public.member_documents)    AS member_documents,
  (SELECT count(*) FROM public.umrah_partners)      AS partners,
  (SELECT count(*) FROM public.admin_audit_logs)    AS audit_logs,
  (SELECT count(*) FROM storage.objects WHERE bucket_id='member-documents') AS private_files;

-- P5. Do any v7 objects already exist? (true = exists; v7 will keep it, not recreate)
SELECT t, to_regclass('public.'||t) IS NOT NULL AS exists
  FROM unnest(ARRAY['umrah_packages','umrah_goals','umrah_payment_methods',
                    'umrah_settings','umrah_transactions']) t;
SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname='umrah_tier') AS umrah_tier_type_exists;

-- P6. Column structure of any existing Umrah finance tables (compare with v7 sections 2-6)
SELECT table_name, column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
 WHERE table_schema='public'
   AND table_name IN ('umrah_packages','umrah_goals','umrah_payment_methods',
                      'umrah_settings','umrah_transactions','umrah_partners')
 ORDER BY table_name, ordinal_position;

-- P7. Conflicts that would make v7 fail and roll back (each expect 0 rows / 0)
-- (only run the lines for tables that P5 shows exist)
SELECT currency, count(*) FROM public.umrah_goals WHERE currency NOT IN ('NGN','USDT') GROUP BY 1;
SELECT status,   count(*) FROM public.umrah_goals WHERE status NOT IN ('not_started','active','completed') GROUP BY 1;
SELECT count(*) AS bad_targets FROM public.umrah_goals WHERE target_amount IS NOT NULL AND target_amount <= 0;
SELECT user_id, count(*) FROM public.umrah_goals GROUP BY 1 HAVING count(*) > 1;
SELECT currency, count(*) FROM public.umrah_transactions WHERE currency NOT IN ('NGN','USDT') GROUP BY 1;
SELECT method_code, count(*) FROM public.umrah_transactions WHERE method_code NOT IN ('usdt','ngn') GROUP BY 1;
SELECT method_code, reference, count(*) FROM public.umrah_transactions
 WHERE kind='payment' AND reference IS NOT NULL GROUP BY 1,2 HAVING count(*) > 1;
SELECT code FROM public.umrah_payment_methods WHERE code NOT IN ('usdt','ngn');

-- P8. Current payment switches (record; v7 forces deposits OFF, never ON)
SELECT deposits_enabled FROM public.umrah_settings WHERE id=1;
SELECT code, is_enabled FROM public.umrah_payment_methods ORDER BY sort_order;

-- P9. Existing function signatures v7 replaces (a different return type would make v7 roll back)
SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args,
       pg_get_function_result(p.oid) AS returns, p.prosecdef AS security_definer
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname IN
   ('umrah_admin','guard_umrah_goal','review_umrah_transaction','record_umrah_refund',
    'is_platform_admin','claim_first_super_admin','ensure_member_role','set_updated_at','admin_can');

-- P10. Existing policies on the tables v7 touches (v7 only drops/recreates its OWN named policies)
SELECT schemaname, tablename, policyname, permissive, cmd
  FROM pg_policies
 WHERE (schemaname='public' AND tablename LIKE 'umrah_%')
    OR (schemaname='storage' AND tablename='objects')
 ORDER BY 1,2,3;
