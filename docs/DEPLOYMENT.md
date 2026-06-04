# Deployment

As of the Astro 6 / `@astrojs/cloudflare` v13 upgrade, this site deploys as a
**Cloudflare Worker** (with static assets), **not** Cloudflare Pages.

`astro build` produces:

- `dist/client/` — static assets (HTML, `_astro/`, images, `_headers`, `_redirects`)
- `dist/server/` — the Worker (`entry.mjs`) + the generated `dist/server/wrangler.json`

The generated `dist/server/wrangler.json` merges our root [`wrangler.jsonc`](../wrangler.jsonc)
(name, compatibility date, `nodejs_compat`) with the adapter's bindings
(`ASSETS`, `SESSION` KV, `IMAGES`). Deploys point wrangler at that generated file.

## Environments

| Env | Worker name | URL | Deploy command |
|---|---|---|---|
| Staging | `sqp-landing-staging` | `sqp-landing-staging.<account>.workers.dev` | `pnpm deploy:staging` |
| Production | `sqp-landing-page` | (custom domain — see below) | `pnpm deploy:production` |

Staging is a **separate worker** rather than a wrangler `[env.staging]` block,
because the Astro 6 adapter currently drops env-specific settings from the
generated config. `deploy:staging` just overrides the worker name with `--name`.

## Local secrets (1Password)

The real `.env` is gitignored, so it doesn't travel with the repo. 1Password is
the source of truth; [`.env.tpl`](../.env.tpl) holds `op://` references (safe to
commit) that resolve back into `.env`.

**First time (seed 1Password from your current `.env`):**
```
brew install 1password-cli                 # then enable: 1Password app →
                                           # Settings → Developer → Integrate with CLI
pnpm env:seed                              # creates the "sqp-landing-page" item from .env
```

**On a new laptop (restore secrets from 1Password):**
```
brew install 1password-cli && op signin
pnpm env:pull                              # writes .env AND derives .dev.vars
```

If your 1Password vault/item names differ from `Private` / `sqp-landing-page`,
update the `op://` paths in `.env.tpl` (and pass the vault to `pnpm env:seed <vault>`).

### `.env` vs `.dev.vars` (and no secrets in the bundle)

Two gitignored files, both derived from 1Password:

- **`.env`** — read by Vite at build time. Holds only build-time/public values
  (e.g. `PUBLIC_TURNSTILE_SITE_KEY`, which is inlined into the client bundle).
- **`.dev.vars`** — read by the Cloudflare Workers runtime (`astro dev` /
  `astro preview` / Playwright) at request time. Holds the **server secrets**
  (Mailgun, Turnstile secret, `SUBSCRIBE_SECRET`, `CONTACT_TO_EMAIL`).
  `pnpm env:pull` derives it from `.env`; `wrangler deploy` never uploads it.

The API routes read secrets **only** from the Workers `env`
(`import { env } from "cloudflare:workers"`) — Worker secrets in prod/staging,
`.dev.vars` locally. There is intentionally **no `import.meta.env` fallback**, so
secret values are never inlined into the deployed worker bundle.

## One-time setup

1. **Authenticate wrangler** (interactive, your Cloudflare account):
   ```
   npx wrangler login
   ```
2. **Set server secrets** on each worker. The public Turnstile site key is
   build-time/public (read from `.env` during `astro build`); the rest are
   secrets and must be set per worker:
   ```
   # Staging
   npx wrangler secret put MAILGUN_API_KEY     --name sqp-landing-staging
   npx wrangler secret put MAILGUN_DOMAIN      --name sqp-landing-staging
   npx wrangler secret put SUBSCRIBE_SECRET    --name sqp-landing-staging
   npx wrangler secret put TURNSTILE_SECRET_KEY --name sqp-landing-staging
   npx wrangler secret put CONTACT_TO_EMAIL    --name sqp-landing-staging
   npx wrangler secret put MAILGUN_REGION      --name sqp-landing-staging   # or MAILGUN_EU

   # Production: same commands with --name sqp-landing-page
   ```

   > **⚠️ Turnstile keys must be deployed together.** `/api/contact` is
   > fail-closed: when `TURNSTILE_SECRET_KEY` is set as a runtime secret, the
   > endpoint rejects any submission without a `cf-turnstile-response` token.
   > The token only exists if the client widget renders, which requires
   > `PUBLIC_TURNSTILE_SITE_KEY` to be present in `.env` **at build time**. If
   > the runtime secret is set but the build-time public key is missing, **every
   > contact submission is rejected (400)**. Set both (or neither) per
   > environment.
   The `SESSION` KV namespace is **auto-provisioned** by wrangler on first deploy.

## Deploy

```
pnpm deploy:staging      # build + deploy to sqp-landing-staging.workers.dev
pnpm deploy:production    # build + deploy to the sqp-landing-page worker
```

Validate a build without deploying (no account needed):
```
pnpm build && npx wrangler deploy --config dist/server/wrangler.json --dry-run
```

Local preview runs the real `workerd` runtime:
```
pnpm preview
```

## Production cutover (TODO — not done yet)

Production still auto-deploys via the **Cloudflare Pages → GitHub** integration
on push to `main`, which expects the old Pages output (`dist/_worker.js`). The
Astro 6 output is no longer Pages-compatible, so **merging the upgrade to `main`
will break the Pages build.** Before merging:

1. Validate everything on staging (`pnpm deploy:staging`).
2. Create/point the production Worker (`sqp-landing-page`) and attach the custom
   domain / route for `sidequestplugins.com` (Workers → Custom Domains).
3. Set production secrets (above).
4. Switch the deploy trigger: either run `pnpm deploy:production` manually/from
   CI, or set up **Cloudflare Workers Builds** (git integration for Workers) and
   disconnect the old Pages project.
5. Ensure the build environment uses **Node 22.12+** (Astro 6 dropped Node ≤20;
   the old Pages settings used Node 20).
6. Re-check the `/docs` multi-zone proxy to the Vercel Docusaurus site still
   routes correctly under the Worker.
