"use client";

import { cn } from "@/lib/utils";

interface GoalProgressBarProps {
  percent: number;
  isOverfunded?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function GoalProgressBar({
  percent,
  isOverfunded = false,
  className,
  size = "md",
}: GoalProgressBarProps) {
  const clampedPercent = Math.min(percent, 100);

  return (
    <div
      className={cn(
        "w-full rounded-full bg-muted overflow-hidden",
        size === "sm" ? "h-1.5" : "h-2.5",
        className
      )}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500 ease-out",
          isOverfunded
            ? "bg-success"
            : percent >= 100
              ? "bg-success"
              : percent >= 60
                ? "bg-primary"
                : "bg-primary/80"
        )}
        style={{ width: `${clampedPercent}%` }}
      />
    </div>
  );
}
