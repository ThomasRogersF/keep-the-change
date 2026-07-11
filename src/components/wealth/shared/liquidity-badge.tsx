import { Clock, Lock, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const LIQUIDITY_CONFIG = {
  immediate: { label: "Available Anytime", icon: Zap },
  short_term: { label: "Flexible", icon: Clock },
  long_term: { label: "Locked", icon: Lock },
} as const;

interface LiquidityBadgeProps {
  liquidity: "immediate" | "short_term" | "long_term";
  className?: string;
}

export function LiquidityBadge({ liquidity, className }: LiquidityBadgeProps) {
  const config = LIQUIDITY_CONFIG[liquidity];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 font-normal", className)}>
      <Icon className="w-3 h-3" aria-hidden="true" />
      {config.label}
    </Badge>
  );
}
