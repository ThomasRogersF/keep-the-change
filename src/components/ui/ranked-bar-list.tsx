import * as React from "react"
import { cn } from "@/lib/utils"
import { MoneyValue } from "./money-value"

export interface RankedBarListItem {
    id: string;
    label: string;
    value: number;
    icon?: React.ReactNode;
    colorClass?: string;
}

export interface RankedBarListProps extends React.HTMLAttributes<HTMLDivElement> {
    items: RankedBarListItem[];
    totalValue?: number;
}

export function RankedBarList({
    items,
    totalValue,
    className,
    ...props
}: RankedBarListProps) {

    const total = totalValue || items.reduce((acc, curr) => acc + Math.max(0, curr.value), 0);
    const sorted = [...items].sort((a, b) => b.value - a.value);

    return (
        <div className={cn("flex flex-col gap-4", className)} {...props}>
            {sorted.map(item => {
                let percent = total > 0 ? (Math.max(0, item.value) / total) * 100 : 0;
                return (
                    <div key={item.id} className="relative flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-sm z-10 relative">
                            <div className="flex items-center gap-3">
                                {item.icon && <div className="text-muted-foreground">{item.icon}</div>}
                                <span className="font-medium truncate max-w-[140px] sm:max-w-[200px] text-foreground/90">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <MoneyValue value={item.value} size="sm" />
                                <span className="text-muted-foreground w-8 text-right text-xs font-semibold">{Math.round(percent)}%</span>
                            </div>
                        </div>
                        <div className="h-1.5 w-full bg-secondary/80 rounded-full overflow-hidden shadow-inner">
                            <div
                                className={cn("h-full rounded-full transition-all duration-700 ease-out", item.colorClass || "bg-primary")}
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    )
}
