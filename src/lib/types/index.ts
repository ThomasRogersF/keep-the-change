export interface Account {
  id: string;
  name: string;
  type: "main" | "external";
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  colorToken: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Merchant {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Transaction {
  id: string;
  date: Date;
  amount: number;
  type: "expense" | "income";
  categoryId?: string;
  merchantId?: string;
  accountId: string;
  note?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  cadence: "weekly" | "monthly" | "yearly";
  nextRenewalDate: Date;
  accountId: string;
  categoryId?: string;
  merchantId?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface IncomeEntry {
  id: string;
  month: string; // "YYYY-MM"
  source: string;
  amount: number;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  targetDate?: string; // YYYY-MM-DD
  accountId: string; // must reference a main account
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface GoalAllocation {
  id: string;
  goalId: string;
  date: string; // YYYY-MM-DD
  amount: number; // positive
  note?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface GoalSpendLink {
  id: string;
  goalId: string;
  transactionId: string;
  amountApplied: number; // positive
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TableSyncStats {
  pushed: number;
  pulled: number;
  conflictsResolved: number;
  error?: string;
}

export interface SyncSummary {
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;
  status: "ok" | "partial" | "error";
  tables: Record<string, TableSyncStats>;
  totalPushed: number;
  totalPulled: number;
}

export interface SyncState {
  userId: string;
  deviceId: string;
  initialSyncCompleted: boolean;
  /** Legacy globals — kept for backward compat / migration only */
  lastPushAt: Date | null;
  lastPullAt: Date | null;
  /** Per-table high-water marks (ISO strings) */
  lastPushAtByTable: Record<string, string | null>;
  lastPullAtByTable: Record<string, string | null>;
  /** Global display fields */
  lastSyncAt: Date | null;
  lastSyncStatus: "idle" | "syncing" | "success" | "partial" | "error";
  lastSyncError: string | null;
  lastSyncSummary: SyncSummary | null;
  /** Backoff */
  retryCount: number;
  nextRetryAt: Date | null;
  syncLog: SyncLogEntry[];
}

export interface SyncLogEntry {
  timestamp: Date;
  level: "info" | "warn" | "error";
  action: "push" | "pull" | "conflict" | "error";
  table: string;
  count: number;
  message?: string;
}
