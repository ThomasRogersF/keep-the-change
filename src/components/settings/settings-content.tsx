"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { formatDistanceToNow, format } from "date-fns";
import { useSettingsStore } from "@/lib/stores/settings.store";
import { CURRENCIES } from "@/lib/utils/constants";
import { loadDemoData, exportAllData, importData } from "@/lib/db/seed";
import { toast } from "sonner";
import {
  Sun,
  Moon,
  Monitor,
  Download,
  Upload,
  Database,
  Trash2,
  Target,
  Cloud,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertTriangle,
  Clock,
  Tag,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/use-auth";
import { useSyncState } from "@/lib/sync/use-sync";
import { runSync, isSyncInFlight } from "@/lib/sync/sync-engine";
import {
  clearLocalAndDisableSync,
  clearAllDataEverywhere,
} from "@/lib/sync/clear-data";
import { InitialSyncWizard } from "@/components/sync/initial-sync-wizard";
import { SyncLogViewerDialog } from "@/components/sync/SyncLogViewerDialog";
import { db } from "@/lib/db/database";
import { useUIStore } from "@/lib/stores/ui.store";
import { useCategories } from "@/lib/hooks/use-categories";
import { CategoryList } from "@/components/categories/category-list";
import { CategoryForm } from "@/components/categories/category-form";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

// ─── helpers ─────────────────────────────────────────────────────────────────

function statusLabel(status: string | undefined): string {
  switch (status) {
    case "syncing":
      return "Syncing…";
    case "success":
      return "Synced";
    case "partial":
      return "Partial sync";
    case "error":
      return "Sync failed";
    default:
      return "Not synced";
  }
}

function isAuthError(error: string | null | undefined): boolean {
  if (!error) return false;
  const lower = error.toLowerCase();
  return (
    lower.includes("401") ||
    lower.includes("403") ||
    lower.includes("unauthorized") ||
    lower.includes("forbidden") ||
    lower.includes("jwt") ||
    lower.includes("session") ||
    lower.includes("not authenticated")
  );
}

function formatRetryAt(nextRetryAt: Date | null | undefined): string | null {
  if (!nextRetryAt) return null;
  const t = new Date(nextRetryAt);
  if (t <= new Date()) return null;
  const secs = Math.round((t.getTime() - Date.now()) / 1000);
  if (secs < 60) return `${secs}s`;
  return `${Math.round(secs / 60)}m`;
}

// ─── SettingsContent ──────────────────────────────────────────────────────────

export function SettingsContent() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const {
    currency,
    setCurrency,
    subtractGoalsFromAvailable,
    setSubtractGoalsFromAvailable,
    syncEnabled,
    setSyncEnabled,
    autoSyncEnabled,
    setAutoSyncEnabled,
  } = useSettingsStore();

  const [loading, setLoading] = useState(false);
  const [localSyncing, setLocalSyncing] = useState(false);
  const [localQueued, setLocalQueued] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [logViewerOpen, setLogViewerOpen] = useState(false);
  const [tableStatsOpen, setTableStatsOpen] = useState(false);

  const syncState = useSyncState();
  const openModal = useUIStore((s) => s.openModal);
  const categories = useCategories();

  // Derived state
  const isSyncing =
    localSyncing || syncState?.lastSyncStatus === "syncing";
  const summary = syncState?.lastSyncSummary ?? null;
  const retryIn = formatRetryAt(syncState?.nextRetryAt);
  const authErr = isAuthError(syncState?.lastSyncError);

  // ── handlers ───────────────────────────────────────────────────────────────

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ledgerly-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported");
    } catch {
      toast.error("Export failed");
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        await importData(text);
        toast.success("Data imported successfully");
      } catch {
        toast.error("Invalid data file");
      }
    };
    input.click();
  };

  const handleLoadDemo = async () => {
    setLoading(true);
    try {
      await loadDemoData();
      toast.success("Demo data loaded");
    } catch {
      toast.error("Failed to load demo data");
    } finally {
      setLoading(false);
    }
  };

  const handleClearLocal = async () => {
    try {
      await clearLocalAndDisableSync(user?.id ?? null, setSyncEnabled);
      toast.success("Local data cleared");
    } catch {
      toast.error("Failed to clear data");
    }
  };

  const handleClearEverywhere = async () => {
    if (!user) return;
    try {
      await clearAllDataEverywhere(user.id);
      toast.success("Data cleared on this device and in the cloud");
    } catch (err) {
      toast.error(
        `Failed to clear cloud data: ${err instanceof Error ? err.message : "Unknown error"}. Local data is marked for deletion — try again.`,
      );
    }
  };

  const handleToggleSync = (enabled: boolean) => {
    setSyncEnabled(enabled);
    if (enabled && user && !syncState?.initialSyncCompleted) {
      setWizardOpen(true);
    }
  };

  const handleSyncNow = async () => {
    if (!user) return;

    // If already syncing, mark queued visually and return
    if (isSyncInFlight()) {
      setLocalQueued(true);
      return;
    }

    setLocalSyncing(true);
    setLocalQueued(false);
    try {
      // Clear backoff so manual trigger always fires
      if (syncState) {
        await db.syncState.update(user.id, { nextRetryAt: null });
      }
      const result = await runSync(user.id);
      if (result.errors.length === 0) {
        toast.success(
          `Synced: ↑ ${result.pushed} pushed, ↓ ${result.pulled} pulled`
        );
        await db.syncState.update(user.id, { retryCount: 0, nextRetryAt: null });
      } else if (result.errors.length < Object.keys(result.tables).length) {
        toast.warning(`Partial sync: ${result.errors[0]}`);
      } else {
        toast.error(`Sync error: ${result.errors[0]}`);
      }
    } catch (err) {
      toast.error(`Sync failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLocalSyncing(false);
      setLocalQueued(false);
    }
  };

  const handleResetSync = async () => {
    if (!user) return;
    try {
      await db.syncState.delete(user.id);
      setSyncEnabled(false);
      toast.success("Sync state reset");
    } catch {
      toast.error("Failed to reset sync");
    }
  };

  // ── theme options ──────────────────────────────────────────────────────────

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  // ── per-table summary rows ─────────────────────────────────────────────────

  const tableRows = summary
    ? Object.entries(summary.tables).map(([name, stats]) => ({
        name,
        ...stats,
      }))
    : [];

  return (
    <div className="max-w-2xl space-y-6">
      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Customize the look and feel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="flex gap-2">
              {themes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors",
                    theme === t.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:bg-accent"
                  )}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Currency</CardTitle>
          <CardDescription>Set your default currency</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={currency}
            onValueChange={(v) => {
              const c = CURRENCIES.find((c) => c.code === v);
              if (c) setCurrency(c.code, c.locale);
            }}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Budgeting */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4" />
            Budgeting
          </CardTitle>
          <CardDescription>Configure how goals affect your budget view</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="subtractGoals" className="cursor-pointer">
                Subtract goal allocations from available to spend
              </Label>
              <p className="text-xs text-muted-foreground">
                When enabled, earmarked money is excluded from your available balance
              </p>
            </div>
            <Switch
              id="subtractGoals"
              checked={subtractGoalsFromAvailable}
              onCheckedChange={setSubtractGoalsFromAvailable}
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Categories
            </CardTitle>
            <CardDescription>
              Organize your transactions and subscriptions
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openModal("category", "create")}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {categories === undefined ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="No categories yet"
              description="Categories help you organize where your money goes."
              action={{
                label: "Add Category",
                onClick: () => openModal("category", "create"),
              }}
            />
          ) : (
            <CategoryList categories={categories} />
          )}
        </CardContent>
      </Card>

      {/* Cloud Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cloud className="w-4 h-4" />
            Cloud Sync
          </CardTitle>
          <CardDescription>Sync your data across devices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enable toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="syncEnabled" className="cursor-pointer">
                Enable cloud sync
              </Label>
              <p className="text-xs text-muted-foreground">
                Keep your data in sync across all your devices
              </p>
            </div>
            <Switch
              id="syncEnabled"
              checked={syncEnabled}
              onCheckedChange={handleToggleSync}
            />
          </div>

          {syncEnabled && (
            <>
              {/* Auto-sync toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoSync" className="cursor-pointer">
                    Auto-sync
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically sync on app load, reconnect, and every 5 minutes
                  </p>
                </div>
                <Switch
                  id="autoSync"
                  checked={autoSyncEnabled}
                  onCheckedChange={setAutoSyncEnabled}
                />
              </div>

              {/* Status + Sync Now row */}
              <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                {/* Status row */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {/* Status indicator dot */}
                    <span
                      className={cn("w-2 h-2 rounded-full shrink-0", {
                        "bg-muted-foreground": !syncState?.lastSyncStatus || syncState.lastSyncStatus === "idle",
                        "bg-blue-500 animate-pulse": isSyncing,
                        "bg-green-500": syncState?.lastSyncStatus === "success",
                        "bg-amber-500": syncState?.lastSyncStatus === "partial",
                        "bg-red-500": syncState?.lastSyncStatus === "error",
                      })}
                    />
                    <span className="text-sm font-medium">
                      {statusLabel(isSyncing ? "syncing" : syncState?.lastSyncStatus)}
                    </span>
                    {localQueued && (
                      <Badge variant="outline" className="text-xs">
                        Queued
                      </Badge>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncNow}
                    disabled={isSyncing || !syncState?.initialSyncCompleted}
                    className="shrink-0"
                  >
                    <RefreshCw
                      className={cn("w-4 h-4 mr-2", isSyncing && "animate-spin")}
                    />
                    {localQueued ? "Queued" : isSyncing ? "Syncing…" : "Sync Now"}
                  </Button>
                </div>

                {/* Last sync time + totals */}
                {syncState?.lastSyncAt && !isSyncing && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(syncState.lastSyncAt), {
                        addSuffix: true,
                      })}
                    </span>
                    {summary && (
                      <>
                        <span>↑ {summary.totalPushed} pushed</span>
                        <span>↓ {summary.totalPulled} pulled</span>
                        {summary.durationMs > 0 && (
                          <span>{summary.durationMs}ms</span>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Auth error banner */}
                {authErr && (
                  <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>Session expired. Please sign out and log in again.</span>
                  </div>
                )}

                {/* Backoff retry info (non-auth errors) */}
                {retryIn && !authErr && (
                  <p className="text-xs text-muted-foreground">
                    Auto-retry in {retryIn}
                    {syncState?.retryCount
                      ? ` (attempt ${syncState.retryCount})`
                      : ""}
                  </p>
                )}

                {/* Generic error message (non-auth) */}
                {!authErr &&
                  syncState?.lastSyncError &&
                  (syncState.lastSyncStatus === "error" ||
                    syncState.lastSyncStatus === "partial") && (
                    <p className="text-xs text-destructive truncate" title={syncState.lastSyncError}>
                      {syncState.lastSyncError}
                    </p>
                  )}

                {/* Per-table breakdown toggle */}
                {summary && tableRows.length > 0 && (
                  <div className="border-t pt-2">
                    <button
                      onClick={() => setTableStatsOpen((v) => !v)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {tableStatsOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                      {tableStatsOpen ? "Hide" : "Show"} per-table details
                    </button>

                    {tableStatsOpen && (
                      <div className="mt-2 space-y-1">
                        {tableRows.map((row) => (
                          <div
                            key={row.name}
                            className={cn(
                              "flex items-center justify-between text-xs px-2 py-1 rounded",
                              row.error
                                ? "bg-destructive/5 text-destructive"
                                : "text-muted-foreground"
                            )}
                          >
                            <span className="font-medium truncate">{row.name}</span>
                            <div className="flex items-center gap-3 shrink-0 ml-2">
                              {row.error ? (
                                <span className="truncate max-w-[180px]" title={row.error}>
                                  ✕ {row.error.split(":").slice(-1)[0].trim()}
                                </span>
                              ) : (
                                <>
                                  <span>↑ {row.pushed}</span>
                                  <span>↓ {row.pulled}</span>
                                  {row.conflictsResolved > 0 && (
                                    <span className="text-amber-600 dark:text-amber-400">
                                      ⚡ {row.conflictsResolved}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                        <p className="text-[10px] text-muted-foreground pt-1">
                          ↑ pushed · ↓ pulled · ⚡ conflicts resolved
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Log + reset row */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setLogViewerOpen(true)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Sync Log
                </Button>

                <div className="flex-1" />

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      Reset Sync
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset sync state?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will clear your sync metadata and disable sync. Your local and cloud
                        data will not be deleted. You can re-enable sync at any time.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResetSync}>
                        Reset Sync
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* Last synced timestamp for reference */}
              {syncState?.lastSyncAt && (
                <p className="text-[11px] text-muted-foreground">
                  Last sync completed{" "}
                  {format(new Date(syncState.lastSyncAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Database availability */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Database availability
          </CardTitle>
          <CardDescription>Monitored by a scheduled external check</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0 bg-green-500" />
              <span className="text-sm font-medium">Checked by scheduled monitor</span>
            </div>
            <p className="text-xs text-muted-foreground">
              A scheduled job pings the Supabase database once a day to keep it active and
              confirm it&apos;s reachable. Results are recorded in the deployment&apos;s server logs.
            </p>
            <p className="text-[11px] text-muted-foreground">
              This is a best-effort keep-alive and does not guarantee a Free Plan project will
              never pause.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data</CardTitle>
          <CardDescription>Import, export, and manage your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleImport}>
              <Upload className="w-4 h-4 mr-2" />
              Import JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadDemo}
              disabled={loading}
            >
              <Database className="w-4 h-4 mr-2" />
              {loading ? "Loading…" : "Load Demo Data"}
            </Button>
          </div>
          <div className="pt-2 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {syncEnabled
                      ? "Cloud sync is on. Choose how to clear your data:"
                      : "This will permanently delete all your transactions, subscriptions, income entries, accounts, categories, merchants, and goals. This cannot be undone."}
                  </AlertDialogDescription>
                </AlertDialogHeader>

                {syncEnabled ? (
                  <div className="space-y-3 py-2">
                    <div className="rounded-lg border p-3 space-y-2">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">Clear this device only</p>
                        <p className="text-xs text-muted-foreground">
                          Disables sync and wipes local data. Your cloud copy stays intact and
                          you can restore it by re-enabling sync.
                        </p>
                      </div>
                      <AlertDialogAction
                        onClick={handleClearLocal}
                        className="w-full"
                      >
                        Clear this device
                      </AlertDialogAction>
                    </div>

                    <div className="rounded-lg border border-destructive/30 p-3 space-y-2">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-destructive">Clear everywhere</p>
                        <p className="text-xs text-muted-foreground">
                          Deletes data on this device and pushes deletions to the cloud, so all
                          your other devices will be wiped on their next sync. Cannot be undone.
                        </p>
                      </div>
                      <AlertDialogAction
                        onClick={handleClearEverywhere}
                        className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Clear everywhere
                      </AlertDialogAction>
                    </div>

                    <AlertDialogFooter>
                      <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                    </AlertDialogFooter>
                  </div>
                ) : (
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearLocal}>
                      Clear Everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                )}
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <InitialSyncWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />

      <SyncLogViewerDialog
        open={logViewerOpen}
        onOpenChange={setLogViewerOpen}
        log={syncState?.syncLog ?? []}
      />

      <CategoryForm />
    </div>
  );
}
