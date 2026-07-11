"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PiggyBank, RefreshCw, Settings, Wallet } from "lucide-react";
import { useUIStore } from "@/lib/stores/ui.store";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const items = [
  { label: "Wealth", href: "/wealth", icon: PiggyBank },
  { label: "Subscriptions", href: "/subscriptions", icon: RefreshCw },
  { label: "Accounts", href: "/accounts", icon: Wallet },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function MoreMenuSheet() {
  const pathname = usePathname();
  const { moreMenuOpen, setMoreMenuOpen } = useUIStore();

  return (
    <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
      <SheetContent side="bottom" className="pb-8">
        <SheetHeader>
          <SheetTitle>More</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-3 mt-4">
          {items.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreMenuOpen(false)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl transition-colors text-sm font-medium",
                  isActive ? "bg-primary/10 text-primary" : "bg-muted/50 hover:bg-muted"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full",
                    isActive ? "bg-primary/15 text-primary" : "bg-primary/10 text-primary"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                </div>
                {item.label}
              </Link>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
