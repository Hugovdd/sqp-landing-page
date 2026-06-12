# Onboarding a tool's telemetry

How to get a new Sidequest Plugins tool reporting into the telemetry platform.
There are two tracks:

- **Track A — new product, existing events.** The tool only emits events the
  platform already understands (`session`, `error`, `fetch`, `duplication_run`,
  `app_installed`). This is **one code edit** plus client work and a redeploy.
- **Track B — new event type or metric.** The tool needs a bespoke event, props,
  or a dedicated dashboard view. This is real (but small and patterned) code.

Single source of truth: **`packages/shared/src/products.ts`** (`PRODUCT_REGISTRY`).
Both the ingest validator's accepted brands and the dashboard's product switcher
derive from it, so they can't drift. There is an `sqp-onboard-telemetry` Claude
skill that drives this runbook interactively.

---

## The wire contract (envelope)

Every event is a `POST https://telemetry.sidequestplugins.com/e` with a JSON body.
Fire-and-forget: the endpoint **always returns `204`** (valid, malformed, or
disabled) and writes happen in the background. There is **no auth** — protection
is WAF rate-limiting plus the `TELEMETRY_ENABLED` kill switch.

```jsonc
{
  "v": 1,                       // protocol version, must be 1
  "installId": "f47ac10b-58cc-4372-a567-0e02b2c3d479", // UUID, persistent per install
  "event": "session",          // event name (1–64 chars)
  "ts": 1718200000000,          // client epoch ms (sanity-bounded; server uses receivedAt)
  "app": {
    "brand": "ae",             // MUST be a brand in PRODUCT_REGISTRY
    "appVersion": "1.2.3",
    "aeVersion": "24.0",       // optional
    "os": "macOS 14"            // optional
  },
  "props": {}                   // event-specific; see envelope.ts
}
```

Shapes for each event live in `packages/shared/src/envelope.ts`; validation +
bounds in `packages/shared/src/validate.ts`. Unknown event names still pass the
spine and are stored raw (`known: false`) for later.

---

## Track A — new product, existing events

1. **Add the product to the registry** — `packages/shared/src/products.ts`:

   ```ts
   export const PRODUCT_REGISTRY = {
     "ae-sheets": { label: "AE Sheets", brands: ["ae", "binance"] },
     // ...
     "my-tool": { label: "My Tool", brands: ["my-tool"] }, // ← add
   } as const;
   ```

   The `brands` slug(s) are the exact `app.brand` string(s) the client sends. A
   product can map to several brands (sub-versions) — they're unioned in the UI.

   That single edit flows everywhere automatically: `BRANDS` and the `Brand` type
   widen, the ingest validator (`z.enum(BRANDS)`) starts accepting the new brand,
   and the dashboard product switcher + every `brand IN (...)` query pick it up.
   The `counters` row self-seeds on first `duplication_run` (upsert in
   `apps/ingest/src/index.ts`) — no migration needed.

   > Note: the registry doubles as the **ingest accept-list**. Listing a product
   > here immediately makes the open ingest endpoint accept its brand(s), even
   > before the client ships — intended, but be aware it's a (small) widening of
   > what the endpoint stores, not only a UI change.

2. **Point the client at the new brand.** Have the tool send envelopes with
   `app.brand: "my-tool"` and the appropriate events.

3. **Verify + deploy** — see [Deploy](#deploy-checklist). The product appears as
   an (initially empty) view in the dashboard until data arrives.

---

## Track B — new event type / metric

Do Track A first (the product must exist), then:

1. **Declare the event** — `packages/shared/src/constants.ts`: add the name to
   `KNOWN_EVENTS`.
2. **Type its props** — `packages/shared/src/envelope.ts`: add a `…Props`
   interface.
3. **Validate + bound it** — `packages/shared/src/validate.ts`: add an entry to
   `PropsByEvent` with sanity bounds (reuse the bound constants in `constants.ts`;
   add new ones there if needed). `.catchall(z.unknown())` keeps it forward-compat.
4. **Store it** — `apps/ingest/src/index.ts` `writeEvent()`:
   - If it fits the existing `usage_events` columns, add a `case` that calls
     `insertUsage(...)`. Reusing raw columns needs no migration.
   - If it needs new columns/a new table, add a migration under
     `apps/ingest/migrations/` (see `0001_init.sql`) and apply it (below).
5. **Query it** — `apps/dashboard/src/lib/telemetry/queries.ts`: add a function
   following the existing ones (e.g. `getDuplication`). **Always** append
   `productFilter(f)`'s `.sql` last and its `.binds` at the end of the bind array
   so product scoping works.
6. **Show it** — add a page under `apps/dashboard/src/app/(admin)/<name>/page.tsx`
   (parse filters via `filterCache` → `resolveFilters`, call your query) and a
   sidebar entry in `apps/dashboard/src/data/sidebar-data.tsx`.
7. **Update the shared tests** — `packages/shared/src/validate.test.ts` for the
   new event's accept/reject cases.

---

## Deploy checklist

1. `pnpm shared:test` — wire-contract tests pass.
2. `pnpm dashboard:build` — typecheck + build (catches drift / bad imports).
3. Apply any new migration (Track B only): `pnpm -F @sqp/ingest db:migrate:local`
   to test locally, then `pnpm -F @sqp/ingest db:migrate` for production (both wrap
   `wrangler d1 migrations apply DB`). See `docs/TELEMETRY-DEPLOYMENT.md`.
4. Deploy ingest: `pnpm ingest:deploy`.
5. Deploy dashboard: `pnpm -F @sqp/dashboard deploy`.
6. Smoke: send a test envelope with the new `brand`; confirm it appears in the
   dashboard for that product.

## See also

- `CONTEXT.md` — installId / brand / product / session vocabulary.
- `docs/TELEMETRY-DEPLOYMENT.md` — secrets, D1 binding, local dev, retention.
- `docs/adr/0001-d1-single-store-for-telemetry.md` — why D1.
