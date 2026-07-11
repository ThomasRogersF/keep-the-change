import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const RISK_CONFIG = {
  low: {
    label: "Low Risk",
    className: "bg-success/10 text-success border-success/20",
    icon: ShieldCheck,
  },
  medium: {
    label: "Moderate Risk",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: ShieldQuestion,
  },
  high: {
    label: "High Risk",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    icon: ShieldAlert,
  },
} as const;

interface RiskBadgeProps {
  level: "low" | "medium" | "high";
  className?: string;
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  const config = RISK_CONFIG[level];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 font-normal", config.className, className)}>
      <Icon className="w-3 h-3" aria-hidden="true" />
      {config.label}
    </Badge>
  );
}
