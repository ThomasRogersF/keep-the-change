"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useSettingsStore } from "@/lib/stores/settings.store";
import { CURRENCIES } from "@/lib/utils/constants";
import { loadDemoData, clearAllData, exportAllData, importData } from "@/lib/db/seed";
import { toast } from "sonner";
import { Sun, Moon, Monitor, Download, Upload, Database, Trash2, Target } from "lucide-react";
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

export function SettingsContent() {
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency, subtractGoalsFromAvailable, setSubtractGoalsFromAvailable } = useSettingsStore();
  const [loading, setLoading] = useState(false);

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

  const handleClearAll = async () => {
    try {
      await clearAllData();
      toast.success("All data cleared");
    } catch {
      toast.error("Failed to clear data");
    }
  };

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

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
            <Button variant="outline" size="sm" onClick={handleLoadDemo} disabled={loading}>
              <Database className="w-4 h-4 mr-2" />
              {loading ? "Loading..." : "Load Demo Data"}
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
                    This will permanently delete all your transactions, subscriptions, income entries, accounts, categories, merchants, and goals. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll}>
                    Clear Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
