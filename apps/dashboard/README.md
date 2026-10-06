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

Altar admin pages (People, Teams, Email Templates) live in `admin.motionaltar.com`
(altar-react `apps/admin`). Altar stays here as a product in the cross-product telemetry views.

## Tech Stack

- shadcn/ui 4
- TailwindCSS v4
- Next.js 16
- React 19
- TypeScript
- Eslint v9
- Prettier
