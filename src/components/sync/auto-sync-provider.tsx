"use client";

import { useSync } from "@/lib/sync/use-sync";

export function AutoSyncProvider({ children }: { children: React.ReactNode }) {
  // Activate auto-sync hooks (mount, online, interval)
  useSync();
  return <>{children}</>;
}
