import * as React from "react"
import { cn } from "@/lib/utils"

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    description?: string;
    action?: React.ReactNode;
    periodControl?: React.ReactNode;
}

export function SectionHeader({
    title,
    description,
    action,
    periodControl,
    className,
    ...props
}: SectionHeaderProps) {
    return (
        <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b pb-4", className)} {...props}>
            <div className="flex-1">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
                {description && <p className="text-sm text-muted-foreground mt-1.5">{description}</p>}
            </div>
            <div className="flex items-center gap-3 self-start md:self-auto">
                {periodControl}
                {action}
            </div>
        </div>
    )
}
