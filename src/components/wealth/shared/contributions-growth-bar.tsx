"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";

interface ContributionsGrowthBarProps {
  totalContributions: number;
  totalGrowth: number;
}

export function ContributionsGrowthBar({ totalContributions, totalGrowth }: ContributionsGrowthBarProps) {
  const fmt = useCurrencyFormatter();
  const data = [
    { label: "Contributions", value: totalContributions, fill: "var(--color-chart-1)" },
    {
      label: "Growth",
      value: totalGrowth,
      fill: totalGrowth >= 0 ? "var(--color-success)" : "var(--color-destructive)",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Contributions vs. Growth</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="label"
                width={90}
                tickLine={false}
                axisLine={false}
                className="text-xs"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0];
                  return (
                    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
                      <p className="font-medium">{item.payload.label}</p>
                      <p className="text-muted-foreground">{fmt(item.value as number)}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
