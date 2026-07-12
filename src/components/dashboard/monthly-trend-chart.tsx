"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { FintechCard } from "@/components/ui/fintech-card";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";

interface MonthlyTrendChartProps {
  data: Array<{
    month: string;
    label: string;
    expenses: number;
    income: number;
  }>;
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const fmt = useCurrencyFormatter();

  return (
    <FintechCard className="p-5 h-full">
      <h3 className="text-base font-semibold mb-2">Monthly Trend</h3>
      <div className="h-[250px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              tickMargin={12}
              className="text-muted-foreground font-medium"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="text-muted-foreground font-medium"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              dx={-8}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-xl border border-black/5 dark:border-white/5 bg-background shadow-lg px-4 py-3 text-sm">
                    <p className="font-semibold mb-2">{label}</p>
                    {payload.map((entry) => (
                      <div key={entry.name} className="flex items-center justify-between gap-4 mb-1">
                        <div className="flex items-center text-muted-foreground">
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full mr-2"
                            style={{ backgroundColor: entry.color }}
                          />
                          {entry.name}
                        </div>
                        <span className="font-semibold tabular-nums tracking-tight text-foreground">
                          {fmt(entry.value as number)}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingTop: '10px' }}
            />
            <Area
              type="monotone"
              dataKey="income"
              name="Income"
              stroke="var(--color-success)"
              fill="var(--color-success)"
              strokeWidth={3}
              fillOpacity={0.08}
              dot={{ r: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="var(--color-destructive)"
              fill="none"
              strokeWidth={3}
              dot={{ r: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </FintechCard>
  );
}
