"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import {
  calculateHoldingValue,
  calculateUnrealizedGain,
  calculatePortfolioAllocation,
} from "@/lib/services/investment-calculations.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AssetHolding } from "@/lib/types";

interface HoldingsTableProps {
  holdings: AssetHolding[];
  accountNameById: Record<string, string>;
}

export function HoldingsTable({ holdings, accountNameById }: HoldingsTableProps) {
  const fmt = useCurrencyFormatter();
  const active = holdings.filter((h) => h.quantity > 0);
  const allocation = calculatePortfolioAllocation(active);
  const allocationBySymbol = new Map(allocation.map((a) => [a.symbol, a.percent]));

  if (active.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No holdings yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Asset</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead className="text-right">Avg Cost</TableHead>
          <TableHead className="text-right">Current Price</TableHead>
          <TableHead className="text-right">Cost Basis</TableHead>
          <TableHead className="text-right">Current Value</TableHead>
          <TableHead className="text-right">Gain/Loss</TableHead>
          <TableHead className="text-right">Allocation</TableHead>
          <TableHead>Account</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {active.map((holding) => {
          const value = calculateHoldingValue(holding);
          const { amount: gain, percent: gainPercent } = calculateUnrealizedGain(holding);
          const avgCost = holding.quantity > 0 ? holding.costBasisTotal / holding.quantity : 0;
          const isPositive = gain >= 0;
          return (
            <TableRow key={holding.id}>
              <TableCell>
                <Link
                  href={`/wealth/investments/${holding.id}`}
                  className="hover:text-primary transition-colors"
                >
                  <div className="font-medium">{holding.symbol}</div>
                  {holding.name && <div className="text-xs text-muted-foreground">{holding.name}</div>}
                </Link>
              </TableCell>
              <TableCell className="capitalize text-muted-foreground">{holding.assetType}</TableCell>
              <TableCell className="text-right tabular-nums">{holding.quantity}</TableCell>
              <TableCell className="text-right tabular-nums">{fmt(avgCost)}</TableCell>
              <TableCell className="text-right tabular-nums">{fmt(holding.currentPricePerUnit)}</TableCell>
              <TableCell className="text-right tabular-nums">{fmt(holding.costBasisTotal)}</TableCell>
              <TableCell className="text-right tabular-nums font-medium">{fmt(value)}</TableCell>
              <TableCell
                className={cn(
                  "text-right tabular-nums",
                  isPositive ? "text-success" : "text-destructive"
                )}
              >
                {isPositive ? "+" : ""}
                {fmt(gain)} ({gainPercent.toFixed(1)}%)
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {(allocationBySymbol.get(holding.symbol) ?? 0).toFixed(1)}%
              </TableCell>
              <TableCell className="text-muted-foreground">
                {accountNameById[holding.wealthAccountId] ?? "—"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
