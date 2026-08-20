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

// Each product also declares its dashboard *nav* — the sections that appear in
// the sidebar when that product is selected. The sidebar/section set is data,
// not hardcoded JSX, so a product only ever shows the surfaces it actually emits
// (Altar has no licensing/duplication; AE Sheets does). A `NavKey` maps to a
// fixed section route (the dashboard owns the title/url/icon); a `tools` item is
// a pane-scoped tool-usage view rendered by the shared /tools page, discriminated
// by `?pane=`. `placeholder` marks a surface whose telemetry isn't wired yet — it
// renders an empty state instead of querying. Adding a product (or re-ordering
// its nav) stays a single edit here (Track A onboarding).

/** A fixed dashboard section with a dedicated route. */
export type NavKey =
  | "overview"
  | "duplication"
  | "licensing"
  | "people"
  | "teams"
  | "email-templates"
  | "geography"
  | "breakdowns"
  | "errors";

/** One sidebar entry: a fixed section, or a pane-scoped tool-usage view. */
export type NavItem =
  | { key: NavKey }
  | { key: "tools"; label: string; pane: string; placeholder?: boolean };

/**
 * The canonical full nav: every section, in order. Used directly by AE Sheets
 * (the product that exercises every surface) and as the fallback for the
 * synthetic "all" scope / any unknown product, so nothing is hidden when looking
 * across products. A product that needs a different set gives its own `nav`.
 */
const DEFAULT_NAV = [
  { key: "overview" },
  { key: "duplication" },
  { key: "tools", label: "Rigging tools", pane: "rigging" },
  { key: "licensing" },
  { key: "geography" },
  { key: "breakdowns" },
  { key: "errors" },
] as const satisfies readonly NavItem[];

/**
 * Every product, in the order it should appear in the dashboard switcher.
 * `brands` lists the wire-level brand slug(s) the product is fed by; `nav`
 * declares its dashboard sections (see above). Products with no data yet still
 * appear (as empty views) the moment they're listed here.
 */
export const PRODUCT_REGISTRY = {
  "ae-sheets": {
    label: "AE Sheets",
    brands: ["ae", "binance"],
    nav: DEFAULT_NAV,
  },
  "find-and-replace-fonts": {
    label: "Find and Replace Fonts",
    brands: ["fff"],
    nav: [{ key: "overview" }, { key: "geography" }, { key: "errors" }],
  },
  altar: {
    label: "Altar",
    brands: ["altar"],
    nav: [
      { key: "overview" },
      { key: "people" },
      { key: "teams" },
      { key: "email-templates" },
      { key: "tools", label: "Forge", pane: "forge" },
      { key: "tools", label: "Chat", pane: "chat", placeholder: true },
      { key: "tools", label: "Vault", pane: "vault", placeholder: true },
      { key: "errors" },
      { key: "geography" },
      { key: "breakdowns" },
    ],
  },
} as const satisfies Record<
  string,
  { label: string; brands: readonly string[]; nav: readonly NavItem[] }
>;

/** The dashboard nav for a product key (falls back to the full default). */
export function productNav(key: string): NavItem[] {
  const p = (PRODUCT_REGISTRY as Record<string, { nav?: readonly NavItem[] }>)[
    key
  ];
  return [...(p?.nav ?? DEFAULT_NAV)];
}

/** The tools-nav entry for a product + pane, if that product declares one. */
export function toolNav(
  key: string,
  pane: string,
): Extract<NavItem, { key: "tools" }> | undefined {
  return productNav(key).find(
    (n): n is Extract<NavItem, { key: "tools" }> =>
      n.key === "tools" && n.pane === pane,
  );
}

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
