"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Target, Calendar, MoreHorizontal, Plus, LinkIcon, Pencil, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { FintechCard } from "@/components/ui/fintech-card";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import { useGoalProgress } from "@/lib/hooks/use-goals";
import { GoalProgressBar } from "./goal-progress-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Goal } from "@/lib/types";

interface GoalCardProps {
  goal: Goal;
  onAddContribution: (goalId: string) => void;
  onLinkPurchase: (goalId: string) => void;
  onEdit: (goalId: string) => void;
  onArchive: (goalId: string) => void;
}

export function GoalCard({
  goal,
  onAddContribution,
  onLinkPurchase,
  onEdit,
  onArchive,
}: GoalCardProps) {
  const fmt = useCurrencyFormatter();
  const progress = useGoalProgress(goal.id);

  return (
    <FintechCard className="p-5 space-y-4 hover:border-finance-goals/20 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <Link href={`/goals/${goal.id}`} className="flex items-center gap-3 min-w-0 group">
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full shrink-0",
            goal.archived ? "bg-muted text-muted-foreground" : "bg-finance-goals/10 text-finance-goals"
          )}>
            <Target className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate group-hover:text-finance-goals transition-colors">
              {goal.name}
            </h3>
            {goal.targetDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Calendar className="w-3 h-3" />
                <span>Target by {format(new Date(goal.targetDate), "MMM yyyy")}</span>
              </div>
            )}
          </div>
        </Link>

        <div className="flex items-center gap-1 shrink-0">
          {goal.archived ? (
            <Badge variant="secondary" className="text-xs">Archived</Badge>
          ) : progress.isOverfunded ? (
            <Badge className="bg-success/10 text-success border-success/20 text-xs">Overfunded</Badge>
          ) : null}

          {!goal.archived && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onAddContribution(goal.id)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contribution
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onLinkPurchase(goal.id)}>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Link Purchase
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(goal.id)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onArchive(goal.id)}>
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <GoalProgressBar percent={progress.percent} isOverfunded={progress.isOverfunded} />
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium tabular-nums text-foreground/90">
            {fmt(progress.saved)}
            <span className="text-xs text-muted-foreground ml-1.5 font-normal tracking-tight">
              ({progress.percent.toFixed(0)}%)
            </span>
          </span>
          <span className="text-muted-foreground tabular-nums">
            of {fmt(goal.targetAmount)}
          </span>
        </div>
      </div>

      {/* Quick actions */}
      {!goal.archived && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => onAddContribution(goal.id)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Contribute
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => onLinkPurchase(goal.id)}
          >
            <LinkIcon className="w-3.5 h-3.5 mr-1" />
            Link
          </Button>
        </div>
      )}
    </FintechCard>
  );
}
