"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/database";
import { format, subMonths } from "date-fns";

interface DashboardData {
  totalExpenses: number;
  totalIncome: number;
  net: number;
  upcomingSubscriptions: Array<{
    id: string;
    name: string;
    amount: number;
    nextRenewalDate: Date;
  }>;
  categoryBreakdown: Array<{
    categoryId: string;
    name: string;
    colorToken: string;
    total: number;
  }>;
  recentTransactions: Array<{
    id: string;
    date: Date;
    amount: number;
    type: "expense" | "income";
    categoryId?: string;
    accountId: string;
    note?: string;
  }>;
  monthlyTrend: Array<{
    month: string;
    label: string;
    expenses: number;
    income: number;
  }>;
}

const defaultData: DashboardData = {
  totalExpenses: 0,
  totalIncome: 0,
  net: 0,
  upcomingSubscriptions: [],
  categoryBreakdown: [],
  recentTransactions: [],
  monthlyTrend: [],
};

export function useDashboard(month: string) {
  return useLiveQuery(
    async (): Promise<DashboardData> => {
      const [year, mon] = month.split("-").map(Number);
      const startOfMonth = new Date(year, mon - 1, 1);
      const endOfMonth = new Date(year, mon, 0, 23, 59, 59);

      // Get main account IDs
      const mainAccounts = await db.accounts
        .where("type")
        .equals("main")
        .toArray();
      const mainAccountIds = new Set(mainAccounts.map((a) => a.id));

      // Expenses from main accounts this month
      const allTxThisMonth = await db.transactions
        .where("date")
        .between(startOfMonth, endOfMonth, true, true)
        .toArray();

      const mainExpenses = allTxThisMonth.filter(
        (t) => t.type === "expense" && mainAccountIds.has(t.accountId)
      );
      const totalExpenses = mainExpenses.reduce(
        (sum, t) => sum + t.amount,
        0
      );

      // Income from IncomeEntry
      const incomeEntries = await db.incomeEntries
        .where("month")
        .equals(month)
        .toArray();
      const totalIncome = incomeEntries.reduce(
        (sum, e) => sum + e.amount,
        0
      );

      // Upcoming subscriptions (next 30 days from now)
      const now = new Date();
      const thirtyDaysFromNow = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000
      );
      const allSubs = await db.subscriptions.toArray();
      const upcomingSubscriptions = allSubs
        .filter(
          (s) =>
            s.active &&
            s.nextRenewalDate >= now &&
            s.nextRenewalDate <= thirtyDaysFromNow
        )
        .sort(
          (a, b) =>
            a.nextRenewalDate.getTime() - b.nextRenewalDate.getTime()
        )
        .map((s) => ({
          id: s.id,
          name: s.name,
          amount: s.amount,
          nextRenewalDate: s.nextRenewalDate,
        }));

      // Category breakdown
      const categories = await db.categories.toArray();
      const categoryMap = new Map(categories.map((c) => [c.id, c]));
      const catTotals = new Map<string, number>();
      for (const exp of mainExpenses) {
        if (exp.categoryId) {
          catTotals.set(
            exp.categoryId,
            (catTotals.get(exp.categoryId) || 0) + exp.amount
          );
        }
      }
      const categoryBreakdown = Array.from(catTotals.entries())
        .map(([categoryId, total]) => {
          const cat = categoryMap.get(categoryId);
          return {
            categoryId,
            name: cat?.name || "Unknown",
            colorToken: cat?.colorToken || "chart-1",
            total,
          };
        })
        .sort((a, b) => b.total - a.total);

      // Recent transactions (last 5 from main accounts)
      const allTx = await db.transactions
        .orderBy("date")
        .reverse()
        .toArray();
      const recentTransactions = allTx
        .filter((t) => mainAccountIds.has(t.accountId))
        .slice(0, 5)
        .map((t) => ({
          id: t.id,
          date: t.date,
          amount: t.amount,
          type: t.type,
          categoryId: t.categoryId,
          accountId: t.accountId,
          note: t.note,
        }));

      // Monthly trend (6 months)
      const monthlyTrend: DashboardData["monthlyTrend"] = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(year, mon - 1, 1), i);
        const m = format(d, "yyyy-MM");
        const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

        const txInMonth = await db.transactions
          .where("date")
          .between(mStart, mEnd, true, true)
          .toArray();

        const expenses = txInMonth
          .filter(
            (t) => t.type === "expense" && mainAccountIds.has(t.accountId)
          )
          .reduce((s, t) => s + t.amount, 0);

        const incEntries = await db.incomeEntries
          .where("month")
          .equals(m)
          .toArray();
        const income = incEntries.reduce((s, e) => s + e.amount, 0);

        monthlyTrend.push({
          month: m,
          label: format(d, "MMM"),
          expenses,
          income,
        });
      }

      return {
        totalExpenses,
        totalIncome,
        net: totalIncome - totalExpenses,
        upcomingSubscriptions,
        categoryBreakdown,
        recentTransactions,
        monthlyTrend,
      };
    },
    [month],
    defaultData
  );
}
