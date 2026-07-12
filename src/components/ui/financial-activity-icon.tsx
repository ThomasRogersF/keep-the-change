import * as React from "react"
import {
    ShoppingCart,
    Utensils,
    Home,
    Bus,
    Tv,
    Banknote,
    ArrowRightLeft,
    ArrowDownToLine,
    ArrowUpFromLine,
    TrendingUp,
    TrendingDown,
    Landmark,
    BadgePercent,
    CircleDollarSign,
    type LucideIcon,
    Zap
} from "lucide-react"
import { cn } from "@/lib/utils"

export function FinancialActivityIcon({ category, className, ...props }: { category: string, className?: string } & React.HTMLAttributes<SVGElement>) {
    const Icon = getCategoryIcon(category);
    return <Icon className={cn("shrink-0", className)} {...props as any} />
}

export function getCategoryIcon(type: string): LucideIcon {
    if (!type) return CircleDollarSign;
    const normalized = type.toLowerCase();
    if (normalized.includes('grocer') || normalized.includes('shopping') || normalized.includes('market')) return ShoppingCart;
    if (normalized.includes('dining') || normalized.includes('food') || normalized.includes('restaurant')) return Utensils;
    if (normalized.includes('house') || normalized.includes('rent') || normalized.includes('mortgage')) return Home;
    if (normalized.includes('transport') || normalized.includes('gas') || normalized.includes('car') || normalized.includes('auto')) return Bus;
    if (normalized.includes('entertain') || normalized.includes('fun') || normalized.includes('movie')) return Tv;
    if (normalized.includes('electric') || normalized.includes('utility') || normalized.includes('bill')) return Zap;
    if (normalized.includes('income') || normalized.includes('salary') || normalized.includes('paycheck')) return Banknote;
    if (normalized.includes('transfer')) return ArrowRightLeft;
    if (normalized.includes('withdraw')) return ArrowUpFromLine;
    if (normalized.includes('contribut') || normalized.includes('deposit')) return ArrowDownToLine;
    if (normalized.includes('buy') || normalized.includes('purchase')) return TrendingUp;
    if (normalized.includes('sell')) return TrendingDown;
    if (normalized.includes('dividend') || normalized.includes('interest')) return BadgePercent;
    if (normalized.includes('fee')) return Landmark;
    return CircleDollarSign;
}
