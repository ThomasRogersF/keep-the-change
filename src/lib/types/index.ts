export interface Account {
  id: string;
  name: string;
  type: "main" | "external";
  currency: string;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  colorToken: string;
  createdAt: Date;
}

export interface Merchant {
  id: string;
  name: string;
  createdAt: Date;
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
}

export interface IncomeEntry {
  id: string;
  month: string; // "YYYY-MM"
  source: string;
  amount: number;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}
