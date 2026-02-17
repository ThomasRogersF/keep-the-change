"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Copy, Download, Search, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { SyncLogEntry } from "@/lib/types";

type FilterLevel = "all" | "errors" | "warnings";

interface SyncLogViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: SyncLogEntry[];
}

function levelBadgeClass(level: SyncLogEntry["level"]): string {
  switch (level) {
    case "error":
      return "border-transparent bg-destructive/15 text-destructive dark:bg-destructive/25";
    case "warn":
      return "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    default:
      return "border-transparent bg-muted text-muted-foreground";
  }
}

function actionLabel(action: SyncLogEntry["action"]): string {
  switch (action) {
    case "push":
      return "↑ push";
    case "pull":
      return "↓ pull";
    case "conflict":
      return "⚡ conflict";
    case "error":
      return "✕ error";
  }
}

export function SyncLogViewerDialog({
  open,
  onOpenChange,
  log,
}: SyncLogViewerDialogProps) {
  const [filter, setFilter] = useState<FilterLevel>("all");
  const [search, setSearch] = useState("");

  // Newest first
  const reversedLog = useMemo(() => [...log].reverse(), [log]);

  const filteredLog = useMemo(() => {
    return reversedLog.filter((entry) => {
      if (filter === "errors" && entry.level !== "error") return false;
      if (filter === "warnings" && entry.level !== "warn") return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const searchable = [
          entry.table,
          entry.action,
          entry.message ?? "",
          entry.level,
        ]
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      return true;
    });
  }, [reversedLog, filter, search]);

  const handleCopy = () => {
    const text = JSON.stringify(filteredLog, null, 2);
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Log copied to clipboard"))
      .catch(() => toast.error("Failed to copy log"));
  };

  const handleExport = () => {
    const text = JSON.stringify(log, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledgerly-sync-log-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Log exported");
  };

  const filterOptions: { label: string; value: FilterLevel }[] = [
    { label: "All", value: "all" },
    { label: "Errors", value: "errors" },
    { label: "Warnings", value: "warnings" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Sync Log
          </DialogTitle>
          <DialogDescription>
            Last {log.length} sync events. No authentication data is stored in
            this log.
          </DialogDescription>
        </DialogHeader>

        {/* Controls */}
        <div className="flex flex-col gap-3 pb-1">
          {/* Filter chips */}
          <div className="flex items-center gap-2">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                  filter === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-accent"
                )}
              >
                {opt.label}
              </button>
            ))}
            <span className="ml-auto text-xs text-muted-foreground">
              {filteredLog.length} entries
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search log…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        {/* Log entries */}
        <ScrollArea className="flex-1 min-h-0 border rounded-md">
          {filteredLog.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              No entries match your filter.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredLog.map((entry, i) => (
                <div key={i} className="flex items-start gap-3 px-3 py-2.5 text-xs">
                  {/* Timestamp */}
                  <span className="text-muted-foreground whitespace-nowrap font-mono shrink-0 mt-0.5">
                    {format(new Date(entry.timestamp), "HH:mm:ss")}
                  </span>

                  {/* Level badge */}
                  <span
                    className={cn(
                      "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold shrink-0 mt-0.5 uppercase tracking-wide",
                      levelBadgeClass(entry.level)
                    )}
                  >
                    {entry.level}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium">{actionLabel(entry.action)}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                        {entry.table}
                      </Badge>
                      {entry.count > 0 && (
                        <span className="text-muted-foreground">
                          {entry.count} row{entry.count !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {entry.message && (
                      <p className="mt-0.5 text-muted-foreground truncate" title={entry.message}>
                        {entry.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-1 border-t gap-2 flex-wrap">
          <p className="text-xs text-muted-foreground">
            If sync is failing,{" "}
            <button
              onClick={handleExport}
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              export the log
            </button>{" "}
            and attach it to your bug report.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export JSON
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
