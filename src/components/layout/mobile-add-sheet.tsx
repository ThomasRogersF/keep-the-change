"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  RefreshCw,
  TrendingUp,
  Wallet,
  Target,
} from "lucide-react";
import { useUIStore } from "@/lib/stores/ui.store";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const actions = [
  {
    label: "Add Transaction",
    icon: ArrowLeftRight,
    modalType: "transaction" as const,
    href: "/transactions",
  },
  {
    label: "Add Subscription",
    icon: RefreshCw,
    modalType: "subscription" as const,
    href: "/subscriptions",
  },
  {
    label: "Add Income",
    icon: TrendingUp,
    modalType: "income" as const,
    href: "/income",
  },
  {
    label: "Add Goal",
    icon: Target,
    modalType: "goal" as const,
    href: "/goals",
  },
  {
    label: "Add Account",
    icon: Wallet,
    modalType: "account" as const,
    href: "/accounts",
  },
];

export function MobileAddSheet() {
  const router = useRouter();
  const { mobileAddOpen, setMobileAddOpen, openModal } = useUIStore();

  return (
    <Sheet open={mobileAddOpen} onOpenChange={setMobileAddOpen}>
      <SheetContent side="bottom" className="pb-8">
        <SheetHeader>
          <SheetTitle>Quick Add</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-3 mt-4">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                setMobileAddOpen(false);
                router.push(action.href);
                setTimeout(() => openModal(action.modalType, "create"), 100);
              }}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl",
                "bg-muted/50 hover:bg-muted transition-colors",
                "text-sm font-medium"
              )}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                <action.icon className="w-5 h-5" />
              </div>
              {action.label}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
