-- =====================================================================
-- BANGISKEBBI — v7: Consolidated Umrah finance + partner contacts + security
-- Run AFTER v3, v4, v5 and v6 (needs has_admin_permission / admin_can).
-- FOR REVIEW. Safe to re-run. Adds only; deletes no rows; never disables RLS.
-- Does NOT create/alter any Super Admin, user, credential or application.
-- Live deposits, USDT and NGN collection stay OFF after running.
-- =====================================================================
BEGIN;

-- 0. Pre-flight: stop if prerequisites are missing (nothing is changed).
DO $$ BEGIN
  IF to_regprocedure('public.admin_can(text)') IS NULL THEN
    RAISE EXCEPTION 'admin_can(text) missing — run production_fix_v6_admin_module_rls.sql first.';
  END IF;
  IF to_regclass('public.umrah_partners') IS NULL OR to_regclass('public.admin_audit_logs') IS NULL THEN
    RAISE EXCEPTION 'umrah_partners / admin_audit_logs missing — run v3 first.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'member-documents') THEN
    RAISE EXCEPTION 'Private bucket member-documents missing — create it (private, 10MB) first.';
  END IF;
END $$;

-- Single Umrah-admin check used everywhere below:
-- Super Admin always; other admins only with the "umrah" module grant.
CREATE OR REPLACE FUNCTION public.umrah_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.admin_can('umrah');
$$;
REVOKE EXECUTE ON FUNCTION public.umrah_admin() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.umrah_admin() TO authenticated;

-- 1. Travel Partners: optional contacts, hidden by default
ALTER TABLE public.umrah_partners
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS show_phone boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_whatsapp boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_email boolean NOT NULL DEFAULT false;
GRANT SELECT ON public.umrah_partners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.umrah_partners TO authenticated;
GRANT ALL ON public.umrah_partners TO service_role;
-- (Existing partner RLS policies are left exactly as they are.)

-- 2. Packages (planning categories, no price, unavailable)
DO $$ BEGIN CREATE TYPE public.umrah_tier AS ENUM ('economy','classic','vip');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.umrah_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier public.umrah_tier NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price numeric(14,2) CHECK (price IS NULL OR price > 0),
  currency text NOT NULL DEFAULT 'NGN',
  is_available boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.umrah_packages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.umrah_packages TO authenticated;
GRANT ALL ON public.umrah_packages TO service_role;
ALTER TABLE public.umrah_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "packages read" ON public.umrah_packages;
CREATE POLICY "packages read" ON public.umrah_packages FOR SELECT
  USING (is_available OR (auth.uid() IS NOT NULL AND public.umrah_admin()));
DROP POLICY IF EXISTS "packages admin" ON public.umrah_packages;
CREATE POLICY "packages admin" ON public.umrah_packages FOR ALL TO authenticated
  USING (public.umrah_admin()) WITH CHECK (public.umrah_admin());
DROP TRIGGER IF EXISTS umrah_packages_updated_at ON public.umrah_packages;
CREATE TRIGGER umrah_packages_updated_at BEFORE UPDATE ON public.umrah_packages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.umrah_packages (tier, name, sort_order)
VALUES ('economy','Economy',1), ('classic','Classic',2), ('vip','VIP',3)
ON CONFLICT (tier) DO NOTHING;

-- 3. Goals (one per member; balance only changes via approved transactions)
CREATE TABLE IF NOT EXISTS public.umrah_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  package_id uuid REFERENCES public.umrah_packages(id) ON DELETE SET NULL,
  target_amount numeric(14,2),
  currency text NOT NULL DEFAULT 'NGN',
  balance numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'not_started',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
