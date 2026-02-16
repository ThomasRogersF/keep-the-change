"use client";

import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { MobileAddSheet } from "./mobile-add-sheet";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:pl-64 pb-24 lg:pb-0 overflow-auto">
        {children}
      </main>
      <MobileNav />
      <MobileAddSheet />
    </div>
  );
}
