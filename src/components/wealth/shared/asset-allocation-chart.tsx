"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";

export interface AllocationDatum {
  label: string;
  value: number;
}

interface AssetAllocationChartProps {
  title: string;
  data: AllocationDatum[];
  emptyMessage?: string;
}

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export function AssetAllocationChart({
  title,
  data,
  emptyMessage = "No data yet",
}: AssetAllocationChartProps) {
  const fmt = useCurrencyFormatter();
  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0 || total === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0];
                  return (
                    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-muted-foreground">
                        {fmt(item.value as number)} ({(((item.value as number) / total) * 100).toFixed(0)}
                        %)
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 mt-2">
          {data.slice(0, 6).map((item, i) => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                <span className="text-muted-foreground truncate">{item.label}</span>
              </div>
              <span className="font-medium tabular-nums shrink-0">{fmt(item.value)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
