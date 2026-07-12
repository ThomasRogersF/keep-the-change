"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/use-auth";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { AutoSyncProvider } from "@/components/sync/auto-sync-provider";
import { OfflineBanner } from "@/components/sync/OfflineBanner";
import { Loader2 } from "lucide-react";

// Escape hatch for the local design-screenshot pipeline (scripts/screenshot-pages.mjs),
// which has no real Supabase session but needs to reach pages behind auth.
const SCREENSHOT_MODE = process.env.NEXT_PUBLIC_SCREENSHOT_MODE === "1";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!SCREENSHOT_MODE && !loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (SCREENSHOT_MODE) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AutoSyncProvider>
        <OfflineBanner />
        <AppShell>
          {children}
          <Toaster position="bottom-right" richColors />
        </AppShell>
      </AutoSyncProvider>
    </AuthGuard>
  );
}
