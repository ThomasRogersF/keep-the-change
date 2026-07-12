"use client";

import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { MobileAddSheet } from "./mobile-add-sheet";
import { MoreMenuSheet } from "./more-menu-sheet";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:pl-64 pb-[calc(110px+env(safe-area-inset-bottom))] lg:pb-0 pt-safe overflow-auto">
        {children}
      </main>
      <MobileNav />
      <MobileAddSheet />
      <MoreMenuSheet />
    </div>
  );
}
