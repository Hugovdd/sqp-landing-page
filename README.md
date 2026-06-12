# Sidequest Plugins — Platform Monorepo

pnpm workspace for the Sidequest Plugins web + telemetry platform.

## Apps & packages

| Path             | What                                                                 |
| ---------------- | ------------------------------------------------------------------- |
| `apps/landing`   | Marketing site — Astro on Cloudflare Workers (`sidequestplugins.com`) |
| `apps/ingest`    | Telemetry ingestion Worker (`telemetry.sidequestplugins.com`)        |
| `apps/dashboard` | Admin telemetry dashboard — Next.js/OpenNext (`dashboard.sidequestplugins.com`) |
| `packages/shared`| `@sqp/shared` — telemetry envelope types, validators, scrubber, D1 schema |

## Domain & decisions

- [`CONTEXT.md`](./CONTEXT.md) — telemetry glossary (source of truth for terminology).
- [`docs/adr/`](./docs/adr/) — architecture decision records.

## Common commands

```bash
pnpm install              # install all workspaces
pnpm landing:dev          # run the landing site
pnpm ingest:dev           # run the ingestion Worker locally
pnpm dashboard:dev        # run the dashboard
pnpm -r --if-present lint # lint everything
```
