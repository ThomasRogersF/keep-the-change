"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/use-auth";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { AutoSyncProvider } from "@/components/sync/auto-sync-provider";
import { OfflineBanner } from "@/components/sync/OfflineBanner";
import { Loader2 } from "lucide-react";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

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
