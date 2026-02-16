"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  RefreshCw,
  TrendingUp,
  Wallet,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/ui.store";

const navItems = [
  { label: "Home", href: "/", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Subscriptions", href: "/subscriptions", icon: RefreshCw },
  { label: "Income", href: "/income", icon: TrendingUp },
  { label: "Accounts", href: "/accounts", icon: Wallet },
];

export function MobileNav() {
  const pathname = usePathname();
  const setMobileAddOpen = useUIStore((s) => s.setMobileAddOpen);

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50">
      {/* Floating Add Button */}
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-10">
        <button
          onClick={() => setMobileAddOpen(true)}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all"
          aria-label="Add new item"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Nav Bar */}
      <nav className="flex items-center justify-around px-2 h-16 bg-background/95 backdrop-blur-lg border-t border-border">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors",
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
