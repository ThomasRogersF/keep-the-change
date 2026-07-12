import * as React from "react"
import { FintechCard } from "./fintech-card"
import { MoneyValue } from "./money-value"
import { cn } from "@/lib/utils"
import { type LucideIcon } from "lucide-react"
import { FinancialType, getFinancialTone, getFinancialToneText } from "@/lib/financial-design"

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
    label: string;
    value?: number;
    valueNode?: React.ReactNode;
    supportingText?: string;
    trend?: { value: number; label?: string; positiveIsGood?: boolean };
    icon?: LucideIcon;
    semanticTone?: FinancialType;
    variant?: "surface" | "emphasis" | "vault";
    onClickAction?: () => void;
}

export function StatCard({
    label,
    value,
    valueNode,
    supportingText,
    trend,
    icon: Icon,
    semanticTone,
    variant = "surface",
    onClickAction,
    className,
    ...props
}: StatCardProps) {
    const isVault = variant === "vault";

    return (
        <FintechCard
            variant={variant}
            className={cn(
                "p-5 flex flex-col",
                onClickAction && "cursor-pointer hover:opacity-90 transition-opacity",
                semanticTone && !isVault && getFinancialToneBorder(semanticTone),
                className
            )}
            onClick={onClickAction}
            {...props}
        >
            <div className="flex justify-between items-start mb-3">
                <span className={cn("text-sm font-medium", isVault ? "text-finance-wealth-foreground/80" : "text-muted-foreground")}>{label}</span>
                {Icon && (
                    <div className={cn("p-2 rounded-md", isVault ? "bg-white/10" : (semanticTone ? getFinancialTone(semanticTone) : "bg-muted"))}>
                        <Icon className="h-4 w-4" />
                    </div>
                )}
            </div>
            <div>
                {value !== undefined ? (
                    <MoneyValue value={value} size="lg" className={cn(isVault && "text-finance-wealth-foreground")} tone={isVault ? "default" : "default"} />
                ) : (
                    <div className={cn("text-3xl font-semibold", isVault && "text-finance-wealth-foreground")}>{valueNode}</div>
                )}
            </div>
            {(supportingText || trend) && (
                <div className="mt-2 text-sm flex items-center gap-2">
                    {trend && (
                        <span className={cn(
                            isVault
                                ? (trend.value >= 0 ? "text-success-foreground" : "text-destructive-foreground")
                                : (trend.value >= 0 ? "text-success" : "text-destructive"),
                            "font-medium"
                        )}>
                            {trend.value >= 0 ? "+" : ""}{trend.value}%
                        </span>
                    )}
                    {supportingText && <span className={cn(isVault ? "text-finance-wealth-foreground/70" : "text-muted-foreground")}>{supportingText}</span>}
                </div>
            )}
        </FintechCard>
    )
}

function getFinancialToneBorder(type: FinancialType) {
    switch (type) {
        case 'budgeting': return 'border-b-4 border-b-finance-budgeting';
        case 'goals': return 'border-b-4 border-b-finance-goals';
        case 'emergency': return 'border-b-4 border-b-finance-emergency';
        case 'savings': return 'border-b-4 border-b-finance-savings';
        case 'yield': return 'border-b-4 border-b-finance-yield';
        case 'investments': return 'border-b-4 border-b-finance-investments';
        case 'digital': return 'border-b-4 border-b-finance-digital';
        default: return '';
    }
}
