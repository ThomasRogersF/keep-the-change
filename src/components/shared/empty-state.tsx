import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4",
        className
      )}
    >
      {/* Decorative background circle */}
      <div className="relative mb-6">
        <div className="absolute inset-0 -m-4 rounded-full bg-primary/5" />
        <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
          <Icon className="w-8 h-8 text-primary" />
        </div>
      </div>

      <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
        {description}
      </p>

      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}
