"use client";

import { useQueryStates } from "nuqs";

import { DateRangePicker } from "@/components/date-range-picker";
import { filterParsers } from "@/lib/telemetry/filter-params";

function ymd(d: Date | undefined): string {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

// Default display window = last 30 days, matching the server's resolveFilters()
// default when no range is in the URL. Stable per module load.
const DAY = 86_400_000;
const DEFAULT_FROM = new Date(Date.now() - 29 * DAY).toISOString().slice(0, 10);
const DEFAULT_TO = new Date().toISOString().slice(0, 10);

/**
 * Date-range filter, persisted to the URL via nuqs. `shallow: false` triggers a
 * server re-render so the Server Component pages re-query D1. Product scope is
 * controlled separately by the sidebar product switcher.
 */
export function FilterBar() {
  const [{ from, to }, setFilters] = useQueryStates(filterParsers, {
    shallow: false,
  });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <DateRangePicker
        onUpdate={({ range }) =>
          setFilters({ from: ymd(range.from), to: ymd(range.to ?? range.from) })
        }
        initialDateFrom={from || DEFAULT_FROM}
        initialDateTo={to || DEFAULT_TO}
        align="end"
        locale="en-GB"
        showCompare={false}
      />
    </div>
  );
}
