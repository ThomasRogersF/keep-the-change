"use client";

import type { Account } from "@/lib/types";
import { useUIStore } from "@/lib/stores/ui.store";
import { db } from "@/lib/db/database";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type { WealthAccount } from "@/lib/types";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import { FintechCard } from "@/components/ui/fintech-card";
import { Wallet, Landmark, MoreHorizontal, Pencil, Trash2, Shield, Gem } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AccountListProps {
  accounts: Account[];
  wealthAccounts?: WealthAccount[];
}

export function AccountList({ accounts, wealthAccounts = [] }: AccountListProps) {
  const openModal = useUIStore((s) => s.openModal);
  const fmt = useCurrencyFormatter();

  const mainAccounts = accounts.filter((a) => a.type === "main");
  const externalAccounts = accounts.filter((a) => a.type === "external");

  const handleDelete = async (id: string) => {
    const txCount = await db.transactions.where("accountId").equals(id).count();
    if (txCount > 0) {
      toast.error(`Cannot delete: ${txCount} transactions linked to this account`);
      return;
    }
    await db.accounts.delete(id);
    toast.success("Account deleted");
  };

  const renderAccount = (account: Account) => (
    <FintechCard key={account.id} className="group hover:border-primary/20 transition-all">
      <div className="flex items-center gap-4 p-4">
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full shrink-0",
          account.type === "main" ? "bg-finance-budgeting/10 text-finance-budgeting" : "bg-muted text-muted-foreground"
        )}>
          {account.type === "main" ? (
            <Wallet className="w-5 h-5" />
          ) : (
            <Landmark className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[15px] truncate">{account.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">
              {account.type === "main" ? "Budget Account" : "External Tracked"}
            </span>
            <Badge variant="secondary" className="text-[10px] uppercase font-medium tracking-wide">
              {account.currency}
            </Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openModal("account", "edit", account.id)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will only work if no transactions are linked to this account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(account.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </FintechCard>
  );

  const renderWealthAccount = (wa: WealthAccount) => (
    <FintechCard key={wa.id} variant="vault" className="group">
      <div className="flex items-center gap-4 p-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-finance-wealth-foreground shrink-0 border border-white/5">
          {wa.type === "cash" ? <Shield className="w-5 h-5" /> : <Gem className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[15px] truncate">{wa.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs opacity-70">
              {wa.type === "cash" ? "Cash & Savings" : "Investments"}
            </span>
            {wa.institution && (
              <>
                <span className="text-xs opacity-50">•</span>
                <span className="text-xs opacity-70 truncate">{wa.institution}</span>
              </>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-semibold tabular-nums text-foreground tracking-tight">
            {fmt(wa.balance)}
          </p>
        </div>
      </div>
    </FintechCard>
  );

  return (
    <div className="space-y-8">
      {mainAccounts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-finance-budgeting pl-1">
            Budget Accounts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">{mainAccounts.map(renderAccount)}</div>
        </div>
      )}
      {wealthAccounts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-finance-wealth pl-1">
            Wealth & Investment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">{wealthAccounts.map(renderWealthAccount)}</div>
        </div>
      )}
      {externalAccounts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground pl-1">
            External Accounts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">{externalAccounts.map(renderAccount)}</div>
        </div>
      )}
    </div>
  );
}
