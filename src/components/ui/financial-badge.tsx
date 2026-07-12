import * as React from "react"
import { cn } from "@/lib/utils"
import { FinancialType, getFinancialTone } from "@/lib/financial-design"

export interface FinancialBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    type?: "locked" | "flexible" | "insured" | "uninsured" | "low-risk" | "high-risk" | FinancialType;
}

export function FinancialBadge({
    type,
    className,
    children,
    ...props
}: FinancialBadgeProps) {

    let variantClass = "bg-muted text-muted-foreground";
    switch (type) {
        case 'locked': variantClass = "bg-warning/20 text-warning"; break;
        case 'flexible': variantClass = "bg-success/20 text-success"; break;
        case 'insured': variantClass = "bg-finance-investments/20 text-finance-investments"; break;
        case 'uninsured': variantClass = "bg-destructive/20 text-destructive"; break;
        case 'high-risk': variantClass = "bg-destructive/10 text-destructive"; break;
        case 'low-risk': variantClass = "bg-success/10 text-success"; break;
        default:
            variantClass = type ? getFinancialTone(type as FinancialType) : variantClass;
    }

    return (
        <div className={cn("inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[0.68rem] uppercase font-semibold tracking-wide transition-colors border border-black/5 shadow-sm", variantClass, className)} {...props}>
            {children}
        </div>
    )
}
