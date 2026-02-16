"use client";

import { useMemo } from "react";
import type { Transaction, Category, Account } from "@/lib/types";
import { useUIStore } from "@/lib/stores/ui.store";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import { formatDate } from "@/lib/utils/format";
import { db } from "@/lib/db/database";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Pencil, Trash2, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
}

export function TransactionList({ transactions, categories, accounts }: TransactionListProps) {
  const openModal = useUIStore((s) => s.openModal);
  const fmt = useCurrencyFormatter();

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );
  const accountMap = useMemo(
    () => new Map(accounts.map((a) => [a.id, a])),
    [accounts]
  );

  const handleDelete = async (id: string) => {
    await db.transactions.delete(id);
    toast.success("Transaction deleted");
  };

  if (transactions.length === 0) return null;

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Account</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => {
              const cat = tx.categoryId ? categoryMap.get(tx.categoryId) : null;
              const acct = accountMap.get(tx.accountId);
              return (
                <TableRow key={tx.id} className="group">
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(tx.date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                        tx.type === "expense" ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                      )}>
                        {tx.type === "expense" ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4" />
                        )}
                      </div>
                      <span className="font-medium text-sm truncate">
                        {tx.note || (tx.type === "expense" ? "Expense" : "Income")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {cat && (
                      <Badge variant="secondary" className="text-xs font-normal">
                        {cat.name}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {acct?.name}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-medium tabular-nums text-sm",
                    tx.type === "expense" ? "text-foreground" : "text-success"
                  )}>
                    {tx.type === "expense" ? "-" : "+"}{fmt(tx.amount)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openModal("transaction", "edit", tx.id)}>
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
                              <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(tx.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {transactions.map((tx) => {
          const cat = tx.categoryId ? categoryMap.get(tx.categoryId) : null;
          return (
            <button
              key={tx.id}
              onClick={() => openModal("transaction", "edit", tx.id)}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-card border hover:bg-accent/50 transition-colors text-left"
            >
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full shrink-0",
                tx.type === "expense" ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
              )}>
                {tx.type === "expense" ? (
                  <ArrowUpRight className="w-5 h-5" />
                ) : (
                  <ArrowDownLeft className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {tx.note || (tx.type === "expense" ? "Expense" : "Income")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(tx.date)}
                  {cat && ` · ${cat.name}`}
                </p>
              </div>
              <span className={cn(
                "font-medium tabular-nums text-sm shrink-0",
                tx.type === "expense" ? "text-foreground" : "text-success"
              )}>
                {tx.type === "expense" ? "-" : "+"}{fmt(tx.amount)}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
