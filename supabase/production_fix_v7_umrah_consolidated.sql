-- =====================================================================
-- BANGISKEBBI — v7 (REVISED r2): Umrah planning records + partner contacts
--                               + security corrections.
-- FOR INDEPENDENT REVIEW. Do not run without explicit approval.
-- Run AFTER v3, v4, v5 and v6 (r2). One transaction: any error = nothing applied.
-- Adds only. Deletes no rows. Never disables RLS. Never touches users,
-- credentials, roles, applications, documents or storage files.
--
-- Planning/support record keeping only — not investment, no interest, no
-- guaranteed travel. Live deposits, USDT and NGN collection are OFF after
-- running, even if those records already existed and were switched on.
-- =====================================================================
BEGIN;

-- ---------------------------------------------------------------------
-- 0. Preconditions and inspection of anything that already exists
-- ---------------------------------------------------------------------
DO $$
DECLARE missing text;
BEGIN
  IF to_regprocedure('public.admin_can(text)') IS NULL THEN
    RAISE EXCEPTION 'admin_can(text) missing — run production_fix_v6_admin_module_rls.sql first.';
  END IF;
  IF to_regclass('public.umrah_partners') IS NULL OR to_regclass('public.admin_audit_logs') IS NULL THEN
    RAISE EXCEPTION 'umrah_partners / admin_audit_logs missing — run v3 first.';
  END IF;
  IF to_regprocedure('public.set_updated_at()') IS NULL THEN
    RAISE EXCEPTION 'set_updated_at() missing — run v3 first.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'member-documents' AND public = false) THEN
    RAISE EXCEPTION 'Private bucket member-documents missing or public — stop.';
  END IF;
  IF (SELECT count(*) FROM public.user_roles WHERE role = 'super_admin') <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one Super Admin. Stop and investigate.';
  END IF;

  -- If a finance table already exists, it must have the columns this script
  -- relies on. Otherwise abort instead of guessing.
  SELECT string_agg(t||'.'||c, ', ') INTO missing FROM (VALUES
    ('umrah_packages','tier'),('umrah_packages','price'),('umrah_packages','is_available'),
    ('umrah_goals','user_id'),('umrah_goals','currency'),('umrah_goals','balance'),('umrah_goals','status'),
    ('umrah_payment_methods','code'),('umrah_payment_methods','is_enabled'),
    ('umrah_settings','deposits_enabled'),
    ('umrah_transactions','user_id'),('umrah_transactions','method_code'),('umrah_transactions','kind'),
    ('umrah_transactions','amount'),('umrah_transactions','currency'),('umrah_transactions','status')
  ) AS req(t,c)
  WHERE to_regclass('public.'||t) IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_schema='public' AND table_name=t AND column_name=c);
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Existing Umrah finance table(s) have an unexpected structure (missing: %). Stop.', missing;
  END IF;

  -- Existing ledger rows must never be silently re-interpreted.
  IF to_regclass('public.umrah_transactions') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.umrah_transactions WHERE status = 'approved') THEN
      RAISE EXCEPTION 'Approved Umrah transactions already exist. Review them manually before running v7.';
    END IF;
  END IF;
  IF to_regclass('public.umrah_goals') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.umrah_goals WHERE balance <> 0) THEN
      RAISE EXCEPTION 'Umrah goals with a non-zero balance already exist. Review them manually before running v7.';
    END IF;
  END IF;
END $$;

-- Umrah-admin check: Super Admin always; other admins only with the "umrah" grant.
CREATE OR REPLACE FUNCTION public.umrah_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.admin_can('umrah');
$$;
REVOKE EXECUTE ON FUNCTION public.umrah_admin() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.umrah_admin() TO authenticated;

-- ---------------------------------------------------------------------
-- 1. Permanent public-facing Member IDs. UUIDs remain unchanged/internal.
-- ---------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.member_id_seq START WITH 1;
REVOKE ALL ON SEQUENCE public.member_id_seq FROM PUBLIC, anon, authenticated;
GRANT ALL ON SEQUENCE public.member_id_seq TO service_role;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS member_id text;

