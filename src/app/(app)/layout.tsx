import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/sonner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      {children}
      <Toaster position="bottom-right" richColors />
    </AppShell>
  );
}
