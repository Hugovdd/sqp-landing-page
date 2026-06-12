// Isomorphic nuqs parsers (safe in client + server). The server cache lives in
// filters.ts (which pulls nuqs/server); keep these split so the client filter
// bar and product switcher can import the parsers without dragging in
// server-only code.

// Import parsers from nuqs/server: they're isomorphic (safe in client too) and
// usable in createSearchParamsCache. Importing from "nuqs" would mark them
// client-only and break the server cache.
import {
  type Brand,
  PRODUCT_REGISTRY,
  type ProductKey,
} from "@sqp/shared/products";
import { parseAsString, parseAsStringEnum } from "nuqs/server";

// Products are defined once in @sqp/shared (PRODUCT_REGISTRY) — the same source
// the ingest validator derives its accepted brands from — so the dashboard and
// the wire contract can never drift. A *product* is the user-facing unit; each
// install carries a wire-level `brand`, and a product maps to one or more brands
// so the dashboard can group sub-versions (AE Sheets owns "ae" + "binance").
// The synthetic "all" option (no brand filter = whole user base) is layered on
// top of the registry here.
export const PRODUCT_VALUES = ["all", ...Object.keys(PRODUCT_REGISTRY)] as [
  "all",
  ...ProductKey[],
];
export type ProductFilter = "all" | ProductKey;

export const PRODUCTS = {
  all: { label: "All products", brands: [] as Brand[] },
  ...Object.fromEntries(
    Object.entries(PRODUCT_REGISTRY).map(
      ([key, p]) =>
        [key, { label: p.label, brands: [...p.brands] as Brand[] }] as const,
    ),
  ),
} as Record<ProductFilter, { label: string; brands: Brand[] }>;

export const filterParsers = {
  product: parseAsStringEnum([...PRODUCT_VALUES]).withDefault("all"),
  from: parseAsString.withDefault(""), // YYYY-MM-DD
  to: parseAsString.withDefault(""), // YYYY-MM-DD
};
