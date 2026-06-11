import { fmt } from "./stat-card";

export interface BarListItem {
  key: string;
  count: number;
}

/** A simple ranked horizontal bar list (OS / version / country breakdowns). */
export function BarList({
  items,
  emptyLabel = "No data",
}: {
  items: BarListItem[];
  emptyLabel?: string;
}) {
  const max = items.reduce((m, i) => Math.max(m, i.count), 0) || 1;
  const total = items.reduce((s, i) => s + i.count, 0);

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyLabel}</p>;
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((i) => {
        const pct = total > 0 ? (i.count / total) * 100 : 0;
        return (
          <li key={i.key} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate font-medium">{i.key}</span>
              <span className="text-muted-foreground tabular-nums">
                {fmt(i.count)}
                <span className="ml-1 text-xs">({pct.toFixed(1)}%)</span>
              </span>
            </div>
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${(i.count / max) * 100}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
