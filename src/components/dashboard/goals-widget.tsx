"use client";

import Link from "next/link";
import { Target, ArrowRight, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useGoalsSummary, useGoals } from "@/lib/hooks/use-goals";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import { GoalProgressBar } from "@/components/goals/goal-progress-bar";
import { format } from "date-fns";

export function GoalsWidget() {
  const summary = useGoalsSummary();
  const goals = useGoals();
  const fmt = useCurrencyFormatter();

  if (summary.activeCount === 0) return null;

  // Find the goal with closest target date
  const goalsWithDate = goals
    .filter((g) => g.targetDate && !g.archived)
    .sort((a, b) => (a.targetDate || "").localeCompare(b.targetDate || ""));
  const nextDueGoal = goalsWithDate[0];

  const overallPercent =
    summary.totalTarget > 0
      ? Math.min((summary.totalSaved / summary.totalTarget) * 100, 100)
      : 0;

  return (
    <Link href="/goals" className="block">
      <Card className="transition-colors hover:border-primary/20">
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Goals</p>
                <p className="text-xs text-muted-foreground">
                  {fmt(summary.totalSaved)} saved across {summary.activeCount} goal{summary.activeCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>

          <GoalProgressBar percent={overallPercent} size="sm" />

          {nextDueGoal && nextDueGoal.targetDate && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>
                Next: {nextDueGoal.name} by{" "}
                {format(new Date(nextDueGoal.targetDate), "MMM yyyy")}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
