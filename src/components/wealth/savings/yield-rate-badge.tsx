import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface YieldRateBadgeProps {
  rate: number;
  rateType: "APY" | "APR";
  className?: string;
}

export function YieldRateBadge({ rate, rateType, className }: YieldRateBadgeProps) {
  return (
    <Badge
      className={cn(
        "border-transparent bg-success/10 text-success font-medium hover:bg-success/10",
        className
      )}
    >
      {rate}% {rateType}
    </Badge>
  );
}
