"use client";

import { ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";

interface IncomeTrendChartProps {
    data: Array<{ label: string; income: number }>;
}

export function IncomeTrendChart({ data }: IncomeTrendChartProps) {
    const fmt = useCurrencyFormatter();

    if (!data || data.length === 0) return null;

    return (
        <div className="h-[90px] w-full mt-4 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                    <Tooltip
                        cursor={{ stroke: 'var(--color-muted)', strokeWidth: 1, strokeDasharray: '4 4' }}
                        content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            return (
                                <div className="rounded-lg border bg-popover text-popover-foreground shadow-sm px-3 py-2 text-xs font-medium">
                                    <p className="text-muted-foreground mb-1">{label}</p>
                                    <p className="text-success text-sm">{fmt(payload[0].value as number)}</p>
                                </div>
                            );
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="income"
                        stroke="var(--color-success)"
                        fill="var(--color-success)"
                        fillOpacity={0.15}
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
