// Filter resolution (server). The dashboard filters every metric by product
// (all | ae-sheets | find-and-replace-fonts | altar) and a date range, carried
// in the URL via nuqs so views are shareable and server-readable. A product
// resolves to one or more wire-level brands (see filter-params.ts); the SQL
// filters on `brand IN (...)`. Isomorphic parsers live in filter-params.ts.

import { createSearchParamsCache } from "nuqs/server";

import {
  filterParsers,
  type ProductFilter,
  PRODUCTS,
} from "./filter-params";

export type { ProductFilter };

export const filterCache = createSearchParamsCache(filterParsers);

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ResolvedFilters {
  product: ProductFilter;
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
  product: ProductFilter;
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
    product: raw.product,
    fromDay,
    toDay,
    fromMs: Date.parse(`${fromDay}T00:00:00.000Z`),
    toMs: Date.parse(`${toDay}T23:59:59.999Z`),
    todayDay,
    mauFromDay: utcDay(now - 27 * DAY_MS),
  };
}

/**
 * `AND brand IN (?, ?)` fragment + its binds for the selected product's
 * brands. Empty (no filter) when the product is "all". The fragment is always
 * appended last, so its binds go at the end of the binds array.
 */
export function productFilter(f: ResolvedFilters): {
  sql: string;
  binds: string[];
} {
  const brands = PRODUCTS[f.product].brands;
  if (brands.length === 0) return { sql: "", binds: [] };
  const placeholders = brands.map(() => "?").join(", ");
  return { sql: ` AND brand IN (${placeholders})`, binds: [...brands] };
}
