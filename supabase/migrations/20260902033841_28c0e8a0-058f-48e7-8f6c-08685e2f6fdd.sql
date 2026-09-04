CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'Player',
  balance NUMERIC(18,6) NOT NULL DEFAULT 1,
  collected NUMERIC(18,6) NOT NULL DEFAULT 0,
  referral_balance NUMERIC(18,6) NOT NULL DEFAULT 0,
  referred_by TEXT,
  last_accrual TIMESTAMPTZ NOT NULL DEFAULT now(),
  addresses JSONB NOT NULL DEFAULT '{}'::jsonb,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.player_dragons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  dragon_id INTEGER NOT NULL,
  bought_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_player_dragons_player ON public.player_dragons(player_id);

CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('deposit','withdraw')),
  method TEXT NOT NULL,
  amount NUMERIC(18,6) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_transactions_player ON public.transactions(player_id);

CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  invited_name TEXT NOT NULL,
  deposit NUMERIC(18,6) NOT NULL DEFAULT 0,
  income NUMERIC(18,6) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_referrals_inviter ON public.referrals(inviter_id);

GRANT ALL ON public.players TO service_role;
GRANT ALL ON public.player_dragons TO service_role;
GRANT ALL ON public.transactions TO service_role;
GRANT ALL ON public.referrals TO service_role;

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_dragons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;