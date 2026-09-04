ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS order_id TEXT,
  ADD COLUMN IF NOT EXISTS invoice TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS tag TEXT,
  ADD COLUMN IF NOT EXISTS system TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT,
  ADD COLUMN IF NOT EXISTS txn_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS transactions_order_id_key ON public.transactions (order_id) WHERE order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS transactions_txn_hash_key ON public.transactions (txn_hash) WHERE txn_hash IS NOT NULL;

DROP POLICY IF EXISTS "service_role_all_players" ON public.players;
CREATE POLICY "service_role_all_players" ON public.players FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_player_dragons" ON public.player_dragons;
CREATE POLICY "service_role_all_player_dragons" ON public.player_dragons FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_transactions" ON public.transactions;
CREATE POLICY "service_role_all_transactions" ON public.transactions FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_referrals" ON public.referrals;
CREATE POLICY "service_role_all_referrals" ON public.referrals FOR ALL TO service_role USING (true) WITH CHECK (true);