"use client";

import { Info, ShieldCheck, ShieldOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const INSURANCE_CONFIG = {
  FDIC: { label: "FDIC Insured", icon: ShieldCheck },
  NCUA: { label: "NCUA Insured", icon: ShieldCheck },
  SIPC: { label: "SIPC Coverage", icon: ShieldCheck },
  none: { label: "Uninsured", icon: ShieldOff },
} as const;

interface InsuranceBadgeProps {
  insuranceType: "FDIC" | "NCUA" | "SIPC" | "none";
  /** Shows the digital-asset disclaimer tooltip — not a legal guarantee, just informational. */
  isDigitalAsset?: boolean;
  className?: string;
}

export function InsuranceBadge({ insuranceType, isDigitalAsset, className }: InsuranceBadgeProps) {
  const config = INSURANCE_CONFIG[insuranceType];
  const Icon = config.icon;

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 font-normal",
        insuranceType === "none"
          ? "text-muted-foreground"
          : "bg-success/10 text-success border-success/20",
        className
      )}
    >
      <Icon className="w-3 h-3" aria-hidden="true" />
      {config.label}
      {isDigitalAsset && <Info className="w-3 h-3 opacity-70" aria-hidden="true" />}
    </Badge>
  );

  if (!isDigitalAsset) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-xs">
            Digital asset product — not equivalent to a traditional insured bank account.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
