-- Cloud Sync v1: Create sync tables mirroring local Dexie schema
-- All tables use TEXT primary keys (matching local UUIDs)
-- RLS enabled with user_id-based policies

-- ─── Accounts ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('main', 'external')),
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_accounts_user_updated ON accounts (user_id, updated_at);
CREATE INDEX idx_accounts_user_deleted ON accounts (user_id, deleted_at);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accounts" ON accounts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own accounts" ON accounts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own accounts" ON accounts FOR UPDATE USING (user_id = auth.uid());

-- ─── Categories ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_categories_user_updated ON categories (user_id, updated_at);
CREATE INDEX idx_categories_user_deleted ON categories (user_id, deleted_at);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories" ON categories FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own categories" ON categories FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own categories" ON categories FOR UPDATE USING (user_id = auth.uid());

-- ─── Merchants ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS merchants (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_merchants_user_updated ON merchants (user_id, updated_at);
CREATE INDEX idx_merchants_user_deleted ON merchants (user_id, deleted_at);

ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own merchants" ON merchants FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own merchants" ON merchants FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own merchants" ON merchants FOR UPDATE USING (user_id = auth.uid());

-- ─── Transactions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  category_id TEXT,
  merchant_id TEXT,
  account_id TEXT NOT NULL,
  note TEXT,
  tags JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_transactions_user_updated ON transactions (user_id, updated_at);
CREATE INDEX idx_transactions_user_deleted ON transactions (user_id, deleted_at);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (user_id = auth.uid());

-- ─── Subscriptions ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  cadence TEXT NOT NULL CHECK (cadence IN ('weekly', 'monthly', 'yearly')),
  next_renewal_date DATE NOT NULL,
  account_id TEXT NOT NULL,
  category_id TEXT,
  merchant_id TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_subscriptions_user_updated ON subscriptions (user_id, updated_at);
CREATE INDEX idx_subscriptions_user_deleted ON subscriptions (user_id, deleted_at);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own subscriptions" ON subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own subscriptions" ON subscriptions FOR UPDATE USING (user_id = auth.uid());

-- ─── Income Entries ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS income_entries (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  source TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_income_entries_user_updated ON income_entries (user_id, updated_at);
CREATE INDEX idx_income_entries_user_deleted ON income_entries (user_id, deleted_at);

ALTER TABLE income_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own income_entries" ON income_entries FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own income_entries" ON income_entries FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own income_entries" ON income_entries FOR UPDATE USING (user_id = auth.uid());

-- ─── Goals ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  target_date TEXT,
  account_id TEXT NOT NULL,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_goals_user_updated ON goals (user_id, updated_at);
CREATE INDEX idx_goals_user_deleted ON goals (user_id, deleted_at);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals" ON goals FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own goals" ON goals FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own goals" ON goals FOR UPDATE USING (user_id = auth.uid());

-- ─── Goal Allocations ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS goal_allocations (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id TEXT NOT NULL,
  date TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_goal_allocations_user_updated ON goal_allocations (user_id, updated_at);
CREATE INDEX idx_goal_allocations_user_deleted ON goal_allocations (user_id, deleted_at);

ALTER TABLE goal_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goal_allocations" ON goal_allocations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own goal_allocations" ON goal_allocations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own goal_allocations" ON goal_allocations FOR UPDATE USING (user_id = auth.uid());

-- ─── Goal Spend Links ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS goal_spend_links (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  amount_applied NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_goal_spend_links_user_updated ON goal_spend_links (user_id, updated_at);
CREATE INDEX idx_goal_spend_links_user_deleted ON goal_spend_links (user_id, deleted_at);

ALTER TABLE goal_spend_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goal_spend_links" ON goal_spend_links FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own goal_spend_links" ON goal_spend_links FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own goal_spend_links" ON goal_spend_links FOR UPDATE USING (user_id = auth.uid());