CREATE OR REPLACE FUNCTION public.member_id_prefix(_full_name text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT upper(left(regexp_replace(coalesce(_full_name, ''), '[^A-Za-z]', '', 'g') || 'XXX', 3));
$$;
REVOKE EXECUTE ON FUNCTION public.member_id_prefix(text) FROM PUBLIC, anon, authenticated;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id, full_name FROM public.profiles WHERE member_id IS NULL ORDER BY created_at, id LOOP
    UPDATE public.profiles
       SET member_id = public.member_id_prefix(r.full_name) || lpad(nextval('public.member_id_seq')::text, 4, '0')
     WHERE id = r.id AND member_id IS NULL;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_member_id_unique ON public.profiles (member_id);
ALTER TABLE public.profiles ALTER COLUMN member_id SET NOT NULL;

CREATE OR REPLACE FUNCTION public.guard_profile_member_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.member_id := public.member_id_prefix(NEW.full_name) || lpad(nextval('public.member_id_seq')::text, 4, '0');
  ELSE
    NEW.member_id := OLD.member_id;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.guard_profile_member_id() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS profiles_guard_member_id ON public.profiles;
CREATE TRIGGER profiles_guard_member_id BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_member_id();

-- ---------------------------------------------------------------------
-- 2. Travel Partners: optional contacts, PRIVATE by default.
--    New columns default to false for every existing partner. Re-running
--    never changes a value the Super Admin has already approved.
--    Existing partner grants and RLS policies are NOT changed here.
-- ---------------------------------------------------------------------
ALTER TABLE public.umrah_partners
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS show_phone boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_whatsapp boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_email boolean NOT NULL DEFAULT false;
ALTER TABLE public.umrah_partners
  ALTER COLUMN show_phone SET DEFAULT false,
  ALTER COLUMN show_whatsapp SET DEFAULT false,
  ALTER COLUMN show_email SET DEFAULT false;

-- ---------------------------------------------------------------------
-- 3. Packages (planning categories; no price; unavailable)
-- ---------------------------------------------------------------------
DO $$ BEGIN CREATE TYPE public.umrah_tier AS ENUM ('economy','classic','vip');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.umrah_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier public.umrah_tier NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price numeric(14,2) CHECK (price IS NULL OR price > 0),
  currency text NOT NULL DEFAULT 'NGN' CHECK (currency IN ('NGN','USDT')),
  is_available boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.umrah_packages FROM anon, authenticated;
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

-- ---------------------------------------------------------------------
-- 4. Goals (one per member). Balance changes ONLY inside the two audited
--    SECURITY DEFINER functions in section 7.
-- ---------------------------------------------------------------------
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
DO $$ BEGIN ALTER TABLE public.umrah_goals ADD CONSTRAINT umrah_goals_currency_chk CHECK (currency IN ('NGN','USDT'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.umrah_goals ADD CONSTRAINT umrah_goals_status_chk CHECK (status IN ('not_started','active','completed'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.umrah_goals ADD CONSTRAINT umrah_goals_target_chk CHECK (target_amount IS NULL OR target_amount > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.umrah_goals ADD CONSTRAINT umrah_goals_balance_nonneg_chk CHECK (balance >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS umrah_goals_user_unique ON public.umrah_goals (user_id);

REVOKE ALL ON public.umrah_goals FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.umrah_goals TO authenticated;
GRANT ALL ON public.umrah_goals TO service_role;
ALTER TABLE public.umrah_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "goals read" ON public.umrah_goals;
CREATE POLICY "goals read" ON public.umrah_goals FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.umrah_admin());
DROP POLICY IF EXISTS "goals insert own" ON public.umrah_goals;
CREATE POLICY "goals insert own" ON public.umrah_goals FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND balance = 0 AND status IN ('not_started','active'));
DROP POLICY IF EXISTS "goals update own" ON public.umrah_goals;
CREATE POLICY "goals update own" ON public.umrah_goals FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Guard: API callers (anon/authenticated) can never change balance or owner,
-- cannot set 'completed', and cannot change currency once money is recorded.
-- r2: the bypass is honoured only when the statement runs as the function
-- OWNER (inside the section-7 SECURITY DEFINER functions), never for a
-- direct API role — a client-settable GUC alone is not trusted.
CREATE OR REPLACE FUNCTION public.guard_umrah_goal()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE api_caller boolean := current_user IN ('anon','authenticated');
BEGIN
  IF NOT api_caller AND current_setting('umrah.allow_balance', true) = 'on' THEN
    RETURN NEW;
  END IF;
  IF NOT api_caller THEN
    RETURN NEW;  -- service_role / owner maintenance: unchanged behaviour
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.balance := 0;
    IF NEW.status NOT IN ('not_started','active') THEN NEW.status := 'not_started'; END IF;
    RETURN NEW;
  END IF;
  NEW.balance := OLD.balance;
  NEW.user_id := OLD.user_id;
  NEW.created_at := OLD.created_at;
  IF OLD.balance <> 0 THEN NEW.currency := OLD.currency; END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT (OLD.status = 'not_started' AND NEW.status = 'active') THEN
    NEW.status := OLD.status;   -- members cannot forge 'completed' or roll back
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.guard_umrah_goal() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS umrah_goals_guard ON public.umrah_goals;
CREATE TRIGGER umrah_goals_guard BEFORE INSERT OR UPDATE ON public.umrah_goals
  FOR EACH ROW EXECUTE FUNCTION public.guard_umrah_goal();
DROP TRIGGER IF EXISTS umrah_goals_updated_at ON public.umrah_goals;
CREATE TRIGGER umrah_goals_updated_at BEFORE UPDATE ON public.umrah_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------
-- 5. Payment methods (USDT first, NGN second; both OFF)
-- ---------------------------------------------------------------------
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
ALTER TABLE public.umrah_payment_methods
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS account_name text,
  ADD COLUMN IF NOT EXISTS account_number text,
  ADD COLUMN IF NOT EXISTS wallet_address text;
REVOKE ALL ON public.umrah_payment_methods FROM anon, authenticated;
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
-- r2: force OFF even when the rows already existed and were switched on.
UPDATE public.umrah_payment_methods SET is_enabled = false WHERE is_enabled;

-- ---------------------------------------------------------------------
-- 6. Settings: master "Live deposits" switch (forced OFF)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.umrah_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  deposits_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.umrah_settings FROM anon, authenticated;
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
UPDATE public.umrah_settings SET deposits_enabled = false, updated_at = now() WHERE id = 1 AND deposits_enabled;

-- ---------------------------------------------------------------------
-- 7. Transactions (manual records, pending until an Umrah admin reviews)
-- ---------------------------------------------------------------------
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
DO $$ BEGIN ALTER TABLE public.umrah_transactions ADD CONSTRAINT umrah_tx_currency_chk CHECK (currency IN ('NGN','USDT'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.umrah_transactions ADD CONSTRAINT umrah_tx_method_chk CHECK (method_code IN ('usdt','ngn'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- r2: method and currency must always agree (payments AND refunds).
DO $$ BEGIN ALTER TABLE public.umrah_transactions ADD CONSTRAINT umrah_tx_method_currency_chk CHECK (upper(method_code) = currency);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- r2: receipt path is exactly <owner uuid>/umrah-receipts/<file>, no traversal.
ALTER TABLE public.umrah_transactions DROP CONSTRAINT IF EXISTS umrah_tx_receipt_path_chk;
ALTER TABLE public.umrah_transactions ADD CONSTRAINT umrah_tx_receipt_path_chk CHECK (
  receipt_path IS NULL OR (
    receipt_path ~ '^[0-9a-f-]{36}/umrah-receipts/[A-Za-z0-9._-]{1,255}$'
    AND split_part(receipt_path,'/',1) = user_id::text
    AND position('..' IN receipt_path) = 0));
-- Reviewed rows must carry reviewer + time; pending rows must not.
DO $$ BEGIN ALTER TABLE public.umrah_transactions ADD CONSTRAINT umrah_tx_review_consistency_chk CHECK (
  (status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL)
  OR (status <> 'pending' AND reviewed_at IS NOT NULL));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS umrah_tx_ref_unique ON public.umrah_transactions (method_code, reference)
  WHERE reference IS NOT NULL AND kind = 'payment';
CREATE INDEX IF NOT EXISTS umrah_tx_user_idx ON public.umrah_transactions (user_id, created_at DESC);

-- Members may read and insert only. Nobody but service_role may UPDATE/DELETE
-- directly; status changes happen only inside section-7 functions.
REVOKE ALL ON public.umrah_transactions FROM anon, authenticated;
GRANT SELECT, INSERT ON public.umrah_transactions TO authenticated;
GRANT ALL ON public.umrah_transactions TO service_role;
ALTER TABLE public.umrah_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tx read" ON public.umrah_transactions;
CREATE POLICY "tx read" ON public.umrah_transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.umrah_admin());
DROP POLICY IF EXISTS "tx member insert" ON public.umrah_transactions;
CREATE POLICY "tx member insert" ON public.umrah_transactions FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND kind = 'payment' AND status = 'pending'
  AND reviewed_by IS NULL AND reviewed_at IS NULL AND review_note IS NULL
  AND (created_by IS NULL OR created_by = auth.uid())
  AND umrah_transactions.currency = upper(umrah_transactions.method_code)
  AND EXISTS (SELECT 1 FROM public.umrah_goals g WHERE g.user_id = auth.uid()
              AND g.currency = umrah_transactions.currency
              AND (umrah_transactions.goal_id IS NULL OR g.id = umrah_transactions.goal_id))
  AND EXISTS (SELECT 1 FROM public.umrah_settings s WHERE s.id = 1 AND s.deposits_enabled)
  AND EXISTS (SELECT 1 FROM public.umrah_payment_methods m WHERE m.code = umrah_transactions.method_code AND m.is_enabled));

-- Stamp owner fields server-side on member inserts.
CREATE OR REPLACE FUNCTION public.stamp_umrah_transaction()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user IN ('anon','authenticated') THEN
    NEW.created_by := auth.uid();
    NEW.created_at := now();
    SELECT id INTO NEW.goal_id FROM public.umrah_goals WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.stamp_umrah_transaction() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS umrah_transactions_stamp ON public.umrah_transactions;
CREATE TRIGGER umrah_transactions_stamp BEFORE INSERT ON public.umrah_transactions
  FOR EACH ROW EXECUTE FUNCTION public.stamp_umrah_transaction();

-- ---------------------------------------------------------------------
-- 8. Review / refund — authorized, atomic, once only, audited.
--    Locks: goal row first, then transaction row, in BOTH functions, so
--    concurrent approvals/refunds serialize instead of double-processing.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.review_umrah_transaction(_id uuid, _approve boolean, _note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.umrah_transactions; g public.umrah_goals; uid uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.umrah_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _approve IS NULL THEN RAISE EXCEPTION 'Decision required'; END IF;

  SELECT user_id INTO uid FROM public.umrah_transactions WHERE id = _id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transaction not found'; END IF;
  SELECT * INTO g FROM public.umrah_goals WHERE user_id = uid FOR UPDATE;       -- lock 1
  SELECT * INTO t FROM public.umrah_transactions WHERE id = _id FOR UPDATE;     -- lock 2
  IF t.status <> 'pending' THEN RAISE EXCEPTION 'This transaction was already reviewed'; END IF;

  IF _approve THEN
    IF g.id IS NULL THEN RAISE EXCEPTION 'Member has no Umrah goal'; END IF;
    IF g.currency <> t.currency THEN
      RAISE EXCEPTION 'Currency % does not match the member goal currency % (no conversion is applied)', t.currency, g.currency;
    END IF;
    IF t.kind = 'refund' AND t.amount > g.balance THEN
      RAISE EXCEPTION 'Refund exceeds recorded balance';
    END IF;
  END IF;

  UPDATE public.umrah_transactions
     SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
         reviewed_by = auth.uid(), reviewed_at = now(), review_note = _note,
         goal_id = COALESCE(goal_id, g.id)
   WHERE id = _id AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'This transaction was already reviewed'; END IF;

  IF _approve THEN
    PERFORM set_config('umrah.allow_balance','on',true);
    UPDATE public.umrah_goals
       SET balance = balance + CASE WHEN t.kind = 'refund' THEN -t.amount ELSE t.amount END,
           status  = CASE WHEN status = 'not_started' THEN 'active' ELSE status END
     WHERE id = g.id;
    PERFORM set_config('umrah.allow_balance','off',true);
  END IF;

  INSERT INTO public.admin_audit_logs (admin_id, action, content_type, content_id, content_label, metadata)
  VALUES (auth.uid(), CASE WHEN _approve THEN 'approved' ELSE 'rejected' END || ' umrah ' || t.kind,
          'umrah_transactions', _id, t.reference,
          jsonb_build_object('amount', t.amount, 'currency', t.currency, 'user_id', t.user_id,
                             'method', t.method_code, 'balance_before', g.balance));
END $$;

-- r2: method is derived from the goal currency; a conflicting _method is refused.
CREATE OR REPLACE FUNCTION public.record_umrah_refund(_user_id uuid, _amount numeric, _method text, _note text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE nid uuid; g public.umrah_goals;
BEGIN
  IF auth.uid() IS NULL OR NOT public.umrah_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  SELECT * INTO g FROM public.umrah_goals WHERE user_id = _user_id FOR UPDATE;  -- lock 1
  IF g.id IS NULL THEN RAISE EXCEPTION 'Member has no Umrah goal'; END IF;
  IF _method IS NOT NULL AND lower(_method) <> lower(g.currency) THEN
    RAISE EXCEPTION 'Refund method % does not match the goal currency %', _method, g.currency;
  END IF;
  IF _amount > g.balance THEN RAISE EXCEPTION 'Refund exceeds recorded balance'; END IF;
  INSERT INTO public.umrah_transactions (user_id, goal_id, method_code, kind, amount, currency, note, status, created_by)
  VALUES (_user_id, g.id, lower(g.currency), 'refund', _amount, g.currency, _note, 'pending', auth.uid())
  RETURNING id INTO nid;
  PERFORM public.review_umrah_transaction(nid, true, _note);   -- same txn, same locks, audited
  RETURN nid;
END $$;
REVOKE EXECUTE ON FUNCTION public.review_umrah_transaction(uuid, boolean, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.record_umrah_refund(uuid, numeric, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.review_umrah_transaction(uuid, boolean, text) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.record_umrah_refund(uuid, numeric, text, text) TO authenticated;

-- Atomic Super Admin message to members whose Umrah goal is active.
CREATE OR REPLACE FUNCTION public.send_active_umrah_goal_message(_title text, _body text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE recipients uuid[]; message_id uuid; recipient_count integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Super Admin access is required';
  END IF;
  IF length(trim(coalesce(_title,''))) < 2 OR length(_title) > 160 THEN RAISE EXCEPTION 'Invalid title'; END IF;
  IF length(trim(coalesce(_body,''))) < 2 OR length(_body) > 2000 THEN RAISE EXCEPTION 'Invalid message'; END IF;

  SELECT array_agg(DISTINCT user_id), count(DISTINCT user_id)
    INTO recipients, recipient_count FROM public.umrah_goals WHERE status = 'active';
  IF recipient_count IS NULL OR recipient_count = 0 THEN RAISE EXCEPTION 'There are no active Umrah goal members to message'; END IF;

  INSERT INTO public.notification_messages
    (title, body, category, link_path, status, audience, created_by, published_at)
  VALUES (trim(_title), trim(_body), 'umrah', '/my-umrah?tab=goal', 'published', 'umrah_active', auth.uid(), now())
  RETURNING id INTO message_id;
  INSERT INTO public.notification_recipients (message_id, user_id)
  SELECT message_id, unnest(recipients);
  INSERT INTO public.admin_audit_logs (admin_id, action, content_type, content_id, content_label, metadata)
  VALUES (auth.uid(), 'sent Umrah goal message to '||recipient_count||' active member(s)',
          'notification', message_id, trim(_title),
          jsonb_build_object('audience','umrah_active','recipient_count',recipient_count));
  RETURN recipient_count;
END $$;
REVOKE EXECUTE ON FUNCTION public.send_active_umrah_goal_message(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_active_umrah_goal_message(text,text) TO authenticated;

-- ---------------------------------------------------------------------
-- 9. Private receipts in the existing PRIVATE member-documents bucket at
--    <user_id>/umrah-receipts/<file>. Existing v3/v6 storage policies are
--    kept. Added (all restrictive = narrowing only):
--      * receipts cannot be overwritten or deleted by API users once
--        uploaded (preserves the evidence behind a ledger record);
--      * Umrah admins get read access for signed links (permissive SELECT).
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "umrah receipts: umrah admins read" ON storage.objects;
CREATE POLICY "umrah receipts: umrah admins read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'member-documents' AND (storage.foldername(name))[2] = 'umrah-receipts' AND public.umrah_admin());
DROP POLICY IF EXISTS "umrah receipts: no overwrite" ON storage.objects;
CREATE POLICY "umrah receipts: no overwrite" ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (NOT (bucket_id = 'member-documents' AND (storage.foldername(name))[2] = 'umrah-receipts'));
DROP POLICY IF EXISTS "umrah receipts: no delete" ON storage.objects;
CREATE POLICY "umrah receipts: no delete" ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
  USING (NOT (bucket_id = 'member-documents' AND (storage.foldername(name))[2] = 'umrah-receipts'));

-- ---------------------------------------------------------------------
-- 10. Security warnings (SECURITY DEFINER functions callable by signed-in users)
-- ---------------------------------------------------------------------
-- 9a. Members can never claim Super Admin.
DO $$ BEGIN
  IF to_regprocedure('public.claim_first_super_admin()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.claim_first_super_admin() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;
-- 9b. is_platform_admin answers only about the caller (no probing).
--     Used by existing v3 storage policy "Admins read member document files"
--     with auth.uid(), so that policy keeps working.
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id IS NOT NULL
     AND (_user_id = auth.uid() OR (auth.uid() IS NULL AND session_user IN ('postgres','supabase_admin')))
     AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('super_admin','admin'));
$$;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO authenticated;
-- 9c. ensure_member_role only ever adds the plain 'member' role to the caller.
DO $$ BEGIN
  IF to_regprocedure('public.ensure_member_role()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.ensure_member_role() FROM PUBLIC, anon;
    GRANT  EXECUTE ON FUNCTION public.ensure_member_role() TO authenticated;
  END IF;
END $$;
-- 9d/9e. review_umrah_transaction / record_umrah_refund: guarded in section 7.

-- Final guard inside the same transaction: collection must be OFF.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.umrah_settings WHERE deposits_enabled)
     OR EXISTS (SELECT 1 FROM public.umrah_payment_methods WHERE is_enabled) THEN
    RAISE EXCEPTION 'Payment collection is not OFF — rolling back.';
  END IF;
END $$;

COMMIT;
NOTIFY pgrst, 'reload schema';

-- Read-only verification: run supabase/v7_postcheck_readonly.sql.
