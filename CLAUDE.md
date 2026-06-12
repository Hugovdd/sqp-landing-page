# Sidequest Plugins — monorepo

pnpm workspace (`pnpm@10`, Node ≥22) for **Sidequest Plugins** (After Effects
plugins): a marketing site and an internal admin dashboard (telemetry today,
more business areas planned).

## Layout

- **`apps/landing`** — Astro marketing site (`sidequestplugins.com`). Content in
  Markdown/MDX + Zod frontmatter; site config in `src/consts.ts`. Mailgun email,
  LemonSqueezy checkout, Turnstile.
- **`apps/ingest`** — Cloudflare Worker, `POST /e` telemetry ingestion → D1.
- **`apps/dashboard`** — Next.js admin dashboard (deployed via
  `@opennextjs/cloudflare`). Telemetry (reads D1 directly) is its first area;
  planned: customer feedback, shop/sales performance, landing-page analytics.
- **`packages/shared`** — wire contract shared by ingest + dashboard. Product/brand
  vocabulary lives in `src/products.ts` (`PRODUCT_REGISTRY`, the single source of
  truth); event validation in `src/validate.ts`.

## Conventions

- **No CI/CD — deploys are manual.** Pushing ships nothing. Per app:
  `pnpm landing:deploy`, `pnpm ingest:deploy`, `pnpm -F @sqp/dashboard deploy`
  (dashboard must build via opennextjs, not `next build`).
- Branch off `main` for changes; commit/push only when asked.

## Docs

- `CONTEXT.md` — telemetry domain vocabulary (install/brand/product/session).
- `docs/TELEMETRY-DEPLOYMENT.md` — infra, secrets, D1, deploy.
- `docs/ONBOARDING-TELEMETRY.md` — add a new tool's telemetry.
