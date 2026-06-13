# Telemetry platform — deployment & infra

Three Cloudflare Workers + one D1 database. See [`../CONTEXT.md`](../CONTEXT.md) for
domain terms and [`adr/0001-d1-single-store-for-telemetry.md`](./adr/0001-d1-single-store-for-telemetry.md)
for the storage rationale.

| Worker                 | App              | Hostname                          |
| ---------------------- | ---------------- | --------------------------------- |
| `sqp-landing-page`     | `apps/landing`   | `sidequestplugins.com`            |
| `sqp-telemetry-ingest` | `apps/ingest`    | `telemetry.sidequestplugins.com`  |
| `sqp-admin-dashboard`  | `apps/dashboard` | `dashboard.sidequestplugins.com`  |

The ingest Worker (write) and the dashboard (read) share one D1 database, `sqp-telemetry`.

## One-time setup (requires `wrangler login`)

1. **Create the D1 database:**
   ```bash
   cd apps/ingest && wrangler d1 create sqp-telemetry
   ```
   Copy the printed `database_id` into **both** wrangler configs, replacing the
   `00000000-…` placeholder:
   - `apps/ingest/wrangler.jsonc`
   - `apps/dashboard/wrangler.jsonc`

2. **Apply the schema (remote):**
   ```bash
   cd apps/ingest && wrangler d1 migrations apply DB --remote
   ```

3. **Cloudflare Access** — gate the dashboard (this *is* the auth; there is no in-app login).
   Zero Trust → Access → Applications → Add → Self-hosted:
   - Application domain: `dashboard.sidequestplugins.com`
   - Policy: Allow → emails / email-domain allowlist (e.g. the team).
   The Worker then only ever sees authenticated requests; `Cf-Access-Jwt-Assertion`
   is available for optional in-Worker re-verification.

4. **WAF rate-limit** — protect the open ingest endpoint (decision 5).
   Security → WAF → Rate limiting rules, on the zone:
   - When incoming requests match `hostname eq "telemetry.sidequestplugins.com"`
     (optionally `and path eq "/e"`)
   - Rate: e.g. **> 60 requests / 10s per IP** → Block (or Managed Challenge).
   This is drive-by protection, not auth — strict envelope validation + sanity bounds
   in the Worker do the rest.

## Deploy

```bash
# Ingest Worker (telemetry.sidequestplugins.com)
pnpm ingest:deploy           # = wrangler deploy in apps/ingest

# Dashboard (dashboard.sidequestplugins.com)
# The deploy script runs `opennextjs-cloudflare build` first — do NOT use
# `next build` (it writes .next, not the .open-next bundle wrangler ships).
pnpm dashboard:deploy

# Landing (unchanged)
pnpm landing:deploy
```

The custom domains are provisioned by the `routes: [{ custom_domain: true }]` entries on
first deploy. Both new workers set `workers_dev:false` / `preview_urls:false`, matching the
landing hygiene (custom-domain-only, no duplicate URLs).

## Secrets / config

- **`TELEMETRY_ENABLED`** (ingest) — a plain `var` in `apps/ingest/wrangler.jsonc`, default
  `"true"`. The kill switch: set to anything else (edit + redeploy, or change in the
  dashboard) to make ingest accept-and-discard (204, no writes).
- **No runtime secrets** are required by either new Worker (D1 is a binding; dashboard auth
  is Access). Do **not** add `SHADCNBLOCKS_API_KEY` to any `.dev.vars` or `wrangler secret` —
  it is build/authoring-only (the dashboard vendors the Admin Kit, so it isn't even needed at
  build time).

## Retention

`apps/ingest` runs a daily cron (`0 4 * * *`) pruning `usage_events` + `daily_active` older
than ~18 months and `errors` older than ~90 days. `installs` and `counters` are never pruned
(the lifetime comps total lives in `counters`).

## Local development

```bash
# Ingest: apply schema to a local D1, run, and exercise it
cd apps/ingest
wrangler d1 migrations apply DB --local
pnpm dev                                   # http://localhost:8787
curl -X POST localhost:8787/e -H 'content-type: application/json' \
  -d '{"v":1,"installId":"<uuid>","event":"session","ts":'$(($(date +%s)*1000))',"app":{"brand":"ae","appVersion":"1.1.1"},"props":{}}'

# Dashboard: seed a local D1 (shared schema + sample data), then run
cd apps/dashboard
wrangler d1 execute DB --local --file ../ingest/migrations/0001_init.sql
wrangler d1 execute DB --local --file ../ingest/seed.dev.sql
pnpm dev                                   # http://localhost:3000  (getCloudflareContext → local D1)
```

## Follow-ups / not yet built

- Geography is a ranked country bar-list; the Admin Kit's MapLibre map (`@/components/ui/map`)
  is available for a future choropleth upgrade.
- No CI/CD — deploys are manual (matches the existing landing convention).
