// Filter resolution (server). The dashboard filters every metric by brand
// (ae | binance | all) and a date range, carried in the URL via nuqs so views
// are shareable and server-readable. Isomorphic parsers live in filter-params.ts.

import { createSearchParamsCache } from "nuqs/server";

import { type BrandFilter, filterParsers } from "./filter-params";

export type { BrandFilter };

export const filterCache = createSearchParamsCache(filterParsers);

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ResolvedFilters {
  brand: BrandFilter;
  fromDay: string; // YYYY-MM-DD (inclusive)
  toDay: string; // YYYY-MM-DD (inclusive)
  fromMs: number; // start of fromDay, UTC
  toMs: number; // end of toDay, UTC
  todayDay: string; // UTC today — for DAU
  mauFromDay: string; // today − 27 — for trailing-28-day MAU
}

function utcDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Apply defaults (last 30 days) and derive the epoch bounds the queries need. */
export function resolveFilters(raw: {
  brand: BrandFilter;
  from: string;
  to: string;
}): ResolvedFilters {
  const now = Date.now();
  const todayDay = utcDay(now);

  const toDay = /^\d{4}-\d{2}-\d{2}$/.test(raw.to) ? raw.to : todayDay;
  const fromDay = /^\d{4}-\d{2}-\d{2}$/.test(raw.from)
    ? raw.from
    : utcDay(now - 29 * DAY_MS);

  return {
    brand: raw.brand,
    fromDay,
    toDay,
    fromMs: Date.parse(`${fromDay}T00:00:00.000Z`),
    toMs: Date.parse(`${toDay}T23:59:59.999Z`),
    todayDay,
    mauFromDay: utcDay(now - 27 * DAY_MS),
  };
}

/** `AND brand = ?` fragment + its bind (empty when "all"). */
export function brandFilter(f: ResolvedFilters): {
  sql: string;
  binds: string[];
} {
  return f.brand === "all"
    ? { sql: "", binds: [] }
    : { sql: " AND brand = ?", binds: [f.brand] };
}
