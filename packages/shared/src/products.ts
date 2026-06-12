// The single source of truth for the telemetry product/brand vocabulary.
//
// A *product* is the user-facing unit Sidequest Plugins ships. A *brand* is the
// wire-level identifier carried by every event (`app.brand`); one install
// belongs to exactly one brand. A product maps to one or more brands so the
// dashboard can group sub-versions under a single name (AE Sheets owns both the
// "ae" plugin and its "binance" localiser build — same tool, different name).
//
// This module is intentionally DEPENDENCY-FREE (no zod, no other imports) so the
// dashboard can consume it via the `@sqp/shared/products` subpath without pulling
// the validator/zod into its bundle. Everything downstream derives from here:
//   - BRANDS / Brand           → the wire contract + ingest validator enum
//   - the dashboard product switcher and its `brand IN (...)` filters
// Onboarding a new tool that reuses existing events is a single edit to
// PRODUCT_REGISTRY (see docs/ONBOARDING-TELEMETRY.md, Track A).

/**
 * Every product, in the order it should appear in the dashboard switcher.
 * `brands` lists the wire-level brand slug(s) the product is fed by. Products
 * with no data yet still appear (as empty views) the moment they're listed here.
 */
export const PRODUCT_REGISTRY = {
  "ae-sheets": { label: "AE Sheets", brands: ["ae", "binance"] },
  "find-and-replace-fonts": {
    label: "Find and Replace Fonts",
    brands: ["fff"],
  },
  altar: { label: "Altar", brands: ["altar"] },
} as const;

/** A product key, e.g. "ae-sheets". */
export type ProductKey = keyof typeof PRODUCT_REGISTRY;

/** Union of every wire-level brand across all products, e.g. "ae" | "binance". */
export type Brand = (typeof PRODUCT_REGISTRY)[ProductKey]["brands"][number];

/**
 * Flat, deduped list of every brand — the wire contract. Drives the ingest
 * validator's accepted-brand enum and any brand-level iteration. Typed as a
 * non-empty tuple so `z.enum(BRANDS)` infers brand literals.
 */
export const BRANDS = [
  ...new Set(Object.values(PRODUCT_REGISTRY).flatMap((p) => [...p.brands])),
] as [Brand, ...Brand[]];
