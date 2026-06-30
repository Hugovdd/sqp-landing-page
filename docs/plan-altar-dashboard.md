# Plan: make the Altar dashboard app-specific

Hand-off spec for the dashboard agent. Repo: `sqp-landing-page`.

## Goal

1. Stop showing the same generic 7-item sidebar for every product. Sidebar + sections must be driven by the selected product.
2. Fix Altar tool usage not displaying (it emits real data today, the query just filters the wrong pane).
3. Populate Forge richly now. Chat + Vault are placeholders (telemetry deferred Track B).
4. Adding a new Forge tool must stay zero-config (it already is - dynamic `GROUP BY tool`).

## Root cause of "no tool use for Altar"

- Altar emits `tool_used { pane: "forge", tool, action }` (client: `apps/panel/src/js/services/ae-bridge.ts` `runTool()` + Primitives). Confirmed.
- Dashboard `getToolUsage(f, pane = "rigging")` in `apps/dashboard/src/lib/telemetry/queries.ts` hardcodes `pane='rigging'`, and `tools/page.tsx` calls it with no override. The page is even titled "Rigging tools" - it's an AE-Sheets surface.
- So `?product=altar` → `pane='rigging'` → zero rows. Not a missing query; a hardcoded-pane mismatch in a non-product-aware section.
- Secondary: local seed `apps/ingest/seed.dev.sql` has no `altar` / no `tool_used` rows, so it's empty locally for everyone. Needs altar seed rows to dev against.

## Design: the product registry is the single source of truth

Extend `PRODUCT_REGISTRY` in `packages/shared/src/products.ts` (today only `{ label, brands }`) to declare each product's dashboard nav. This keeps Track-A onboarding to "one edit in products.ts" and makes the sidebar/sections derive from data, not hardcoded JSX.

Proposed shape (adjust naming to house style):

```ts
type NavItem =
  | { key: "overview" | "errors" | "geography" | "breakdowns" | "licensing" | "duplication" }
  // pane-scoped tool-usage section; same /tools route, discriminated by ?pane=
  | { key: "tools"; label: string; pane: string; placeholder?: boolean }

type ProductConfig = {
  label: string
  brands: Brand[]
  nav: NavItem[]
}
```

Entries:

```ts
"ae-sheets": {
  label: "AE Sheets", brands: ["ae", "binance"],
  nav: [ {key:"overview"}, {key:"duplication"},
         {key:"tools", label:"Rigging tools", pane:"rigging"},
         {key:"licensing"}, {key:"geography"}, {key:"breakdowns"}, {key:"errors"} ],
},
"find-and-replace-fonts": {
  label: "Find and Replace Fonts", brands: ["fff"],
  nav: [ {key:"overview"}, {key:"geography"}, {key:"errors"} ], // trim to what FFF emits
},
altar: {
  label: "Altar", brands: ["altar"],
  nav: [ {key:"overview"},
         {key:"tools", label:"Forge", pane:"forge"},
         {key:"tools", label:"Chat",  pane:"chat",  placeholder:true},
         {key:"tools", label:"Vault", pane:"vault", placeholder:true},
         {key:"errors"}, {key:"geography"}, {key:"breakdowns"} ],
},
```

This intentionally drops `licensing`/`duplication` from Altar (AE-Sheets-only) - that alone makes Altar's sidebar app-specific.

## Changes, file by file

### 1. Registry — `packages/shared/src/products.ts`
- Add the `nav` field + `NavItem`/`ProductConfig` types as above. Keep existing derived exports (`ProductKey`, `Brand`, `BRANDS`).
- Export a helper `productNav(key): NavItem[]`.

### 2. Product-aware sidebar
- `apps/dashboard/src/components/layout/app-sidebar.tsx`: read the active product from the `?product=` param (same source `product-switcher.tsx` writes via nuqs), look up its `nav`, render only those items. Falls back to a sane default if param missing.
- `apps/dashboard/src/data/sidebar-data.tsx`: convert the static `navGroups` into a keyed lookup `SECTION_NAV: Record<NavKey, {title, url, icon}>` so the sidebar can assemble items from a product's `nav`. For `key:"tools"` items, title = item.label, url = `/tools?pane=<pane>` (carry product through).
- `components/layout/types.ts`: update types as needed.
- Make sure product switches preserve nav: switching product should re-resolve the sidebar and not 404 on a section the new product lacks.

### 3. Pane-driven tools page (the actual fix)
- `apps/dashboard/src/lib/telemetry/queries.ts` `getToolUsage`: remove the `pane = "rigging"` default. Require pane (or accept `panes: string[]` → `pane IN (...)`). Keep the `GROUP BY tool` and `GROUP BY tool, action` rankings (zero-config new tools).
- `apps/dashboard/src/app/(admin)/tools/page.tsx`: read `?pane=` (and `?product=`), set the page title from the matching nav item's label, call `getToolUsage(f, pane)`. If the nav item is `placeholder:true` (Chat/Vault), render an empty state ("Telemetry not wired yet") instead of querying.

### 4. Forge enrichment (Forge has data now - make the page worth visiting)
Add queries in `queries.ts`, all scoped `event='tool_used' AND pane='forge'` + the standard brand/time filter:
- **Top tools** - bar list, by count. (already from `getToolUsage`)
- **Tool · action breakdown** - bar list. (already)
- **Usage over time** - `GROUP BY date(receivedAt)` line/area chart (new).
- **Reach per tool** - `COUNT(DISTINCT installId)` per tool, how many installs touched each tool (new). Distinguishes "used a lot by few" vs "broad adoption".
- **Active installs using Forge** - stat card, distinct installs with any `pane='forge'` event in range (new).
Render with existing `ChartCard`/`StatCard`/`BarList`/`charts.tsx`. No new primitives needed.

### 5. Placeholders (Chat / Vault)
- Their nav items exist (so the app feels complete) but `placeholder:true` → the tools page shows an empty state. No queries, no crash on zero rows.
- When Chat/Vault telemetry ships (`chat_turn`, `asset_used`, or `tool_used{pane:"chat"/"vault"}`), flip `placeholder` off - the same pane-driven page lights up automatically.

## Why new tools stay zero-config
The dashboard groups dynamically by the free-text `tool` column - a brand-new Forge tool id just appears in the ranking, no platform or dashboard edit. Document this in `docs/ONBOARDING-TELEMETRY.md`. Only friendly tool *labels* would need a map; skip for now, show raw ids (they're already human-ish registry ids). Optional later: an opt-in `toolLabels` map per product.

## Verification (don't trust HTTP 204 - validation is silent)
1. Add altar `tool_used{pane:"forge"}` rows to `apps/ingest/seed.dev.sql` (a few tools, varied actions, multiple installIds, spread over dates) so the page renders locally.
2. Run dashboard, select Altar: sidebar shows Overview/Forge/Chat/Vault/Errors/Geography (NOT licensing/duplication). Forge page shows tool rankings + new charts. Chat/Vault show placeholder. AE Sheets still shows its original sidebar.
3. Confirm rows actually render (not just 204 from ingest).

## Sequencing
1. Fix pane + seed (smallest change that makes Forge data appear). 
2. Product registry `nav` + product-aware sidebar.
3. Forge enrichment queries/charts.
4. Placeholders polish.

## Out of scope
- Client-side Chat/Vault event emission (separate Track B work in `altar-react` `sidecar.ts` / vault services).
- Friendly tool-label mapping.
