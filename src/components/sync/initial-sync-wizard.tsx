"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, Download, GitMerge, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/use-auth";
import {
  getLocalDataCounts,
  getRemoteDataCounts,
  initialSyncKeepLocal,
  initialSyncUseCloud,
  initialSyncMerge,
} from "@/lib/sync/initial-sync";

type WizardState = "choosing" | "confirming" | "syncing" | "done" | "error";
type SyncStrategy = "keep-local" | "use-cloud" | "merge";

interface InitialSyncWizardProps {
  open: boolean;
  onClose: () => void;
}

export function InitialSyncWizard({ open, onClose }: InitialSyncWizardProps) {
  const { user } = useAuth();
  const [state, setState] = useState<WizardState>("choosing");
  const [strategy, setStrategy] = useState<SyncStrategy | null>(null);
  const [localCounts, setLocalCounts] = useState<Record<string, number>>({});
  const [remoteCounts, setRemoteCounts] = useState<Record<string, number>>({});
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (open && user) {
      getLocalDataCounts().then(setLocalCounts);
      getRemoteDataCounts(user.id).then(setRemoteCounts);
    }
  }, [open, user]);

  const totalLocal = Object.values(localCounts).reduce((s, n) => s + n, 0);
  const totalRemote = Object.values(remoteCounts).reduce((s, n) => s + n, 0);

  const handleChoose = useCallback((s: SyncStrategy) => {
    setStrategy(s);
    if (s === "merge") {
      // Merge is non-destructive, proceed directly
      runSync(s);
    } else {
      setState("confirming");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const runSync = useCallback(async (s: SyncStrategy) => {
    if (!user) return;
    setState("syncing");
    try {
      switch (s) {
        case "keep-local":
          await initialSyncKeepLocal(user.id);
          break;
        case "use-cloud":
          await initialSyncUseCloud(user.id);
          break;
        case "merge":
          await initialSyncMerge(user.id);
          break;
      }
      setState("done");
      toast.success("Sync setup complete!");
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setState("error");
      toast.error("Sync failed. Please try again.");
    }
  }, [user, onClose]);

  const handleConfirm = useCallback(() => {
    if (strategy) runSync(strategy);
  }, [strategy, runSync]);

  const choices = [
    {
      id: "keep-local" as const,
      icon: Upload,
      title: "Keep Local Data",
      description: `Upload your ${totalLocal} local records to the cloud. Remote data will be merged.`,
    },
    {
      id: "use-cloud" as const,
      icon: Download,
      title: "Use Cloud Data",
      description: `Replace local data with ${totalRemote} records from the cloud. Local-only data will be lost.`,
    },
    {
      id: "merge" as const,
      icon: GitMerge,
      title: "Merge (Recommended)",
      description: "Combine local and cloud data. Newest version of each record wins.",
    },
  ];

  const confirmMessage = strategy === "keep-local"
    ? "This will upload all your local data to the cloud. Any conflicting cloud records with older timestamps will be overwritten."
    : "This will delete all local data and replace it with cloud data. Any local-only records will be permanently lost.";

  return (
    <>
      <Dialog open={open && state === "choosing"} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Set Up Cloud Sync</DialogTitle>
            <DialogDescription>
              Choose how to handle your existing data. You have {totalLocal} local records
              and {totalRemote} cloud records.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleChoose(choice.id)}
                className="w-full flex items-start gap-3 p-4 rounded-lg border hover:bg-accent transition-colors text-left"
              >
                <choice.icon className="w-5 h-5 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-sm">{choice.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{choice.description}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={state === "confirming"} onOpenChange={() => setState("choosing")}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>{confirmMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setState("choosing")}>Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={state === "syncing"}>
        <DialogContent className="sm:max-w-xs" onInteractOutside={(e) => e.preventDefault()}>
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Syncing your data...</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={state === "error"} onOpenChange={() => { setState("choosing"); setErrorMsg(""); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Sync Failed</DialogTitle>
            <DialogDescription>{errorMsg}</DialogDescription>
          </DialogHeader>
          <Button onClick={() => { setState("choosing"); setErrorMsg(""); }}>Try Again</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
