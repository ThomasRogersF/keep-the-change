"use client";

import { useYieldRateHistory } from "@/lib/hooks/use-savings";

interface RateHistoryListProps {
  profileId: string | undefined;
  rateType: "APY" | "APR";
}

export function RateHistoryList({ profileId, rateType }: RateHistoryListProps) {
  const history = useYieldRateHistory(profileId);

  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No rate history yet.</p>;
  }

  return (
    <ul className="space-y-1">
      {history.map((entry) => (
        <li
          key={entry.id}
          className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/30 transition-colors"
        >
          <div>
            <p className="text-sm font-medium tabular-nums">
              {entry.rate}% {rateType}
            </p>
            {entry.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
          </div>
          <span className="text-xs text-muted-foreground">Effective {entry.effectiveDate}</span>
        </li>
      ))}
    </ul>
  );
}
