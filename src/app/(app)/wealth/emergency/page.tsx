"use client";

import { Info, Shield } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmergencyFundCard } from "@/components/wealth/emergency/emergency-fund-card";
import { EmergencyFundForm } from "@/components/wealth/emergency/emergency-fund-form";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAllEmergencyFundsSummary } from "@/lib/hooks/use-emergency-funds";
import { useUIStore } from "@/lib/stores/ui.store";

export default function EmergencyFundsPage() {
  const openModal = useUIStore((s) => s.openModal);
  const summaries = useAllEmergencyFundsSummary();
  const isLoading = summaries === undefined;
  const hasFunds = !isLoading && summaries.length > 0;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <PageHeader
        title="Emergency Funds"
        subtitle="Protected reserves for the unexpected"
        action={
          <Button onClick={() => openModal("emergencyFund", "create")}>New Emergency Fund</Button>
        }
      />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Info className="w-3.5 h-3.5" />
              How is this different from a Goal?
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="text-xs">
              Goals are virtual earmarks for future spending. Emergency Funds are protected
              reserves backed by a real account balance, meant to stay untouched until you need
              them.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : hasFunds ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {summaries.map((summary) => (
            <EmergencyFundCard key={summary.fund.id} summary={summary} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Shield}
          title="No emergency funds yet"
          description="Create a protected reserve for medical bills, income interruption, or other unexpected costs."
          action={{
            label: "Create Emergency Fund",
            onClick: () => openModal("emergencyFund", "create"),
          }}
        />
      )}

      <EmergencyFundForm />
    </div>
  );
}
