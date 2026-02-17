"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Plus,
  LinkIcon,
  Calendar,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  Target,
} from "lucide-react";
import { useGoal, useGoalProgress } from "@/lib/hooks/use-goals";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import { GoalProgressBar } from "@/components/goals/goal-progress-bar";
import { GoalActivityList } from "@/components/goals/goal-activity-list";
import { AllocationForm } from "@/components/goals/allocation-form";
import { SpendLinkForm } from "@/components/goals/spend-link-form";
import { GoalForm } from "@/components/goals/goal-form";
import { useUIStore } from "@/lib/stores/ui.store";
import { goalRepository } from "@/lib/db/repositories/goal.repository";
import { deleteGoalCascade } from "@/lib/services/goal.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const goalId = params.id as string;
  const goal = useGoal(goalId);
  const progress = useGoalProgress(goalId);
  const fmt = useCurrencyFormatter();
  const openModal = useUIStore((s) => s.openModal);

  // Allocation form
  const [allocOpen, setAllocOpen] = useState(false);
  const [allocEditId, setAllocEditId] = useState<string | undefined>();

  // Spend link form
  const [linkOpen, setLinkOpen] = useState(false);

  if (!goal) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Goal not found</p>
      </div>
    );
  }

  const handleArchive = async () => {
    try {
      if (goal.archived) {
        await goalRepository.unarchive(goalId);
        toast.success("Goal restored");
      } else {
        await goalRepository.archive(goalId);
        toast.success("Goal archived");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGoalCascade(goalId);
      toast.success("Goal deleted");
      router.push("/goals");
    } catch {
      toast.error("Failed to delete goal");
    }
  };

  const handleEditAllocation = (id: string) => {
    setAllocEditId(id);
    setAllocOpen(true);
  };

  const handleNewAllocation = () => {
    setAllocEditId(undefined);
    setAllocOpen(true);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Back link */}
      <Link
        href="/goals"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Goals
      </Link>

      {/* Goal header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center justify-center w-12 h-12 rounded-full shrink-0",
                goal.archived ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
              )}
            >
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{goal.name}</h1>
                {goal.archived && <Badge variant="secondary">Archived</Badge>}
                {progress.isOverfunded && (
                  <Badge className="bg-success/10 text-success border-success/20">Overfunded</Badge>
                )}
              </div>
              {goal.targetDate && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Target by {format(new Date(goal.targetDate), "MMMM d, yyyy")}</span>
                </div>
              )}
            </div>
          </div>

          {!goal.archived && (
            <div className="flex gap-2 shrink-0">
              <Button size="sm" onClick={handleNewAllocation}>
                <Plus className="w-4 h-4 mr-1" />
                Contribute
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLinkOpen(true)}
              >
                <LinkIcon className="w-4 h-4 mr-1" />
                Link
              </Button>
            </div>
          )}
        </div>

        {/* Progress section */}
        <div className="space-y-3">
          <GoalProgressBar percent={progress.percent} isOverfunded={progress.isOverfunded} />
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Saved</p>
              <p className="text-lg font-semibold tabular-nums text-success">
                {fmt(progress.saved)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-lg font-semibold tabular-nums">
                {fmt(Math.max(0, progress.remaining))}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Target</p>
              <p className="text-lg font-semibold tabular-nums">
                {fmt(goal.targetAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <div className="rounded-xl border bg-card">
            <GoalActivityList
              goalId={goalId}
              archived={goal.archived}
              onEditAllocation={handleEditAllocation}
            />
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="rounded-xl border bg-card p-5 space-y-6 max-w-lg">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Goal Settings</h3>

              <Button
                variant="outline"
                size="sm"
                onClick={() => openModal("goal", "edit", goalId)}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit Goal
              </Button>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h3 className="text-sm font-medium">Actions</h3>

              <Button
                variant="outline"
                size="sm"
                onClick={handleArchive}
              >
                {goal.archived ? (
                  <>
                    <ArchiveRestore className="w-4 h-4 mr-2" />
                    Restore Goal
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4 mr-2" />
                    Archive Goal
                  </>
                )}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Goal
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this goal?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the goal along with all its
                      contributions and linked purchases. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Delete Goal
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Forms */}
      <GoalForm />
      <AllocationForm
        goalId={goalId}
        editId={allocEditId}
        open={allocOpen}
        onOpenChange={(open) => {
          setAllocOpen(open);
          if (!open) setAllocEditId(undefined);
        }}
      />
      <SpendLinkForm
        goalId={goalId}
        open={linkOpen}
        onOpenChange={setLinkOpen}
      />
    </div>
  );
}
