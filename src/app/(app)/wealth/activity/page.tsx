"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { WealthActivityList } from "@/components/wealth/shared/wealth-activity-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import { useWealthAccounts } from "@/lib/hooks/use-wealth-accounts";
import { useWealthActivityFeed } from "@/lib/hooks/use-wealth-overview";
import type { WealthActivityKind } from "@/lib/services/wealth-net-worth.service";
import { cn } from "@/lib/utils";

const QUICK_FILTERS: Record<string, WealthActivityKind[]> = {
  emergency: ["emergency_contribution", "emergency_withdrawal"],
  investments: ["investment_buy", "investment_sell", "investment_dividend", "investment_fee", "investment_price_update"],
  savings: ["yield_rate_change"],
};

export default function WealthActivityPage() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const fmt = useCurrencyFormatter();
  const accounts = useWealthAccounts() ?? [];

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [accountId, setAccountId] = useState<string>("all");
  const [quickFilter, setQuickFilter] = useState<string | null>(null);

  const kinds = quickFilter ? QUICK_FILTERS[quickFilter] : undefined;

  const activity = useWealthActivityFeed({
    from: from || undefined,
    to: to || undefined,
    wealthAccountId: accountId === "all" ? undefined : accountId,
    kinds,
  });

  const accountNameById = useMemo(
    () => Object.fromEntries(accounts.map((a) => [a.id, a.name])),
    [accounts]
  );

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <PageHeader title="Wealth Activity" subtitle="Every contribution, trade, and transfer in one timeline" />

      <div className="rounded-xl border bg-card p-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="activityFrom" className="text-xs">From</Label>
            <Input id="activityFrom" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="activityTo" className="text-xs">To</Label>
            <Input id="activityTo" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <Label className="text-xs">Account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["emergency", "investments", "savings"] as const).map((key) => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={quickFilter === key ? "default" : "outline"}
              className="capitalize"
              onClick={() => setQuickFilter(quickFilter === key ? null : key)}
            >
              {key} only
            </Button>
          ))}
          {(from || to || accountId !== "all" || quickFilter) && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setFrom("");
                setTo("");
                setAccountId("all");
                setQuickFilter(null);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        {isDesktop ? (
          activity.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No activity matches these filters.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activity.map((item) => (
                  <TableRow key={`${item.sourceTable}-${item.id}`}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{item.date}</TableCell>
                    <TableCell>
                      <div className="font-medium">{item.label}</div>
                      {item.detail && <div className="text-xs text-muted-foreground">{item.detail}</div>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.accountId ? accountNameById[item.accountId] ?? "—" : "—"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums",
                        item.kind === "emergency_contribution" ||
                          item.kind === "investment_dividend" ||
                          item.kind === "investment_sell"
                          ? "text-success"
                          : "text-foreground"
                      )}
                    >
                      {item.kind === "investment_price_update" || item.kind === "yield_rate_change"
                        ? "—"
                        : fmt(item.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        ) : (
          <div className="p-2">
            <WealthActivityList items={activity} emptyMessage="No activity matches these filters." />
          </div>
        )}
      </div>
    </div>
  );
}
