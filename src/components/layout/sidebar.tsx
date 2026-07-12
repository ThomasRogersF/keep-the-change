"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth/use-auth";
import {
  LayoutDashboard,
  ArrowLeftRight,
  RefreshCw,
  TrendingUp,
  Wallet,
  PiggyBank,
  Target,
  Settings,
  Sun,
  Moon,
  BookOpen,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Subscriptions", href: "/subscriptions", icon: RefreshCw },
  { label: "Income", href: "/income", icon: TrendingUp },
  { label: "Goals", href: "/goals", icon: Target },
  { label: "Wealth", href: "/wealth", icon: PiggyBank },
  { label: "Accounts", href: "/accounts", icon: Wallet },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-sidebar-border bg-sidebar-background">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 h-16 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
          <BookOpen className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight text-foreground">
          Ledgerly
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User section + Theme toggle */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
        {user && (
          <div className="flex items-center gap-2 px-3 py-1.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
              {user.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <span className="text-xs text-sidebar-foreground truncate flex-1">
              {user.email}
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full justify-start gap-3 text-sidebar-foreground hover:text-foreground"
        >
          <Sun className="w-4 h-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start gap-3 text-sidebar-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </Button>
      </div>
    </aside>
  );
}
