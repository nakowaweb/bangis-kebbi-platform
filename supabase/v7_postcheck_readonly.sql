-- =====================================================================
-- BANGISKEBBI — v7 POST-MIGRATION CHECKS (READ-ONLY). Changes nothing.
-- =====================================================================

-- C1. Exactly one Super Admin, same user as preflight P2
SELECT ur.user_id, p.email FROM public.user_roles ur
  LEFT JOIN public.profiles p ON p.id=ur.user_id WHERE ur.role='super_admin';
SELECT role, count(*) FROM public.user_roles GROUP BY role ORDER BY role;   -- must equal P2

-- C2. Counts identical to preflight P4
SELECT
  (SELECT count(*) FROM auth.users)                 AS users,
  (SELECT count(*) FROM public.profiles)            AS profiles,
  (SELECT count(*) FROM public.user_roles)          AS user_roles,
  (SELECT count(*) FROM public.umrah_applications)  AS applications,
  (SELECT count(*) FROM public.umrah_documents)     AS umrah_documents,
  (SELECT count(*) FROM public.member_documents)    AS member_documents,
  (SELECT count(*) FROM public.umrah_partners)      AS partners,
  (SELECT count(*) FROM storage.objects WHERE bucket_id='member-documents') AS private_files;
-- audit_logs may only be equal or higher

-- C3. Collection OFF (expect false; false,false)
SELECT deposits_enabled FROM public.umrah_settings WHERE id=1;
SELECT code, is_enabled FROM public.umrah_payment_methods ORDER BY sort_order;

-- C4. Packages present, unpriced, unavailable (expect 3 rows, price null, false)
SELECT tier, name, price, is_available FROM public.umrah_packages ORDER BY sort_order;

-- C5. RLS on for every Umrah table (expect all true)
SELECT relname, relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND relname IN ('umrah_packages','umrah_goals','umrah_payment_methods',
   'umrah_settings','umrah_transactions','umrah_partners','umrah_applications','umrah_documents');

-- C6. Partner contact columns (expect 4 rows) and all hidden by default for existing partners
SELECT column_name, column_default FROM information_schema.columns
 WHERE table_schema='public' AND table_name='umrah_partners'
   AND column_name IN ('whatsapp','show_phone','show_whatsapp','show_email');
SELECT count(*) FILTER (WHERE show_phone OR show_whatsapp OR show_email) AS partners_showing_contacts
  FROM public.umrah_partners;   -- expect 0 right after migration

-- C7. Function privileges (expected values in comments)
SELECT
  has_function_privilege('authenticated','public.claim_first_super_admin()','EXECUTE')               AS claim_auth,     -- false
  has_function_privilege('anon','public.claim_first_super_admin()','EXECUTE')                        AS claim_anon,     -- false
  has_function_privilege('anon','public.review_umrah_transaction(uuid,boolean,text)','EXECUTE')     AS review_anon,    -- false
  has_function_privilege('anon','public.record_umrah_refund(uuid,numeric,text,text)','EXECUTE')     AS refund_anon,    -- false
  has_function_privilege('anon','public.is_platform_admin(uuid)','EXECUTE')                         AS isadmin_anon,   -- false
  has_function_privilege('anon','public.umrah_admin()','EXECUTE')                                   AS umrahadmin_anon;-- false

-- C8. Receipt storage stays private; policies present
SELECT id, public FROM storage.buckets WHERE id='member-documents';   -- public = false
SELECT policyname, cmd FROM pg_policies
 WHERE schemaname='storage' AND tablename='objects' AND policyname ILIKE '%receipt%';

-- C9. Unique rules still in place
SELECT indexname, indexdef FROM pg_indexes
 WHERE schemaname='public' AND tablename IN ('umrah_applications','umrah_goals','umrah_transactions');

-- C10. v7 audit entries (expect none yet — nothing has been approved)
SELECT action, count(*) FROM public.admin_audit_logs WHERE action ILIKE '%umrah%' GROUP BY 1;
