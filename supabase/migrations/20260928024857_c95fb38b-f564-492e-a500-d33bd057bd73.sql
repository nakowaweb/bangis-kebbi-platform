DROP POLICY IF EXISTS "tx member insert" ON public.umrah_transactions;
CREATE POLICY "tx member insert" ON public.umrah_transactions FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND kind = 'payment' AND status = 'pending' AND reviewed_by IS NULL
  AND umrah_transactions.currency = upper(umrah_transactions.method_code)
  AND EXISTS (SELECT 1 FROM public.umrah_goals g WHERE g.user_id = auth.uid() AND g.currency = umrah_transactions.currency)
  AND EXISTS (SELECT 1 FROM public.umrah_settings s WHERE s.id = 1 AND s.deposits_enabled)
  AND EXISTS (SELECT 1 FROM public.umrah_payment_methods m WHERE m.code = umrah_transactions.method_code AND m.is_enabled));