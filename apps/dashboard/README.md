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
- `ALTAR_WAITLIST` - read-only Altar beta lifecycle data. The People page fails visibly when this
  binding is absent or unavailable; it never treats a query failure as an empty list.

The Altar admin integration lives in `src/lib/altar-admin.ts`. Keep this seam server-only and do not
add invite, resend, grant, or other lifecycle mutations to the dashboard.

## Tech Stack

- shadcn/ui 4
- TailwindCSS v4
- Next.js 16
- React 19
- TypeScript
- Eslint v9
- Prettier
