ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS invoice TEXT,
  ADD COLUMN IF NOT EXISTS pay_address TEXT,
  ADD COLUMN IF NOT EXISTS tag TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_invoice
  ON public.transactions (invoice) WHERE invoice IS NOT NULL;