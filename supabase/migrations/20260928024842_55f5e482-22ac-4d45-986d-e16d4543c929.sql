ALTER TABLE public.umrah_transactions ADD COLUMN IF NOT EXISTS receipt_path text;

DO $$ BEGIN
  ALTER TABLE public.umrah_goals ADD CONSTRAINT umrah_goals_currency_chk CHECK (currency IN ('NGN','USDT'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.umrah_transactions ADD CONSTRAINT umrah_tx_currency_chk CHECK (currency IN ('NGN','USDT'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.umrah_transactions ADD CONSTRAINT umrah_tx_receipt_path_chk CHECK (receipt_path IS NULL OR split_part(receipt_path,'/',1) = user_id::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Members may not switch goal currency once a balance is recorded.
CREATE OR REPLACE FUNCTION public.guard_umrah_goal()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('umrah.allow_balance', true) = 'on' THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN NEW.balance := 0; RETURN NEW; END IF;
  NEW.balance := OLD.balance; NEW.user_id := OLD.user_id;
  IF OLD.balance <> 0 THEN NEW.currency := OLD.currency; END IF;
  RETURN NEW;
END $function$;

DROP POLICY IF EXISTS "tx member insert" ON public.umrah_transactions;
CREATE POLICY "tx member insert" ON public.umrah_transactions FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND kind = 'payment' AND status = 'pending' AND reviewed_by IS NULL
  AND currency = upper(method_code)
  AND EXISTS (SELECT 1 FROM public.umrah_goals g WHERE g.user_id = auth.uid() AND g.currency = currency)
  AND EXISTS (SELECT 1 FROM public.umrah_settings WHERE id = 1 AND deposits_enabled)
  AND EXISTS (SELECT 1 FROM public.umrah_payment_methods m WHERE m.code = method_code AND m.is_enabled));

CREATE OR REPLACE FUNCTION public.review_umrah_transaction(_id uuid, _approve boolean, _note text DEFAULT NULL::text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE t public.umrah_transactions; gcur text;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO t FROM public.umrah_transactions WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transaction not found'; END IF;
  IF t.status <> 'pending' THEN RAISE EXCEPTION 'This transaction was already reviewed'; END IF;
  IF _approve THEN
    SELECT currency INTO gcur FROM public.umrah_goals WHERE user_id = t.user_id;
    IF gcur IS NOT NULL AND gcur <> t.currency THEN
      RAISE EXCEPTION 'Currency % does not match the member goal currency % (no conversion is applied)', t.currency, gcur;
    END IF;
  END IF;
  UPDATE public.umrah_transactions SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
    reviewed_by = auth.uid(), reviewed_at = now(), review_note = _note WHERE id = _id;
  IF _approve THEN
    PERFORM set_config('umrah.allow_balance','on',true);
    INSERT INTO public.umrah_goals (user_id, currency) VALUES (t.user_id, t.currency) ON CONFLICT (user_id) DO NOTHING;
    UPDATE public.umrah_goals SET balance = balance + CASE WHEN t.kind = 'refund' THEN -t.amount ELSE t.amount END,
      status = CASE WHEN status = 'not_started' THEN 'active' ELSE status END
      WHERE user_id = t.user_id;
    PERFORM set_config('umrah.allow_balance','off',true);
  END IF;
  INSERT INTO public.admin_audit_logs (admin_id, action, content_type, content_id, content_label, metadata)
  VALUES (auth.uid(), CASE WHEN _approve THEN 'approved' ELSE 'rejected' END || ' umrah ' || t.kind, 'umrah_transactions', _id, t.reference,
    jsonb_build_object('amount', t.amount, 'currency', t.currency, 'user_id', t.user_id, 'method', t.method_code));
END $function$;

CREATE OR REPLACE FUNCTION public.record_umrah_refund(_user_id uuid, _amount numeric, _method text, _note text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE nid uuid; bal numeric; gcur text;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT balance, currency INTO bal, gcur FROM public.umrah_goals WHERE user_id = _user_id FOR UPDATE;
  IF bal IS NULL OR _amount > bal THEN RAISE EXCEPTION 'Refund exceeds recorded balance'; END IF;
  INSERT INTO public.umrah_transactions (user_id, method_code, kind, amount, currency, note, status, created_by)
  VALUES (_user_id, _method, 'refund', _amount, gcur, _note, 'pending', auth.uid()) RETURNING id INTO nid;
  PERFORM public.review_umrah_transaction(nid, true, _note);
  RETURN nid;
END $function$;