"use client";

import { useState } from "react";
import { Target, PiggyBank, TrendingDown, Hash, Info } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { GoalCard } from "@/components/goals/goal-card";
import { GoalForm } from "@/components/goals/goal-form";
import { AllocationForm } from "@/components/goals/allocation-form";
import { SpendLinkForm } from "@/components/goals/spend-link-form";
import { EmptyState } from "@/components/shared/empty-state";
import { useGoals, useArchivedGoals, useGoalsSummary } from "@/lib/hooks/use-goals";
import { useUIStore } from "@/lib/stores/ui.store";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import { goalRepository } from "@/lib/db/repositories/goal.repository";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function GoalsPage() {
  const openModal = useUIStore((s) => s.openModal);
  const goals = useGoals();
  const archivedGoals = useArchivedGoals();
  const summary = useGoalsSummary();
  const fmt = useCurrencyFormatter();
  const [showArchived, setShowArchived] = useState(false);

  // Allocation form state
  const [allocGoalId, setAllocGoalId] = useState<string | null>(null);
  const [allocOpen, setAllocOpen] = useState(false);

  // Spend link form state
  const [linkGoalId, setLinkGoalId] = useState<string | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);

  const handleAddContribution = (goalId: string) => {
    setAllocGoalId(goalId);
    setAllocOpen(true);
  };

  const handleLinkPurchase = (goalId: string) => {
    setLinkGoalId(goalId);
    setLinkOpen(true);
  };

  const handleEdit = (goalId: string) => {
    openModal("goal", "edit", goalId);
  };

  const handleArchive = async (goalId: string) => {
    try {
      await goalRepository.archive(goalId);
      toast.success("Goal archived");
    } catch {
      toast.error("Failed to archive goal");
    }
  };

  const hasGoals = goals.length > 0 || archivedGoals.length > 0;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <PageHeader
        title="Goals"
        subtitle="Save towards the things that matter"
        action={
          <Button onClick={() => openModal("goal", "create")}>
            New Goal
          </Button>
        }
      />

      {/* Info tooltip */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Info className="w-3.5 h-3.5" />
              How do goals work?
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="text-xs">
              Goals are virtual allocations. Your bank balance doesn&apos;t change — Ledgerly
              simply earmarks money for your priorities.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {hasGoals ? (
        <>
          {/* Summary strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Total Saved"
              value={fmt(summary.totalSaved)}
              icon={PiggyBank}
              trend="up"
            />
            <StatCard
              title="Remaining"
              value={fmt(Math.max(0, summary.totalRemaining))}
              icon={TrendingDown}
            />
            <StatCard
              title="Active Goals"
              value={`${summary.activeCount}`}
              icon={Hash}
            />
          </div>

          {/* Goals grid */}
          {goals.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onAddContribution={handleAddContribution}
                  onLinkPurchase={handleLinkPurchase}
                  onEdit={handleEdit}
                  onArchive={handleArchive}
                />
              ))}
            </div>
          )}

          {/* Archived section */}
          {archivedGoals.length > 0 && (
            <div className="space-y-3 pt-4">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>Archived</span>
                <Badge variant="secondary" className="text-xs">
                  {archivedGoals.length}
                </Badge>
              </button>
              {showArchived && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {archivedGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onAddContribution={() => {}}
                      onLinkPurchase={() => {}}
                      onEdit={() => {}}
                      onArchive={() => {}}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Create your first goal to start saving towards the things that matter."
          action={{
            label: "Create a Goal",
            onClick: () => openModal("goal", "create"),
          }}
        />
      )}

      {/* Forms */}
      <GoalForm />
      <AllocationForm
        goalId={allocGoalId}
        open={allocOpen}
        onOpenChange={setAllocOpen}
      />
      <SpendLinkForm
        goalId={linkGoalId}
        open={linkOpen}
        onOpenChange={setLinkOpen}
      />
    </div>
  );
}
