import { db } from "./database";
import { format, subMonths, subDays, addDays, addMonths } from "date-fns";
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
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: creditCardId,
      name: "Credit Card",
      type: "main",
      currency: "USD",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: investmentId,
      name: "Investment Portfolio",
      type: "external",
      currency: "USD",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
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
      updatedAt: new Date(),
      deletedAt: null,
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
    return { id, name, createdAt: new Date(), updatedAt: new Date(), deletedAt: null };
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
    deletedAt: null;
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
        deletedAt: null,
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
      deletedAt: null,
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
      deletedAt: null,
    });
  });

  // Track a specific Amazon purchase for goal-linking
  const laptopPurchaseTxId = crypto.randomUUID();
  txs.push({
    id: laptopPurchaseTxId,
    date: subDays(now, 3),
    amount: 89.99,
    type: "expense",
    categoryId: categoryIds["Shopping"],
    merchantId: merchantIds["Amazon"],
    accountId: checkingId,
    note: "Laptop accessories (linked to goal)",
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
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
      deletedAt: null,
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
      deletedAt: null,
    }))
  );

  // ─── Goals ─────────────────────────────────────────────
  const laptopGoalId = crypto.randomUUID();
  const emergencyGoalId = crypto.randomUUID();
  const vacationGoalId = crypto.randomUUID();

  await db.goals.bulkAdd([
    {
      id: laptopGoalId,
      name: "New Laptop",
      targetAmount: 1500,
      targetDate: format(addMonths(now, 3), "yyyy-MM-dd"),
      accountId: checkingId,
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: emergencyGoalId,
      name: "Emergency Fund",
      targetAmount: 5000,
      accountId: checkingId,
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: vacationGoalId,
      name: "Vacation",
      targetAmount: 3000,
      targetDate: format(addMonths(now, 6), "yyyy-MM-dd"),
      accountId: checkingId,
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ]);

  // Goal allocations
  await db.goalAllocations.bulkAdd([
    { id: crypto.randomUUID(), goalId: laptopGoalId, date: format(subDays(now, 60), "yyyy-MM-dd"), amount: 200, note: "Initial savings", createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    { id: crypto.randomUUID(), goalId: laptopGoalId, date: format(subDays(now, 30), "yyyy-MM-dd"), amount: 250, note: "Monthly contribution", createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    { id: crypto.randomUUID(), goalId: laptopGoalId, date: format(subDays(now, 5), "yyyy-MM-dd"), amount: 350, note: "Bonus allocation", createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    { id: crypto.randomUUID(), goalId: emergencyGoalId, date: format(subDays(now, 90), "yyyy-MM-dd"), amount: 500, note: "Starting emergency fund", createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    { id: crypto.randomUUID(), goalId: emergencyGoalId, date: format(subDays(now, 60), "yyyy-MM-dd"), amount: 500, note: "Monthly contribution", createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    { id: crypto.randomUUID(), goalId: emergencyGoalId, date: format(subDays(now, 30), "yyyy-MM-dd"), amount: 600, note: "Extra from freelance", createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    { id: crypto.randomUUID(), goalId: emergencyGoalId, date: format(subDays(now, 3), "yyyy-MM-dd"), amount: 600, note: "Monthly contribution", createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    { id: crypto.randomUUID(), goalId: vacationGoalId, date: format(subDays(now, 45), "yyyy-MM-dd"), amount: 300, note: "Trip planning savings", createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    { id: crypto.randomUUID(), goalId: vacationGoalId, date: format(subDays(now, 10), "yyyy-MM-dd"), amount: 300, note: "Monthly contribution", createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
  ]);

  // One GoalSpendLink: link the Amazon laptop accessory purchase to "New Laptop" goal
  await db.goalSpendLinks.bulkAdd([
    {
      id: crypto.randomUUID(),
      goalId: laptopGoalId,
      transactionId: laptopPurchaseTxId,
      amountApplied: 89.99,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ]);
}

export async function clearAllData() {
  await db.transactions.clear();
  await db.subscriptions.clear();
  await db.incomeEntries.clear();
  await db.merchants.clear();
  await db.categories.clear();
  await db.accounts.clear();
  await db.goals.clear();
  await db.goalAllocations.clear();
  await db.goalSpendLinks.clear();
}

export async function exportAllData() {
  // Tombstones (deletedAt != null) MUST be included. Omitting them lets a stale
  // backup re-create deleted records: importData() bumps updatedAt to "now" on
  // every imported row, so a deleted record that's absent from the export would
  // be re-added as active with a fresh timestamp and — via last-write-wins sync
  // (sync-engine.ts:429) — overwrite the older cloud tombstone, resurrecting it
  // on every device. Exporting the tombstone keeps the deletion propagating.
  const data = {
    version: 3,
    exportedAt: new Date().toISOString(),
    accounts: await db.accounts.toArray(),
    categories: await db.categories.toArray(),
    merchants: await db.merchants.toArray(),
    transactions: await db.transactions.toArray(),
    subscriptions: await db.subscriptions.toArray(),
    incomeEntries: await db.incomeEntries.toArray(),
    goals: await db.goals.toArray(),
    goalAllocations: await db.goalAllocations.toArray(),
    goalSpendLinks: await db.goalSpendLinks.toArray(),
  };
  return JSON.stringify(data, null, 2);
}

export async function importData(jsonString: string) {
  const data = JSON.parse(jsonString);

  if (!data.version || !data.accounts) {
    throw new Error("Invalid data format");
  }

  await clearAllData();

  const now = new Date();

  // Restore dates from ISO strings and ensure sync-compatible fields
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
      // Ensure sync-compatible fields exist
      if (!result.updatedAt) (result as Record<string, unknown>).updatedAt = now;
      if (result.deletedAt === undefined) (result as Record<string, unknown>).deletedAt = null;
      return result;
    });

  await db.accounts.bulkAdd(
    parseDateFields(data.accounts, ["createdAt", "updatedAt", "deletedAt"])
  );
  await db.categories.bulkAdd(
    parseDateFields(data.categories, ["createdAt", "updatedAt", "deletedAt"])
  );
  await db.merchants.bulkAdd(
    parseDateFields(data.merchants, ["createdAt", "updatedAt", "deletedAt"])
  );
  await db.transactions.bulkAdd(
    parseDateFields(data.transactions, [
      "date",
      "createdAt",
      "updatedAt",
      "deletedAt",
    ])
  );
  await db.subscriptions.bulkAdd(
    parseDateFields(data.subscriptions, [
      "nextRenewalDate",
      "createdAt",
      "updatedAt",
      "deletedAt",
    ])
  );
  await db.incomeEntries.bulkAdd(
    parseDateFields(data.incomeEntries, ["createdAt", "updatedAt", "deletedAt"])
  );

  // Import goals data (version 2+)
  if (data.version >= 2) {
    if (data.goals?.length) {
      await db.goals.bulkAdd(
        parseDateFields(data.goals, ["createdAt", "updatedAt", "deletedAt"])
      );
    }
    if (data.goalAllocations?.length) {
      await db.goalAllocations.bulkAdd(
        parseDateFields(data.goalAllocations, ["createdAt", "updatedAt", "deletedAt"])
      );
    }
    if (data.goalSpendLinks?.length) {
      await db.goalSpendLinks.bulkAdd(
        parseDateFields(data.goalSpendLinks, ["createdAt", "updatedAt", "deletedAt"])
      );
    }
  }

  // Bump updatedAt on all imported records so they push on next sync
  const allTables = [
    "accounts", "categories", "merchants",
    "transactions", "subscriptions", "incomeEntries",
    "goals", "goalAllocations", "goalSpendLinks",
  ] as const;
  for (const tableName of allTables) {
    await db.table(tableName).toCollection().modify({ updatedAt: now });
  }
}
