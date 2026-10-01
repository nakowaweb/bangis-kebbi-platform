-- V9 (r2) — Super Admin correction and deletion of individual Umrah records.
-- Requires V7 (umrah tables, review_umrah_transaction, guard_umrah_goal) — do NOT rerun V7.
-- Re-runnable: only CREATE OR REPLACE FUNCTION + grants, inside one transaction.
-- Deletes NOTHING by itself. Every function: Super Admin only, explicit confirmation text,
-- row-level scope via foreign keys only, balance adjustment in the same transaction, audit log entry
-- with before/after values or a full deletion snapshot. Live Deposits and payment methods are untouched.
--
-- r2 changes: application deletion no longer touches member_activities or notifications
-- (they have no application_id link, so ownership cannot be proven; they are kept and counted in the audit);
-- application corrections audit before/after values; deletion audit stores the full row + document metadata.
-- Lock order everywhere: transaction row -> goal row (same as V7 review_umrah_transaction) to avoid deadlocks.

BEGIN;

CREATE OR REPLACE FUNCTION public.v9_require_super_admin()
RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin') THEN
    RAISE EXCEPTION 'Only the Super Admin can do this.' USING ERRCODE = '42501';
  END IF;
END $$;

-- 1. Correct applicant details (whitelisted fields only; status/messages keep their existing workflow).
CREATE OR REPLACE FUNCTION public.admin_update_umrah_application_details(_id uuid, _fields jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.umrah_applications; b public.umrah_applications; k text; before_v jsonb := '{}'; after_v jsonb := '{}';
  allowed text[] := ARRAY['full_name','phone','email','nationality','country_of_residence','state_region','city','passport_number',
    'passport_issuing_country','emergency_contact_name','emergency_contact_phone','emergency_contact_relationship','preferred_travel_period','travel_notes'];
BEGIN
  PERFORM public.v9_require_super_admin();
  IF _fields IS NULL OR jsonb_typeof(_fields) <> 'object' THEN RAISE EXCEPTION 'Fields must be an object'; END IF;
  SELECT * INTO a FROM public.umrah_applications WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Application not found'; END IF;
  FOR k IN SELECT jsonb_object_keys(_fields) LOOP
    IF NOT k = ANY(allowed) THEN RAISE EXCEPTION 'Field % cannot be edited here', k; END IF;
  END LOOP;
  IF _fields ? 'full_name' AND length(trim(coalesce(_fields->>'full_name',''))) < 2 THEN RAISE EXCEPTION 'Full name is required'; END IF;
  UPDATE public.umrah_applications SET
    full_name = CASE WHEN _fields ? 'full_name' THEN trim(_fields->>'full_name') ELSE full_name END,
    phone = CASE WHEN _fields ? 'phone' THEN NULLIF(trim(_fields->>'phone'),'') ELSE phone END,
    email = CASE WHEN _fields ? 'email' THEN NULLIF(trim(_fields->>'email'),'') ELSE email END,
    nationality = CASE WHEN _fields ? 'nationality' THEN NULLIF(trim(_fields->>'nationality'),'') ELSE nationality END,
    country_of_residence = CASE WHEN _fields ? 'country_of_residence' THEN NULLIF(trim(_fields->>'country_of_residence'),'') ELSE country_of_residence END,
    state_region = CASE WHEN _fields ? 'state_region' THEN NULLIF(trim(_fields->>'state_region'),'') ELSE state_region END,
    city = CASE WHEN _fields ? 'city' THEN NULLIF(trim(_fields->>'city'),'') ELSE city END,
    passport_number = CASE WHEN _fields ? 'passport_number' THEN NULLIF(trim(_fields->>'passport_number'),'') ELSE passport_number END,
    passport_issuing_country = CASE WHEN _fields ? 'passport_issuing_country' THEN NULLIF(trim(_fields->>'passport_issuing_country'),'') ELSE passport_issuing_country END,
    emergency_contact_name = CASE WHEN _fields ? 'emergency_contact_name' THEN NULLIF(trim(_fields->>'emergency_contact_name'),'') ELSE emergency_contact_name END,
    emergency_contact_phone = CASE WHEN _fields ? 'emergency_contact_phone' THEN NULLIF(trim(_fields->>'emergency_contact_phone'),'') ELSE emergency_contact_phone END,
    emergency_contact_relationship = CASE WHEN _fields ? 'emergency_contact_relationship' THEN NULLIF(trim(_fields->>'emergency_contact_relationship'),'') ELSE emergency_contact_relationship END,
    preferred_travel_period = CASE WHEN _fields ? 'preferred_travel_period' THEN NULLIF(trim(_fields->>'preferred_travel_period'),'') ELSE preferred_travel_period END,
    travel_notes = CASE WHEN _fields ? 'travel_notes' THEN NULLIF(trim(_fields->>'travel_notes'),'') ELSE travel_notes END
  WHERE id = _id RETURNING * INTO b;
  -- Record only fields whose value actually changed.
  FOR k IN SELECT jsonb_object_keys(_fields) LOOP
    IF to_jsonb(a)->k IS DISTINCT FROM to_jsonb(b)->k THEN
      before_v := before_v || jsonb_build_object(k, to_jsonb(a)->k);
      after_v := after_v || jsonb_build_object(k, to_jsonb(b)->k);
    END IF;
  END LOOP;
  INSERT INTO public.admin_audit_logs (admin_id, action, content_type, content_id, content_label, metadata)
  VALUES (auth.uid(), 'corrected umrah application details', 'umrah_applications', _id, a.application_number,
    jsonb_build_object('user_id', a.user_id, 'before', before_v, 'after', after_v));
END $$;

-- 2. Permanently delete ONE application. _confirm must equal its application number.
-- Removes only rows linked by foreign key: its umrah_documents and umrah_application_history.
-- Member activity lines and notifications are KEPT (no application_id link exists to prove ownership).
-- Payments/goals are not linked to applications and are not touched; balances are unchanged.
-- Returns document storage paths so the server can remove the files.
CREATE OR REPLACE FUNCTION public.admin_delete_umrah_application(_id uuid, _confirm text)
RETURNS text[] LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.umrah_applications; paths text[]; docs jsonb; n_docs int; n_hist int;
BEGIN
  PERFORM public.v9_require_super_admin();
  SELECT * INTO a FROM public.umrah_applications WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Application not found'; END IF;
  IF _confirm IS DISTINCT FROM a.application_number THEN RAISE EXCEPTION 'Confirmation does not match application number %', a.application_number; END IF;

  SELECT coalesce(array_agg(storage_path ORDER BY created_at), '{}'),
         coalesce(jsonb_agg(jsonb_build_object('id', id, 'document_type', document_type, 'original_name', original_name,
           'storage_path', storage_path, 'mime_type', mime_type, 'byte_size', byte_size, 'review_status', review_status, 'created_at', created_at) ORDER BY created_at), '[]')
    INTO paths, docs FROM public.umrah_documents WHERE application_id = _id;
  DELETE FROM public.umrah_documents WHERE application_id = _id; GET DIAGNOSTICS n_docs = ROW_COUNT;
  DELETE FROM public.umrah_application_history WHERE application_id = _id; GET DIAGNOSTICS n_hist = ROW_COUNT;
  DELETE FROM public.umrah_applications WHERE id = _id;

  INSERT INTO public.admin_audit_logs (admin_id, action, content_type, content_id, content_label, metadata)
  VALUES (auth.uid(), 'permanently deleted umrah application', 'umrah_applications', _id, a.application_number,
    jsonb_build_object('snapshot', to_jsonb(a), 'documents', docs, 'documents_deleted', n_docs, 'history_deleted', n_hist,
      'activities_kept', true, 'notifications_kept', true));
  RETURN paths;
END $$;

-- 3. Correct a transaction. Pending: amount/reference/note. Reviewed: reference/note only —
-- approved money is never silently rewritten; delete (which reverses) and re-record instead.
CREATE OR REPLACE FUNCTION public.admin_correct_umrah_transaction(_id uuid, _amount numeric, _reference text, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.umrah_transactions; n public.umrah_transactions;
BEGIN
  PERFORM public.v9_require_super_admin();
  SELECT * INTO t FROM public.umrah_transactions WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transaction not found'; END IF;
  IF _amount IS NOT NULL AND _amount <> t.amount THEN
    IF t.status <> 'pending' THEN RAISE EXCEPTION 'Reviewed amounts cannot be edited. Delete (reverses the balance) and record it again.'; END IF;
    IF NOT (_amount > 0) THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;
  END IF;
  UPDATE public.umrah_transactions SET amount = coalesce(_amount, amount), reference = NULLIF(trim(_reference), ''), note = NULLIF(trim(_note), '')
   WHERE id = _id RETURNING * INTO n;
  INSERT INTO public.admin_audit_logs (admin_id, action, content_type, content_id, content_label, metadata)
  VALUES (auth.uid(), 'corrected umrah transaction', 'umrah_transactions', _id, coalesce(n.reference, t.reference),
    jsonb_build_object('before', jsonb_build_object('amount', t.amount, 'reference', t.reference, 'note', t.note),
      'after', jsonb_build_object('amount', n.amount, 'reference', n.reference, 'note', n.note), 'status', t.status, 'user_id', t.user_id));
END $$;

-- 4. Permanently delete ONE transaction. _confirm must equal the first 8 characters of its ID.
-- Approved payment: balance - amount. Approved refund: balance + amount. Pending/rejected: no balance change.
-- Refused if the reversal would make the balance negative. Same transaction, audited.
CREATE OR REPLACE FUNCTION public.admin_delete_umrah_transaction(_id uuid, _confirm text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.umrah_transactions; delta numeric := 0; oldbal numeric; newbal numeric;
BEGIN
  PERFORM public.v9_require_super_admin();
  SELECT * INTO t FROM public.umrah_transactions WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transaction not found'; END IF;
  IF _confirm IS DISTINCT FROM left(_id::text, 8) THEN RAISE EXCEPTION 'Confirmation does not match transaction code %', left(_id::text, 8); END IF;
  IF t.status = 'approved' THEN
    delta := CASE WHEN t.kind = 'refund' THEN t.amount ELSE -t.amount END;
    SELECT balance INTO oldbal FROM public.umrah_goals WHERE user_id = t.user_id FOR UPDATE;
    IF oldbal IS NULL THEN RAISE EXCEPTION 'Member goal not found for this approved transaction'; END IF;
    newbal := oldbal + delta;
    IF newbal < 0 THEN RAISE EXCEPTION 'Reversal would make the balance negative (%). Remove the later refund first.', newbal; END IF;
    PERFORM set_config('umrah.allow_balance', 'on', true);
    UPDATE public.umrah_goals SET balance = newbal WHERE user_id = t.user_id;
    PERFORM set_config('umrah.allow_balance', 'off', true);
  END IF;
  DELETE FROM public.umrah_transactions WHERE id = _id;
  INSERT INTO public.admin_audit_logs (admin_id, action, content_type, content_id, content_label, metadata)
  VALUES (auth.uid(), 'permanently deleted umrah transaction', 'umrah_transactions', _id, t.reference,
    jsonb_build_object('snapshot', to_jsonb(t), 'balance_before', oldbal, 'balance_reversal', delta, 'balance_after', newbal));
  RETURN t.receipt_path;
END $$;

-- 5. Correct a goal (target, status, package). The balance is never edited directly.
CREATE OR REPLACE FUNCTION public.admin_update_umrah_goal(_user_id uuid, _target numeric, _status text, _package_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g public.umrah_goals; n public.umrah_goals;
BEGIN
  PERFORM public.v9_require_super_admin();
  SELECT * INTO g FROM public.umrah_goals WHERE user_id = _user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Goal not found'; END IF;
  IF _target IS NOT NULL AND NOT (_target > 0) THEN RAISE EXCEPTION 'Target must be greater than zero or empty'; END IF;
  UPDATE public.umrah_goals SET target_amount = _target, status = coalesce(NULLIF(_status, ''), status), package_id = _package_id
   WHERE user_id = _user_id RETURNING * INTO n;
  INSERT INTO public.admin_audit_logs (admin_id, action, content_type, content_id, content_label, metadata)
  VALUES (auth.uid(), 'corrected umrah goal', 'umrah_goals', g.id, _user_id::text,
    jsonb_build_object('before', jsonb_build_object('target', g.target_amount, 'status', g.status, 'package_id', g.package_id, 'balance', g.balance),
      'after', jsonb_build_object('target', n.target_amount, 'status', n.status, 'package_id', n.package_id, 'balance', n.balance)));
END $$;

-- 6. Permanently delete ONE goal — only when it has no transactions left (delete those first, which reverses them).
CREATE OR REPLACE FUNCTION public.admin_delete_umrah_goal(_user_id uuid, _confirm text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g public.umrah_goals;
BEGIN
  PERFORM public.v9_require_super_admin();
  SELECT * INTO g FROM public.umrah_goals WHERE user_id = _user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Goal not found'; END IF;
  IF _confirm IS DISTINCT FROM 'DELETE GOAL' THEN RAISE EXCEPTION 'Type DELETE GOAL to confirm'; END IF;
  IF EXISTS (SELECT 1 FROM public.umrah_transactions WHERE user_id = _user_id) THEN
    RAISE EXCEPTION 'This goal still has transactions. Delete them first so the balance is reversed and audited.';
  END IF;
  DELETE FROM public.umrah_goals WHERE user_id = _user_id;
  INSERT INTO public.admin_audit_logs (admin_id, action, content_type, content_id, content_label, metadata)
  VALUES (auth.uid(), 'permanently deleted umrah goal', 'umrah_goals', g.id, _user_id::text, jsonb_build_object('snapshot', to_jsonb(g)));
END $$;

DO $$ DECLARE f text; BEGIN
  FOREACH f IN ARRAY ARRAY['v9_require_super_admin()',
    'admin_update_umrah_application_details(uuid,jsonb)', 'admin_delete_umrah_application(uuid,text)',
    'admin_correct_umrah_transaction(uuid,numeric,text,text)', 'admin_delete_umrah_transaction(uuid,text)',
    'admin_update_umrah_goal(uuid,numeric,text,uuid)', 'admin_delete_umrah_goal(uuid,text)'] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', f);
  END LOOP;
END $$;

COMMIT;
