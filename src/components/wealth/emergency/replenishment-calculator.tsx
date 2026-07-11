"use client";

import { useState } from "react";
import { addMonths, differenceInCalendarMonths, format } from "date-fns";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import {
  calculateReplenishmentContribution,
  calculateReplenishmentMonths,
} from "@/lib/services/emergency-fund-calculations.service";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ReplenishmentCalculatorProps {
  shortfall: number;
}

export function ReplenishmentCalculator({ shortfall }: ReplenishmentCalculatorProps) {
  const fmt = useCurrencyFormatter();
  const [monthlyContribution, setMonthlyContribution] = useState(0);
  const [targetDate, setTargetDate] = useState("");

  if (shortfall <= 0) {
    return (
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        You&apos;re already at or above your target — no replenishment needed.
      </div>
    );
  }

  const monthsToRestore = calculateReplenishmentMonths(shortfall, monthlyContribution);
  const monthsFromDate = targetDate
    ? Math.max(1, differenceInCalendarMonths(new Date(targetDate), new Date()))
    : 0;
  const suggestedContribution = targetDate
    ? calculateReplenishmentContribution(shortfall, monthsFromDate)
    : 0;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div>
        <h4 className="text-sm font-medium">Replenishment Calculator</h4>
        <p className="text-xs text-muted-foreground mt-0.5">
          Shortfall to restore: <span className="font-medium text-foreground">{fmt(shortfall)}</span>
        </p>
      </div>
      <Tabs defaultValue="byContribution">
        <TabsList>
          <TabsTrigger value="byContribution">By monthly amount</TabsTrigger>
          <TabsTrigger value="byDate">By target date</TabsTrigger>
        </TabsList>
        <TabsContent value="byContribution" className="space-y-2 pt-3">
          <Label htmlFor="monthlyContribution">Desired monthly contribution</Label>
          <Input
            id="monthlyContribution"
            type="number"
            step="0.01"
            min="0"
            value={monthlyContribution || ""}
            onChange={(e) => setMonthlyContribution(Number(e.target.value) || 0)}
          />
          {monthlyContribution > 0 && (
            <p className="text-sm text-muted-foreground">
              At {fmt(monthlyContribution)}/month, you&apos;ll restore your target in{" "}
              <span className="font-medium text-foreground">
                {Math.ceil(monthsToRestore)} month{Math.ceil(monthsToRestore) === 1 ? "" : "s"}
              </span>
              .
            </p>
          )}
        </TabsContent>
        <TabsContent value="byDate" className="space-y-2 pt-3">
          <Label htmlFor="targetRestoreDate">Target restore date</Label>
          <Input
            id="targetRestoreDate"
            type="date"
            min={format(addMonths(new Date(), 1), "yyyy-MM-dd")}
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
          {targetDate && (
            <p className="text-sm text-muted-foreground">
              You&apos;ll need to contribute{" "}
              <span className="font-medium text-foreground">{fmt(suggestedContribution)}/month</span>{" "}
              to restore your target by then.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
