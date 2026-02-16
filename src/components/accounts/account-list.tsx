"use client";

import type { Account } from "@/lib/types";
import { useUIStore } from "@/lib/stores/ui.store";
import { db } from "@/lib/db/database";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Wallet, Landmark, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface AccountListProps {
  accounts: Account[];
}

export function AccountList({ accounts }: AccountListProps) {
  const openModal = useUIStore((s) => s.openModal);

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
    <Card key={account.id} className="group">
      <CardContent className="flex items-center gap-4 py-4">
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full shrink-0",
          account.type === "main" ? "bg-primary/10 text-primary" : "bg-chart-5/10 text-chart-5"
        )}>
          {account.type === "main" ? (
            <Wallet className="w-5 h-5" />
          ) : (
            <Landmark className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{account.name}</p>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-normal">
              {account.currency}
            </Badge>
            <Badge variant="outline" className="text-xs font-normal">
              {account.type === "main" ? "Budget" : "External"}
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
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {mainAccounts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Budget Accounts</h3>
          <div className="space-y-2">{mainAccounts.map(renderAccount)}</div>
        </div>
      )}
      {externalAccounts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">External Accounts</h3>
          <div className="space-y-2">{externalAccounts.map(renderAccount)}</div>
        </div>
      )}
    </div>
  );
}
