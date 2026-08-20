# Sidequest Plugins admin dashboard

Internal product dashboard deployed to Cloudflare through OpenNext. Cloudflare Access enforces
identity in front of the application.

## Getting Started

Install dependencies

```bash
pnpm install
```

Start the server

```bash
pnpm run dev
```

## Data bindings

- `DB` - shared telemetry D1.
- `ALTAR_WAITLIST` - read-only Altar beta lifecycle data. The People page fails
  visibly when this binding is absent or unavailable; it never treats a query
  failure as an empty list.
- `ALTAR_VAULT_CATALOG` - read-only Altar Teams, Memberships, and Team Invites.
  The Teams page fails visibly when this binding is absent or unavailable.

The Altar admin integration lives in `src/lib/altar-admin.ts`. Keep this seam
server-only. Access-invite / waitlist lifecycle stays read-only. Team Invites
are minted and emailed through the vault-signing Worker; the dashboard never
writes Membership itself.

## Altar email previews

The Email Templates page fetches live renderings from the waitlist Worker over HTTP. It does not
query waitlist D1 for email HTML or text, and it never stores a second copy of those bodies.

- `ALTAR_WAITLIST_URL` - waitlist Worker origin. Defaults to `https://waitlist.motionaltar.com` when
  unset. Also set as a Wrangler `vars` value.
- `ALTAR_ADMIN_TOKEN` - server-only bearer token for `GET /admin/email-previews` and
  `POST /admin/team-invite`. Set with `wrangler secret put ALTAR_ADMIN_TOKEN` or in `.dev.vars`
  for local `next dev`. Do not commit this value and do not expose it to the browser.

Requests use `cache: "no-store"` so a Worker deploy cannot leave the dashboard showing stale
templates. Missing token, 401, network/5xx, malformed payloads, and an empty template list each have
an explicit page state.

## Altar Team Invites

- `ALTAR_VAULT_URL` - vault-signing Worker origin. Defaults to `https://sign.motionaltar.com`.
- Mutations go to `POST {ALTAR_VAULT_URL}/admin/team-invite` with the same
  `ALTAR_ADMIN_TOKEN`. The browser never receives the token or the raw mutation URL.

## Tech Stack

- shadcn/ui 4
- TailwindCSS v4
- Next.js 16
- React 19
- TypeScript
- Eslint v9
- Prettier
