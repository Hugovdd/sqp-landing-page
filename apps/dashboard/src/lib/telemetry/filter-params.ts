// Isomorphic nuqs parsers (safe in client + server). The server cache lives in
// filters.ts (which pulls nuqs/server); keep these split so the client filter
// bar can import the parsers without dragging in server-only code.

// Import parsers from nuqs/server: they're isomorphic (safe in client too) and
// usable in createSearchParamsCache. Importing from "nuqs" would mark them
// client-only and break the server cache.
import { parseAsString, parseAsStringEnum } from "nuqs/server";

export const BRAND_VALUES = ["all", "ae", "binance"] as const;
export type BrandFilter = (typeof BRAND_VALUES)[number];

export const BRAND_LABELS: Record<BrandFilter, string> = {
  all: "All brands",
  ae: "AE Sheets",
  binance: "Binance Localiser",
};

export const filterParsers = {
  brand: parseAsStringEnum([...BRAND_VALUES]).withDefault("all"),
  from: parseAsString.withDefault(""), // YYYY-MM-DD
  to: parseAsString.withDefault(""), // YYYY-MM-DD
};
