"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import type { WealthGrowthPoint } from "@/lib/services/wealth-net-worth.service";

interface WealthGrowthChartProps {
  data: WealthGrowthPoint[];
}

export function WealthGrowthChart({ data }: WealthGrowthChartProps) {
  const fmt = useCurrencyFormatter();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Wealth Over Time</CardTitle>
        <p className="text-xs text-muted-foreground">Approximate, based on contributions and confirmed activity</p>
      </CardHeader>
      <CardContent>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="wealthGrowthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs" />
              <YAxis hide />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
                      <p className="font-medium">{label}</p>
                      <p className="text-muted-foreground">{fmt(payload[0].value as number)}</p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="totalWealth"
                stroke="var(--color-primary)"
                fill="url(#wealthGrowthFill)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
