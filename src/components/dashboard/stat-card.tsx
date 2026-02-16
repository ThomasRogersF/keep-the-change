"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("transition-colors", className)}>
      <CardContent className="flex items-center gap-4 py-4">
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full shrink-0",
          trend === "up" && "bg-success/10 text-success",
          trend === "down" && "bg-destructive/10 text-destructive",
          !trend || trend === "neutral" ? "bg-primary/10 text-primary" : ""
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-xl font-semibold tabular-nums tracking-tight truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
