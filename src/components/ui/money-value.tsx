import * as React from "react"
import { cn } from "@/lib/utils"

export interface MoneyValueProps extends React.HTMLAttributes<HTMLDivElement> {
    value: number;
    currency?: string;
    size?: "sm" | "md" | "lg" | "hero";
    tone?: "positive" | "negative" | "neutral" | "default";
    emphasizeCents?: boolean;
}

export function MoneyValue({
    value,
    currency = "USD",
    size = "md",
    tone = "default",
    emphasizeCents = false,
    className,
    ...props
}: MoneyValueProps) {
    const isNegative = value < 0;
    const absValue = Math.abs(value);

    const formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const parts = formatter.formatToParts(absValue);

    let prefix = "";
    let integerPart = "";
    let decimalPart = "";

    for (const part of parts) {
        if (part.type === 'currency' || part.type === 'literal') {
            if (!integerPart) prefix += part.value;
            else decimalPart += part.value;
        } else if (part.type === 'integer' || part.type === 'group') {
            integerPart += part.value;
        } else if (part.type === 'decimal' || part.type === 'fraction') {
            decimalPart += part.value;
        }
    }

    const sign = isNegative ? "-" : "";

    const sizeClasses = {
        sm: "text-sm font-medium",
        md: "text-xl font-semibold",
        lg: "text-3xl font-semibold",
        hero: "text-4xl font-bold md:text-5xl leading-tight",
    };

    const toneClasses = {
        default: "text-foreground",
        positive: "text-success",
        negative: "text-foreground",
        neutral: "text-muted-foreground",
    };

    return (
        <div
            className={cn(
                "tabular-nums tracking-tight flex items-baseline",
                sizeClasses[size],
                toneClasses[tone],
                className
            )}
            {...props}
        >
            <span>{sign}{prefix}{integerPart}</span>
            {decimalPart && (
                <span className={cn(!emphasizeCents && "text-[0.7em] opacity-80 font-medium ml-[1px]")}>
                    {decimalPart}
                </span>
            )}
        </div>
    )
}
