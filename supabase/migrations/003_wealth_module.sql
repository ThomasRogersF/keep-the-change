-- Wealth module: emergency funds, savings/yield accounts, investments, internal transfers
-- Mirrors local Dexie schema v4. Same conventions as 001_sync_tables.sql:
-- TEXT primary keys (matching local UUIDs), RLS enabled with user_id-based policies,
-- soft deletes only (no DELETE policy — deletions propagate as deleted_at updates).

-- ─── Wealth Accounts ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS wealth_accounts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'brokerage')),
  asset_class TEXT NOT NULL CHECK (asset_class IN ('fiat', 'crypto')),
  balance NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  institution TEXT,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  liquidity TEXT NOT NULL CHECK (liquidity IN ('immediate', 'short_term', 'long_term')),
  insurance_type TEXT NOT NULL CHECK (insurance_type IN ('FDIC', 'NCUA', 'SIPC', 'none')),
  notes TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_wealth_accounts_user_updated ON wealth_accounts (user_id, updated_at);
CREATE INDEX idx_wealth_accounts_user_deleted ON wealth_accounts (user_id, deleted_at);

ALTER TABLE wealth_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wealth_accounts" ON wealth_accounts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own wealth_accounts" ON wealth_accounts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own wealth_accounts" ON wealth_accounts FOR UPDATE USING (user_id = auth.uid());

-- ─── Emergency Funds ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_funds (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  wealth_account_id TEXT NOT NULL,
  monthly_expenses NUMERIC NOT NULL,
  target_months NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_emergency_funds_user_updated ON emergency_funds (user_id, updated_at);
CREATE INDEX idx_emergency_funds_user_deleted ON emergency_funds (user_id, deleted_at);
CREATE INDEX idx_emergency_funds_wealth_account ON emergency_funds (wealth_account_id);

ALTER TABLE emergency_funds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own emergency_funds" ON emergency_funds FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own emergency_funds" ON emergency_funds FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own emergency_funds" ON emergency_funds FOR UPDATE USING (user_id = auth.uid());

-- ─── Emergency Fund Activities ────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_fund_activities (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emergency_fund_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('contribution', 'withdrawal')),
  amount NUMERIC NOT NULL,
  date TEXT NOT NULL,
  reason TEXT CHECK (
    reason IS NULL OR reason IN (
      'medical', 'job_loss', 'car_repair', 'home_repair',
      'family_emergency', 'travel_emergency', 'other'
    )
  ),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_emergency_fund_activities_user_updated ON emergency_fund_activities (user_id, updated_at);
CREATE INDEX idx_emergency_fund_activities_user_deleted ON emergency_fund_activities (user_id, deleted_at);
CREATE INDEX idx_emergency_fund_activities_fund ON emergency_fund_activities (emergency_fund_id);

ALTER TABLE emergency_fund_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own emergency_fund_activities" ON emergency_fund_activities FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own emergency_fund_activities" ON emergency_fund_activities FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own emergency_fund_activities" ON emergency_fund_activities FOR UPDATE USING (user_id = auth.uid());

-- ─── Yield Profiles ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS yield_profiles (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wealth_account_id TEXT NOT NULL,
  rate_type TEXT NOT NULL CHECK (rate_type IN ('APY', 'APR')),
  current_rate NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_yield_profiles_user_updated ON yield_profiles (user_id, updated_at);
CREATE INDEX idx_yield_profiles_user_deleted ON yield_profiles (user_id, deleted_at);
CREATE INDEX idx_yield_profiles_wealth_account ON yield_profiles (wealth_account_id);

ALTER TABLE yield_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own yield_profiles" ON yield_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own yield_profiles" ON yield_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own yield_profiles" ON yield_profiles FOR UPDATE USING (user_id = auth.uid());

-- ─── Yield Rate Histories ─────────────────────────────────
CREATE TABLE IF NOT EXISTS yield_rate_histories (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  yield_profile_id TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  effective_date TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_yield_rate_histories_user_updated ON yield_rate_histories (user_id, updated_at);
CREATE INDEX idx_yield_rate_histories_user_deleted ON yield_rate_histories (user_id, deleted_at);
CREATE INDEX idx_yield_rate_histories_profile ON yield_rate_histories (yield_profile_id);

ALTER TABLE yield_rate_histories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own yield_rate_histories" ON yield_rate_histories FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own yield_rate_histories" ON yield_rate_histories FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own yield_rate_histories" ON yield_rate_histories FOR UPDATE USING (user_id = auth.uid());

-- ─── Asset Holdings ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS asset_holdings (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wealth_account_id TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('etf', 'stock', 'crypto')),
  symbol TEXT NOT NULL,
  name TEXT,
  quantity NUMERIC NOT NULL DEFAULT 0,
  cost_basis_total NUMERIC NOT NULL DEFAULT 0,
  current_price_per_unit NUMERIC NOT NULL DEFAULT 0,
  price_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_asset_holdings_user_updated ON asset_holdings (user_id, updated_at);
CREATE INDEX idx_asset_holdings_user_deleted ON asset_holdings (user_id, deleted_at);
CREATE INDEX idx_asset_holdings_wealth_account ON asset_holdings (wealth_account_id);

ALTER TABLE asset_holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own asset_holdings" ON asset_holdings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own asset_holdings" ON asset_holdings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own asset_holdings" ON asset_holdings FOR UPDATE USING (user_id = auth.uid());

-- ─── Investment Activities ────────────────────────────────
CREATE TABLE IF NOT EXISTS investment_activities (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wealth_account_id TEXT NOT NULL,
  asset_holding_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell', 'dividend', 'fee', 'priceUpdate')),
  date TEXT NOT NULL,
  quantity NUMERIC,
  price_per_unit NUMERIC,
  amount NUMERIC,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_investment_activities_user_updated ON investment_activities (user_id, updated_at);
CREATE INDEX idx_investment_activities_user_deleted ON investment_activities (user_id, deleted_at);
CREATE INDEX idx_investment_activities_wealth_account ON investment_activities (wealth_account_id);
CREATE INDEX idx_investment_activities_holding ON investment_activities (asset_holding_id);

ALTER TABLE investment_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own investment_activities" ON investment_activities FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own investment_activities" ON investment_activities FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own investment_activities" ON investment_activities FOR UPDATE USING (user_id = auth.uid());

-- ─── Internal Transfers ───────────────────────────────────
CREATE TABLE IF NOT EXISTS internal_transfers (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  from_type TEXT NOT NULL CHECK (from_type IN ('account', 'wealthAccount')),
  from_id TEXT NOT NULL,
  to_type TEXT NOT NULL CHECK (to_type IN ('account', 'wealthAccount')),
  to_id TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_internal_transfers_user_updated ON internal_transfers (user_id, updated_at);
CREATE INDEX idx_internal_transfers_user_deleted ON internal_transfers (user_id, deleted_at);
CREATE INDEX idx_internal_transfers_from ON internal_transfers (from_id);
CREATE INDEX idx_internal_transfers_to ON internal_transfers (to_id);

ALTER TABLE internal_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own internal_transfers" ON internal_transfers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own internal_transfers" ON internal_transfers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own internal_transfers" ON internal_transfers FOR UPDATE USING (user_id = auth.uid());
