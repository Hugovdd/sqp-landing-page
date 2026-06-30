import type { ReactNode } from "react";

import { fmt } from "./stat-card";

export interface BarListItem {
  key: string;
  count: number;
  /** Display label; defaults to `key`. */
  label?: string;
  /** Optional leading visual (flag / OS icon). */
  leading?: ReactNode;
}

/**
 * A ranked list (OS / version / country breakdowns). Each row carries a subtle
 * background bar proportional to its share, an optional leading flag/icon, the
 * label, and the count (+ percentage of total).
 */
export function BarList({
  items,
  emptyLabel = "No data",
  showPercent = true,
}: {
  items: BarListItem[];
  emptyLabel?: string;
  showPercent?: boolean;
}) {
  const max = items.reduce((m, i) => Math.max(m, i.count), 0) || 1;
  const total = items.reduce((s, i) => s + i.count, 0);

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyLabel}</p>;
  }

  return (
    <ul className="flex flex-col gap-1">
      {items.map((i) => {
        const pct = total > 0 ? (i.count / total) * 100 : 0;
        return (
          <li
            key={i.key}
            className="relative flex items-center justify-between gap-3 rounded-md px-2 py-1.5"
          >
            <span
              aria-hidden
              className="bg-accent absolute inset-y-0 left-0 rounded-md"
              style={{ width: `${(i.count / max) * 100}%` }}
            />
            <span className="relative flex min-w-0 items-center gap-2.5">
              {i.leading}
              <span className="truncate text-sm font-medium">
                {i.label ?? i.key}
              </span>
            </span>
            <span className="text-muted-foreground relative shrink-0 text-sm tabular-nums">
              {fmt(i.count)}
              {showPercent ? (
                <span className="ml-1 text-xs">({pct.toFixed(1)}%)</span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
