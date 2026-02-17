"use client";

import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface SyncStatusBadgeProps {
  status: "idle" | "syncing" | "success" | "error";
  lastSyncAt: Date | null;
  error?: string | null;
}

export function SyncStatusBadge({ status, lastSyncAt, error }: SyncStatusBadgeProps) {
  const dotClass = cn("w-2 h-2 rounded-full", {
    "bg-muted-foreground": status === "idle",
    "bg-blue-500 animate-pulse": status === "syncing",
    "bg-green-500": status === "success",
    "bg-red-500": status === "error",
  });

  const label = (() => {
    switch (status) {
      case "idle":
        return "Not synced";
      case "syncing":
        return "Syncing...";
      case "success":
        return lastSyncAt
          ? `Synced ${formatDistanceToNow(lastSyncAt, { addSuffix: true })}`
          : "Synced";
      case "error":
        return error ?? "Sync failed";
    }
  })();

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className={dotClass} />
      <span className="truncate">{label}</span>
    </div>
  );
}
