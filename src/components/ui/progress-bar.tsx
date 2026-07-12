import * as React from "react"
import { cn } from "@/lib/utils"
import { FinancialType, getFinancialTone } from "@/lib/financial-design"

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
    value: number;
    max?: number;
    semanticTone?: FinancialType;
    label?: string;
    size?: "sm" | "md";
}

export function ProgressBar({
    value,
    max = 100,
    semanticTone,
    label,
    size = "md",
    className,
    ...props
}: ProgressBarProps) {
    const percentage = Math.min(100, Math.max(0, max === 0 ? 0 : (value / max) * 100));

    return (
        <div className={cn("w-full", className)} {...props}>
            {label && (
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="tabular-nums font-semibold tracking-tight">{Math.round(percentage)}%</span>
                </div>
            )}
            <div className={cn("overflow-hidden bg-secondary w-full rounded-full border border-black/5 dark:border-white/5 shadow-inner", size === "sm" ? "h-1.5" : "h-2.5")}>
                <div
                    className={cn("h-full rounded-full transition-all duration-500 ease-out", semanticTone ? getFinancialTone(semanticTone).split(' ')[0] : "bg-primary")}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    )
}