DO $$ BEGIN
  ALTER TABLE public.umrah_goals ADD CONSTRAINT umrah_goals_currency_chk CHECK (currency IN ('NGN','USDT'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.umrah_goals ADD CONSTRAINT umrah_goals_status_chk CHECK (status IN ('not_started','active','completed'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.umrah_goals ADD CONSTRAINT umrah_goals_target_chk CHECK (target_amount IS NULL OR target_amount > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
GRANT SELECT, INSERT, UPDATE ON public.umrah_goals TO authenticated;
GRANT ALL ON public.umrah_goals TO service_role;
ALTER TABLE public.umrah_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "goals read" ON public.umrah_goals;
CREATE POLICY "goals read" ON public.umrah_goals FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.umrah_admin());
DROP POLICY IF EXISTS "goals insert own" ON public.umrah_goals;
CREATE POLICY "goals insert own" ON public.umrah_goals FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND balance = 0);
DROP POLICY IF EXISTS "goals update own" ON public.umrah_goals;
CREATE POLICY "goals update own" ON public.umrah_goals FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Members can never change balance/owner, nor currency once money is recorded.
CREATE OR REPLACE FUNCTION public.guard_umrah_goal()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_setting('umrah.allow_balance', true) = 'on' THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN NEW.balance := 0; RETURN NEW; END IF;
  NEW.balance := OLD.balance; NEW.user_id := OLD.user_id;
  IF OLD.balance <> 0 THEN NEW.currency := OLD.currency; END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.guard_umrah_goal() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS umrah_goals_guard ON public.umrah_goals;
CREATE TRIGGER umrah_goals_guard BEFORE INSERT OR UPDATE ON public.umrah_goals
  FOR EACH ROW EXECUTE FUNCTION public.guard_umrah_goal();
DROP TRIGGER IF EXISTS umrah_goals_updated_at ON public.umrah_goals;
CREATE TRIGGER umrah_goals_updated_at BEFORE UPDATE ON public.umrah_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Payment methods (USDT first, NGN second; both disabled)
CREATE TABLE IF NOT EXISTS public.umrah_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code IN ('usdt','ngn')),
  label text NOT NULL,
  instructions text,
  receiving_details text,
  is_enabled boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.umrah_payment_methods TO authenticated;
GRANT ALL ON public.umrah_payment_methods TO service_role;
ALTER TABLE public.umrah_payment_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "methods read" ON public.umrah_payment_methods;
CREATE POLICY "methods read" ON public.umrah_payment_methods FOR SELECT TO authenticated
  USING (is_enabled OR public.umrah_admin());
DROP POLICY IF EXISTS "methods admin" ON public.umrah_payment_methods;
CREATE POLICY "methods admin" ON public.umrah_payment_methods FOR ALL TO authenticated
  USING (public.umrah_admin()) WITH CHECK (public.umrah_admin());
DROP TRIGGER IF EXISTS umrah_payment_methods_updated_at ON public.umrah_payment_methods;
CREATE TRIGGER umrah_payment_methods_updated_at BEFORE UPDATE ON public.umrah_payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.umrah_payment_methods (code, label, sort_order, is_enabled)
VALUES ('usdt','USDT',1,false), ('ngn','Nigerian Naira (NGN)',2,false)
ON CONFLICT (code) DO NOTHING;

-- 5. Settings: master "Live deposits" switch
CREATE TABLE IF NOT EXISTS public.umrah_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  deposits_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.umrah_settings TO anon, authenticated;
GRANT UPDATE ON public.umrah_settings TO authenticated;
GRANT ALL ON public.umrah_settings TO service_role;
ALTER TABLE public.umrah_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings read" ON public.umrah_settings;
CREATE POLICY "settings read" ON public.umrah_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "settings admin" ON public.umrah_settings;
CREATE POLICY "settings admin" ON public.umrah_settings FOR UPDATE TO authenticated
  USING (public.umrah_admin()) WITH CHECK (public.umrah_admin());
INSERT INTO public.umrah_settings (id, deposits_enabled) VALUES (1, false) ON CONFLICT (id) DO NOTHING;
-- Guarantee collection is OFF after this migration (only touches the one settings row).
UPDATE public.umrah_settings SET deposits_enabled = false, updated_at = now() WHERE id = 1 AND deposits_enabled;

-- 6. Transactions (manual, pending until an Umrah admin reviews)
CREATE TABLE IF NOT EXISTS public.umrah_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  goal_id uuid REFERENCES public.umrah_goals(id) ON DELETE RESTRICT,
  method_code text NOT NULL,
  kind text NOT NULL DEFAULT 'payment' CHECK (kind IN ('payment','refund')),
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'NGN',
  reference text,
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.umrah_transactions ADD COLUMN IF NOT EXISTS receipt_path text;
DO $$ BEGIN
  ALTER TABLE public.umrah_transactions ADD CONSTRAINT umrah_tx_currency_chk CHECK (currency IN ('NGN','USDT'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.umrah_transactions ADD CONSTRAINT umrah_tx_receipt_path_chk
    CHECK (receipt_path IS NULL OR split_part(receipt_path,'/',1) = user_id::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS umrah_tx_ref_unique ON public.umrah_transactions (method_code, reference)
  WHERE reference IS NOT NULL AND kind = 'payment';
CREATE INDEX IF NOT EXISTS umrah_tx_user_idx ON public.umrah_transactions (user_id, created_at DESC);
-- Members may read/insert only; no UPDATE/DELETE grant for anyone but service_role.
REVOKE UPDATE, DELETE ON public.umrah_transactions FROM authenticated, anon;
GRANT SELECT, INSERT ON public.umrah_transactions TO authenticated;
GRANT ALL ON public.umrah_transactions TO service_role;
ALTER TABLE public.umrah_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tx read" ON public.umrah_transactions;
CREATE POLICY "tx read" ON public.umrah_transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.umrah_admin());
DROP POLICY IF EXISTS "tx member insert" ON public.umrah_transactions;
CREATE POLICY "tx member insert" ON public.umrah_transactions FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND kind = 'payment' AND status = 'pending'
  AND reviewed_by IS NULL AND reviewed_at IS NULL
  AND umrah_transactions.currency = upper(umrah_transactions.method_code)
  AND EXISTS (SELECT 1 FROM public.umrah_goals g WHERE g.user_id = auth.uid() AND g.currency = umrah_transactions.currency)
  AND EXISTS (SELECT 1 FROM public.umrah_settings s WHERE s.id = 1 AND s.deposits_enabled)
  AND EXISTS (SELECT 1 FROM public.umrah_payment_methods m WHERE m.code = umrah_transactions.method_code AND m.is_enabled));

-- 7. Review / refund (atomic, once only, audited). Authorization is enforced
--    inside each function with umrah_admin(); members get "Not authorized".
CREATE OR REPLACE FUNCTION public.review_umrah_transaction(_id uuid, _approve boolean, _note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.umrah_transactions; gcur text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.umrah_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO t FROM public.umrah_transactions WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transaction not found'; END IF;
  IF t.status <> 'pending' THEN RAISE EXCEPTION 'This transaction was already reviewed'; END IF;
  IF _approve THEN
    SELECT currency INTO gcur FROM public.umrah_goals WHERE user_id = t.user_id;
    IF gcur IS NOT NULL AND gcur <> t.currency THEN
      RAISE EXCEPTION 'Currency % does not match the member goal currency % (no conversion is applied)', t.currency, gcur;
    END IF;
  END IF;
  UPDATE public.umrah_transactions
     SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
         reviewed_by = auth.uid(), reviewed_at = now(), review_note = _note
   WHERE id = _id;
  IF _approve THEN
    PERFORM set_config('umrah.allow_balance','on',true);
    INSERT INTO public.umrah_goals (user_id, currency) VALUES (t.user_id, t.currency) ON CONFLICT (user_id) DO NOTHING;
    UPDATE public.umrah_goals
       SET balance = balance + CASE WHEN t.kind = 'refund' THEN -t.amount ELSE t.amount END,
           status = CASE WHEN status = 'not_started' THEN 'active' ELSE status END
     WHERE user_id = t.user_id;
    PERFORM set_config('umrah.allow_balance','off',true);
  END IF;
  INSERT INTO public.admin_audit_logs (admin_id, action, content_type, content_id, content_label, metadata)
  VALUES (auth.uid(), CASE WHEN _approve THEN 'approved' ELSE 'rejected' END || ' umrah ' || t.kind,
          'umrah_transactions', _id, t.reference,
          jsonb_build_object('amount', t.amount, 'currency', t.currency, 'user_id', t.user_id, 'method', t.method_code));
END $$;

CREATE OR REPLACE FUNCTION public.record_umrah_refund(_user_id uuid, _amount numeric, _method text, _note text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE nid uuid; bal numeric; gcur text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.umrah_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _method NOT IN ('usdt','ngn') THEN RAISE EXCEPTION 'Unknown method'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  SELECT balance, currency INTO bal, gcur FROM public.umrah_goals WHERE user_id = _user_id FOR UPDATE;
  IF bal IS NULL OR _amount > bal THEN RAISE EXCEPTION 'Refund exceeds recorded balance'; END IF;
  INSERT INTO public.umrah_transactions (user_id, method_code, kind, amount, currency, note, status, created_by)
  VALUES (_user_id, _method, 'refund', _amount, gcur, _note, 'pending', auth.uid()) RETURNING id INTO nid;
  PERFORM public.review_umrah_transaction(nid, true, _note);
  RETURN nid;
END $$;
REVOKE EXECUTE ON FUNCTION public.review_umrah_transaction(uuid, boolean, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.record_umrah_refund(uuid, numeric, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.review_umrah_transaction(uuid, boolean, text) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.record_umrah_refund(uuid, numeric, text, text) TO authenticated;

-- 8. Private receipt storage: receipts live in the existing PRIVATE
--    member-documents bucket under <user_id>/umrah-receipts/. Members touch
--    only their own folder; Umrah admins may read (signed links only).
--    Bucket stays private; no public access is added.
DROP POLICY IF EXISTS "umrah receipts: umrah admins read" ON storage.objects;
CREATE POLICY "umrah receipts: umrah admins read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'member-documents' AND (storage.foldername(name))[2] = 'umrah-receipts' AND public.umrah_admin());

-- 9. Security warnings (SECURITY DEFINER functions callable by signed-in users)
-- 9a. claim_first_super_admin: members must never be able to claim Super Admin.
DO $$ BEGIN
  IF to_regprocedure('public.claim_first_super_admin()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.claim_first_super_admin() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;
-- 9b. is_platform_admin: may only answer about the caller (no probing who is admin).
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id IS NOT NULL
     AND (_user_id = auth.uid() OR auth.uid() IS NULL AND current_user IN ('postgres','service_role','supabase_admin'))
     AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('super_admin','admin'));
$$;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO authenticated;
-- 9c. ensure_member_role: only ever adds the plain 'member' role to the caller.
DO $$ BEGIN
  IF to_regprocedure('public.ensure_member_role()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.ensure_member_role() FROM PUBLIC, anon;
    GRANT  EXECUTE ON FUNCTION public.ensure_member_role() TO authenticated;
  END IF;
END $$;
-- 9d/9e. review_umrah_transaction / record_umrah_refund: re-guarded in section 7.

COMMIT;
NOTIFY pgrst, 'reload schema';

-- ============================ CHECKS (read-only) =====================
-- a) still exactly one Super Admin (expect 1)
SELECT count(*) AS super_admins FROM public.user_roles WHERE role = 'super_admin';
-- b) deposits OFF, methods OFF (expect false / false,false)
SELECT deposits_enabled FROM public.umrah_settings WHERE id = 1;
SELECT code, is_enabled FROM public.umrah_payment_methods ORDER BY sort_order;
-- c) RLS on every Umrah table (expect all true)
SELECT relname, relrowsecurity FROM pg_class
 WHERE relname IN ('umrah_packages','umrah_goals','umrah_payment_methods','umrah_settings','umrah_transactions','umrah_partners');
-- d) partner contact columns (expect 4 rows)
SELECT column_name FROM information_schema.columns
 WHERE table_schema='public' AND table_name='umrah_partners' AND column_name IN ('whatsapp','show_phone','show_whatsapp','show_email');
-- e) claim function locked (expect false)
SELECT has_function_privilege('authenticated','public.claim_first_super_admin()','EXECUTE') AS claim_open;
-- f) anon cannot run admin functions (expect false,false)
SELECT has_function_privilege('anon','public.review_umrah_transaction(uuid,boolean,text)','EXECUTE'),
       has_function_privilege('anon','public.record_umrah_refund(uuid,numeric,text,text)','EXECUTE');
-- g) existing data untouched (compare with counts taken before running)
SELECT (SELECT count(*) FROM public.umrah_applications) AS applications,
       (SELECT count(*) FROM public.umrah_partners) AS partners,
       (SELECT count(*) FROM auth.users) AS users;
