import { db } from "./database";
import { format, subMonths, subDays, addDays } from "date-fns";
import { DEFAULT_CATEGORIES } from "@/lib/utils/constants";

export async function loadDemoData() {
  // Clear existing data
  await clearAllData();

  const now = new Date();
  const currentMonth = format(now, "yyyy-MM");
  const lastMonth = format(subMonths(now, 1), "yyyy-MM");
  const twoMonthsAgo = format(subMonths(now, 2), "yyyy-MM");

  // Create accounts
  const checkingId = crypto.randomUUID();
  const creditCardId = crypto.randomUUID();
  const investmentId = crypto.randomUUID();

  await db.accounts.bulkAdd([
    {
      id: checkingId,
      name: "Checking Account",
      type: "main",
      currency: "USD",
      createdAt: new Date(),
    },
    {
      id: creditCardId,
      name: "Credit Card",
      type: "main",
      currency: "USD",
      createdAt: new Date(),
    },
    {
      id: investmentId,
      name: "Investment Portfolio",
      type: "external",
      currency: "USD",
      createdAt: new Date(),
    },
  ]);

  // Create categories
  const categoryIds: Record<string, string> = {};
  const categoryRecords = DEFAULT_CATEGORIES.map((cat) => {
    const id = crypto.randomUUID();
    categoryIds[cat.name] = id;
    return {
      id,
      name: cat.name,
      icon: cat.icon,
      colorToken: cat.colorToken,
      createdAt: new Date(),
    };
  });
  await db.categories.bulkAdd(categoryRecords);

  // Create merchants
  const merchantNames = [
    "Whole Foods",
    "Amazon",
    "Uber",
    "Spotify",
    "Netflix",
    "Starbucks",
    "Target",
    "Shell Gas",
    "Electric Company",
    "Water Utility",
  ];
  const merchantIds: Record<string, string> = {};
  const merchantRecords = merchantNames.map((name) => {
    const id = crypto.randomUUID();
    merchantIds[name] = id;
    return { id, name, createdAt: new Date() };
  });
  await db.merchants.bulkAdd(merchantRecords);

  // Helper to generate transactions
  const txs: Array<{
    id: string;
    date: Date;
    amount: number;
    type: "expense" | "income";
    categoryId: string;
    merchantId?: string;
    accountId: string;
    note: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  const expenses = [
    { merchant: "Whole Foods", category: "Food & Dining", amounts: [85.32, 62.15, 94.50, 45.80, 73.25, 58.90, 110.00, 42.30, 88.75, 67.40] },
    { merchant: "Amazon", category: "Shopping", amounts: [29.99, 149.00, 24.95, 67.50, 39.99, 89.00] },
    { merchant: "Uber", category: "Transportation", amounts: [18.50, 24.00, 15.75, 32.00, 21.50, 28.00] },
    { merchant: "Starbucks", category: "Food & Dining", amounts: [5.75, 6.20, 4.95, 7.10, 5.50, 6.80] },
    { merchant: "Target", category: "Shopping", amounts: [45.60, 78.30, 34.20, 52.90] },
    { merchant: "Shell Gas", category: "Transportation", amounts: [52.00, 48.50, 55.00, 50.25] },
    { merchant: "Electric Company", category: "Utilities", amounts: [125.00, 118.50, 132.00] },
    { merchant: "Water Utility", category: "Utilities", amounts: [45.00, 42.00, 48.00] },
  ];

  let dayOffset = 0;
  for (const exp of expenses) {
    for (const amount of exp.amounts) {
      txs.push({
        id: crypto.randomUUID(),
        date: subDays(now, dayOffset),
        amount,
        type: "expense",
        categoryId: categoryIds[exp.category],
        merchantId: merchantIds[exp.merchant],
        accountId: dayOffset % 3 === 0 ? creditCardId : checkingId,
        note: `Purchase at ${exp.merchant}`,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      dayOffset += Math.floor(Math.random() * 3) + 1;
    }
  }

  // Add some housing expenses
  for (let i = 0; i < 3; i++) {
    const m = subMonths(now, i);
    txs.push({
      id: crypto.randomUUID(),
      date: new Date(m.getFullYear(), m.getMonth(), 1),
      amount: 1850.00,
      type: "expense",
      categoryId: categoryIds["Housing"],
      accountId: checkingId,
      note: "Monthly rent",
      tags: ["rent", "recurring"],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Entertainment expenses
  const entertainmentAmounts = [14.99, 22.50, 35.00, 12.99, 45.00, 19.99];
  entertainmentAmounts.forEach((amount, i) => {
    txs.push({
      id: crypto.randomUUID(),
      date: subDays(now, i * 5 + 2),
      amount,
      type: "expense",
      categoryId: categoryIds["Entertainment"],
      accountId: creditCardId,
      note: "Entertainment",
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  await db.transactions.bulkAdd(txs);

  // Create subscriptions
  const subs = [
    {
      name: "Netflix",
      amount: 15.99,
      cadence: "monthly" as const,
      nextRenewalDate: addDays(now, 5),
      merchantId: merchantIds["Netflix"],
      categoryId: categoryIds["Subscriptions"],
    },
    {
      name: "Spotify",
      amount: 9.99,
      cadence: "monthly" as const,
      nextRenewalDate: addDays(now, 12),
      merchantId: merchantIds["Spotify"],
      categoryId: categoryIds["Subscriptions"],
    },
    {
      name: "Adobe Creative Cloud",
      amount: 54.99,
      cadence: "monthly" as const,
      nextRenewalDate: addDays(now, 20),
      categoryId: categoryIds["Subscriptions"],
    },
    {
      name: "Gym Membership",
      amount: 49.99,
      cadence: "monthly" as const,
      nextRenewalDate: addDays(now, 3),
      categoryId: categoryIds["Health"],
    },
    {
      name: "Cloud Storage",
      amount: 99.99,
      cadence: "yearly" as const,
      nextRenewalDate: addDays(now, 45),
      categoryId: categoryIds["Subscriptions"],
    },
  ];

  await db.subscriptions.bulkAdd(
    subs.map((s) => ({
      id: crypto.randomUUID(),
      ...s,
      accountId: checkingId,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );

  // Create income entries
  const incomes = [
    { month: currentMonth, source: "Salary", amount: 6500.00, note: "Monthly salary" },
    { month: currentMonth, source: "Freelance", amount: 1200.00, note: "Client project" },
    { month: lastMonth, source: "Salary", amount: 6500.00, note: "Monthly salary" },
    { month: lastMonth, source: "Freelance", amount: 800.00, note: "Design work" },
    { month: twoMonthsAgo, source: "Salary", amount: 6500.00, note: "Monthly salary" },
    { month: twoMonthsAgo, source: "Side Project", amount: 450.00, note: "App sales" },
  ];

  await db.incomeEntries.bulkAdd(
    incomes.map((inc) => ({
      id: crypto.randomUUID(),
      ...inc,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );
}

export async function clearAllData() {
  await db.transactions.clear();
  await db.subscriptions.clear();
  await db.incomeEntries.clear();
  await db.merchants.clear();
  await db.categories.clear();
  await db.accounts.clear();
}

export async function exportAllData() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    accounts: await db.accounts.toArray(),
    categories: await db.categories.toArray(),
    merchants: await db.merchants.toArray(),
    transactions: await db.transactions.toArray(),
    subscriptions: await db.subscriptions.toArray(),
    incomeEntries: await db.incomeEntries.toArray(),
  };
  return JSON.stringify(data, null, 2);
}

export async function importData(jsonString: string) {
  const data = JSON.parse(jsonString);

  if (!data.version || !data.accounts) {
    throw new Error("Invalid data format");
  }

  await clearAllData();

  // Restore dates from ISO strings
  const parseDateFields = <T extends Record<string, unknown>>(
    items: T[],
    fields: string[]
  ): T[] =>
    items.map((item) => {
      const result = { ...item };
      for (const field of fields) {
        if (result[field] && typeof result[field] === "string") {
          (result as Record<string, unknown>)[field] = new Date(result[field] as string);
        }
      }
      return result;
    });

  await db.accounts.bulkAdd(
    parseDateFields(data.accounts, ["createdAt"])
  );
  await db.categories.bulkAdd(
    parseDateFields(data.categories, ["createdAt"])
  );
  await db.merchants.bulkAdd(
    parseDateFields(data.merchants, ["createdAt"])
  );
  await db.transactions.bulkAdd(
    parseDateFields(data.transactions, [
      "date",
      "createdAt",
      "updatedAt",
    ])
  );
  await db.subscriptions.bulkAdd(
    parseDateFields(data.subscriptions, [
      "nextRenewalDate",
      "createdAt",
      "updatedAt",
    ])
  );
  await db.incomeEntries.bulkAdd(
    parseDateFields(data.incomeEntries, ["createdAt", "updatedAt"])
  );
}
