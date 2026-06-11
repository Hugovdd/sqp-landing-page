"use client";

import { useQueryStates } from "nuqs";

import { DateRangePicker } from "@/components/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BRAND_LABELS,
  BRAND_VALUES,
  type BrandFilter,
  filterParsers,
} from "@/lib/telemetry/filter-params";

function ymd(d: Date | undefined): string {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

// Default display window = last 30 days, matching the server's resolveFilters()
// default when no range is in the URL. Stable per module load.
const DAY = 86_400_000;
const DEFAULT_FROM = new Date(Date.now() - 29 * DAY).toISOString().slice(0, 10);
const DEFAULT_TO = new Date().toISOString().slice(0, 10);

/**
 * Brand + date-range filter, persisted to the URL via nuqs. `shallow: false`
 * triggers a server re-render so the Server Component pages re-query D1.
 */
export function FilterBar() {
  const [{ brand, from, to }, setFilters] = useQueryStates(filterParsers, {
    shallow: false,
  });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={brand}
        onValueChange={(v) => setFilters({ brand: v as BrandFilter })}
      >
        <SelectTrigger className="w-[180px] text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {BRAND_VALUES.map((b) => (
            <SelectItem key={b} value={b}>
              {BRAND_LABELS[b]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
