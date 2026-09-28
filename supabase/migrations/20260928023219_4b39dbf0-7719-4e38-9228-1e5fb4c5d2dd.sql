DO $$ BEGIN CREATE TYPE public.umrah_tier AS ENUM ('economy','classic','vip'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.umrah_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier public.umrah_tier NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price numeric(14,2),
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
CREATE POLICY "packages read" ON public.umrah_packages FOR SELECT USING (is_available OR public.is_platform_admin(auth.uid()));
DROP POLICY IF EXISTS "packages admin" ON public.umrah_packages;
CREATE POLICY "packages admin" ON public.umrah_packages FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));
DROP TRIGGER IF EXISTS umrah_packages_updated_at ON public.umrah_packages;
CREATE TRIGGER umrah_packages_updated_at BEFORE UPDATE ON public.umrah_packages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.umrah_packages (tier,name,sort_order) VALUES ('economy','Economy',1),('classic','Classic',2),('vip','VIP',3) ON CONFLICT (tier) DO NOTHING;

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
GRANT SELECT, INSERT, UPDATE ON public.umrah_goals TO authenticated;
GRANT ALL ON public.umrah_goals TO service_role;
ALTER TABLE public.umrah_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "goals read" ON public.umrah_goals;
CREATE POLICY "goals read" ON public.umrah_goals FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));
DROP POLICY IF EXISTS "goals insert own" ON public.umrah_goals;
CREATE POLICY "goals insert own" ON public.umrah_goals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND balance = 0);
DROP POLICY IF EXISTS "goals update own" ON public.umrah_goals;
CREATE POLICY "goals update own" ON public.umrah_goals FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.guard_umrah_goal() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_setting('umrah.allow_balance', true) = 'on' THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN NEW.balance := 0; RETURN NEW; END IF;
  NEW.balance := OLD.balance; NEW.user_id := OLD.user_id;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS umrah_goals_guard ON public.umrah_goals;
CREATE TRIGGER umrah_goals_guard BEFORE INSERT OR UPDATE ON public.umrah_goals FOR EACH ROW EXECUTE FUNCTION public.guard_umrah_goal();
DROP TRIGGER IF EXISTS umrah_goals_updated_at ON public.umrah_goals;
CREATE TRIGGER umrah_goals_updated_at BEFORE UPDATE ON public.umrah_goals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.umrah_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  instructions text,
  receiving_details text,
  is_enabled boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.umrah_payment_methods TO authenticated;
GRANT INSERT, UPDATE ON public.umrah_payment_methods TO authenticated;
GRANT ALL ON public.umrah_payment_methods TO service_role;
ALTER TABLE public.umrah_payment_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "methods read" ON public.umrah_payment_methods;
CREATE POLICY "methods read" ON public.umrah_payment_methods FOR SELECT TO authenticated USING (is_enabled OR public.is_platform_admin(auth.uid()));
DROP POLICY IF EXISTS "methods admin" ON public.umrah_payment_methods;
CREATE POLICY "methods admin" ON public.umrah_payment_methods FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));
DROP TRIGGER IF EXISTS umrah_payment_methods_updated_at ON public.umrah_payment_methods;
CREATE TRIGGER umrah_payment_methods_updated_at BEFORE UPDATE ON public.umrah_payment_methods FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.umrah_payment_methods (code,label,sort_order) VALUES ('usdt','USDT',1),('ngn','Nigerian Naira (NGN)',2) ON CONFLICT (code) DO NOTHING;

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
CREATE POLICY "settings admin" ON public.umrah_settings FOR UPDATE TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));
INSERT INTO public.umrah_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

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
CREATE UNIQUE INDEX IF NOT EXISTS umrah_tx_ref_unique ON public.umrah_transactions (method_code, reference) WHERE reference IS NOT NULL AND kind = 'payment';
GRANT SELECT, INSERT ON public.umrah_transactions TO authenticated;
GRANT ALL ON public.umrah_transactions TO service_role;
ALTER TABLE public.umrah_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tx read" ON public.umrah_transactions;
CREATE POLICY "tx read" ON public.umrah_transactions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));
DROP POLICY IF EXISTS "tx member insert" ON public.umrah_transactions;
CREATE POLICY "tx member insert" ON public.umrah_transactions FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND kind = 'payment' AND status = 'pending' AND reviewed_by IS NULL
  AND EXISTS (SELECT 1 FROM public.umrah_settings WHERE id = 1 AND deposits_enabled)
  AND EXISTS (SELECT 1 FROM public.umrah_payment_methods m WHERE m.code = method_code AND m.is_enabled));

CREATE OR REPLACE FUNCTION public.review_umrah_transaction(_id uuid, _approve boolean, _note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.umrah_transactions;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO t FROM public.umrah_transactions WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transaction not found'; END IF;
  IF t.status <> 'pending' THEN RAISE EXCEPTION 'This transaction was already reviewed'; END IF;
  UPDATE public.umrah_transactions SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
    reviewed_by = auth.uid(), reviewed_at = now(), review_note = _note WHERE id = _id;
  IF _approve THEN
    PERFORM set_config('umrah.allow_balance','on',true);
    INSERT INTO public.umrah_goals (user_id) VALUES (t.user_id) ON CONFLICT (user_id) DO NOTHING;
    UPDATE public.umrah_goals SET balance = balance + CASE WHEN t.kind = 'refund' THEN -t.amount ELSE t.amount END,
      status = CASE WHEN status = 'not_started' THEN 'active' ELSE status END
      WHERE user_id = t.user_id;
    PERFORM set_config('umrah.allow_balance','off',true);
  END IF;
  INSERT INTO public.admin_audit_logs (admin_id, action, content_type, content_id, content_label, metadata)
  VALUES (auth.uid(), CASE WHEN _approve THEN 'approved' ELSE 'rejected' END || ' umrah ' || t.kind, 'umrah_transactions', _id, t.reference,
    jsonb_build_object('amount', t.amount, 'user_id', t.user_id, 'method', t.method_code));
END $$;

CREATE OR REPLACE FUNCTION public.record_umrah_refund(_user_id uuid, _amount numeric, _method text, _note text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE nid uuid; bal numeric;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT balance INTO bal FROM public.umrah_goals WHERE user_id = _user_id FOR UPDATE;
  IF bal IS NULL OR _amount > bal THEN RAISE EXCEPTION 'Refund exceeds recorded balance'; END IF;
  INSERT INTO public.umrah_transactions (user_id, method_code, kind, amount, note, status, created_by)
  VALUES (_user_id, _method, 'refund', _amount, _note, 'pending', auth.uid()) RETURNING id INTO nid;
  PERFORM public.review_umrah_transaction(nid, true, _note);
  RETURN nid;
END $$;
REVOKE EXECUTE ON FUNCTION public.review_umrah_transaction(uuid, boolean, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.record_umrah_refund(uuid, numeric, text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.review_umrah_transaction(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_umrah_refund(uuid, numeric, text, text) TO authenticated;