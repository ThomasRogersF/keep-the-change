import * as React from "react"
import { cn } from "@/lib/utils"

export interface FintechCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "surface" | "emphasis" | "vault"
}

export const FintechCard = React.forwardRef<HTMLDivElement, FintechCardProps>(
    ({ className, variant = "surface", ...props }, ref) => {

        const variants = {
            surface: "bg-card text-card-foreground border shadow-sm",
            emphasis: "bg-card text-card-foreground border-border/80 ring-1 ring-primary/10 shadow-md",
            vault: "bg-finance-wealth text-finance-wealth-foreground shadow-lg border border-white/10 dark:border-white/5",
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "rounded-xl",
                    variants[variant],
                    className
                )}
                {...props}
            />
        )
    }
)
FintechCard.displayName = "FintechCard"
