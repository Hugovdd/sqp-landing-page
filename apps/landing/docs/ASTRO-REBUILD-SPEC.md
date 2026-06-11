# SideQuest Plugins — Astro 5 Rebuild Specification

## Overview

Rebuild the **SideQuest Plugins** marketing website (`sidequestplugins.com`) from scratch using **Astro 5**, based on the [Mainline Astro Template](https://github.com/shadcnblocks/mainline-astro-template). The site sells After Effects plugins and extensions.

### Goals

- Replicate the **exact same sitemap and route structure** as the existing Next.js site
- Use the **Mainline template** (shadcn/ui + Tailwind 4 + Astro 5 + React 19) as the design foundation
- Manage all content via **Astro Content Collections** (Markdown/MDX + typed frontmatter) and a constants file — no CMS, no hardcoded content in components
- Deploy on **Cloudflare Pages** (with Workers for server-side endpoints)
- Keep the existing **Docusaurus docs site on Vercel** (multi-zone: `/docs` routes to Vercel)
- Apply modern SEO best practices, clean code, and maximum component reusability

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Astro 5** (hybrid rendering: static by default, server for API routes) |
| Template | [Mainline Astro Template](https://github.com/shadcnblocks/mainline-astro-template) by shadcnblocks |
| UI Components | **shadcn/ui** (Radix UI primitives) |
| Styling | **Tailwind CSS 4** via `@tailwindcss/vite` |
| Interactive Islands | **React 19** (Astro islands architecture) |
| Content | **Astro Content Collections** (Markdown/MDX with Zod-validated frontmatter) |
| Site Config | `src/consts.ts` (nav links, footer columns, social URLs, site metadata) |
| Hosting | **Cloudflare Pages** + **Cloudflare Workers** (for server endpoints) |
| Docs Hosting | **Vercel** (existing Docusaurus site, unchanged) |
| Adapter | `@astrojs/cloudflare` |
| Email | **Mailgun** (EU endpoint, double opt-in) |
| Payments | **LemonSqueezy** (embedded checkout links) |
| Bot Protection | **Cloudflare Turnstile** |
| Analytics | **Cloudflare Web Analytics** |
| Theme | Dark/light mode via `astro-themes` (included in Mainline) |
| Validation | **Zod** (included in Mainline) |
| Icons | **Lucide React** + **React Icons** (included in Mainline) |
| Animations | **Motion** / Framer Motion (included in Mainline) |
| Typography | **DM Sans** (Mainline default) or custom font choice |

---

## Mainline Template — What to Keep, Adapt, and Remove

The Mainline template ships with pre-built pages and blocks. Here's how they map to this project:

### Blocks to Reuse & Adapt

| Mainline Block | Use For |
|---|---|
| `navbar.tsx` | Site header — adapt links to match SideQuest nav |
| `footer.tsx` | Site footer — adapt columns to match SideQuest footer |
| `hero.tsx` | Homepage hero, product page heroes |
| `features.tsx` | Product feature cards on `/find-and-replace-fonts` and `/ae-sheets` |
| `faq.tsx` | FAQ accordion sections on product pages |
| `contact.tsx` | Contact form on `/contact` (rework to use Cloudflare Turnstile + Workers) |
| `pricing.tsx` / `pricing-table.tsx` | Could adapt for product pricing display or "Coming Soon" badges |
| `logos.tsx` | Tech stack / compatibility logos on product pages |
| `testimonials.tsx` | Future use — testimonials section |
| `blog-posts.tsx` / `blog-post.tsx` | Not needed now, but keep for potential future blog |
| `BaseHead.astro` | Global `<head>` — extend with structured data & advanced SEO |

### Mainline Pages to Remove or Repurpose

| Mainline Page | Action |
|---|---|
| `index.astro` | **Repurpose** → Homepage |
| `about.astro` | **Remove** (no about page in SideQuest) |
| `pricing.astro` | **Remove** (pricing is per-product, not a standalone page) |
| `faq.astro` | **Remove** (FAQs live on individual product pages) |
| `contact.astro` | **Repurpose** → `/contact` |
| `login.astro` / `signup.astro` | **Remove** (no auth in SideQuest) |
| `privacy.mdx` | **Repurpose** → `/privacy` |
| `blog/` | **Remove for now** (keep template files for future use) |
| `404.astro` | **Keep** — customize for SideQuest branding |
| `rss.xml.js` | **Remove for now** (no blog) |

### Layouts

| Mainline Layout | Action |
|---|---|
| `DefaultLayout.astro` | **Use** as the main layout (navbar + footer + `<slot />`) |
| `BasicLayout.astro` | **Use** for utility pages (subscription confirmed/error) |

---

## Complete Sitemap & Route Structure

### Public Pages

| Route | Page File | Purpose | Priority | Freq |
|---|---|---|---|---|
| `/` | `src/pages/index.astro` | Homepage — hero, product cards, email signup | 1.0 | monthly |
| `/find-and-replace-fonts` | `src/pages/find-and-replace-fonts.astro` | Product page — hero with video, feature cards, tech stack, FAQ, CTA | 0.9 | monthly |
| `/ae-sheets` | `src/pages/ae-sheets.astro` | Product page — same structure, "Coming Soon" state | 0.9 | monthly |
| `/free-ae-scripts` | `src/pages/free-ae-scripts/index.astro` | Freebies listing — hero, freebie cards grid | 0.7 | monthly |
| `/free-ae-scripts/ae-calculator` | `src/pages/free-ae-scripts/ae-calculator.astro` | Individual freebie detail page | 0.6 | monthly |
| `/contact` | `src/pages/contact.astro` | Contact form (Turnstile + Cloudflare Worker) | 0.5 | yearly |
| `/privacy` | `src/pages/privacy.mdx` | Privacy Policy (legal content) | 0.3 | yearly |
| `/terms` | `src/pages/terms.mdx` | Terms of Service (legal content) | 0.3 | yearly |
| `/subscription-confirmed` | `src/pages/subscription-confirmed.astro` | Email confirmation success. Handles `?already=true` | — | — |
| `/subscription-error` | `src/pages/subscription-error.astro` | Email confirmation error. Shows `?reason=...` | — | — |
| `/404` | `src/pages/404.astro` | Custom 404 page | — | — |

### Server Endpoints (Cloudflare Workers via Astro API Routes)

| Endpoint | Method | File | Purpose |
|---|---|---|---|
| `/api/subscribe` | POST | `src/pages/api/subscribe.ts` | Double opt-in email subscription via Mailgun. Accepts `{ email, product, list? }` |
| `/api/confirm` | GET | `src/pages/api/confirm.ts` | Confirms email subscription via `?email=&hash=&list=`. Redirects to success/error page |
| `/api/contact` | POST | `src/pages/api/contact.ts` | Contact form handler — validates Turnstile token, sends email via Mailgun |
| `/api/health` | GET | `src/pages/api/health.ts` | Health check → `{ status: "ok" }` |

### Redirects

Configure in `astro.config.mjs` and/or Cloudflare `_redirects`:

| Source | Destination | Status |
|---|---|---|
| `/products/find-and-replace-fonts-ae` | `/find-and-replace-fonts` | 301 |
| `/help` | `/docs` | 301 |
| `/healthz` | `/api/health` | 200 (rewrite) |
| `/health` | `/api/health` | 200 (rewrite) |
| `/ping` | `/api/health` | 200 (rewrite) |

### Multi-Zone: `/docs` → Docusaurus on Vercel

The existing Docusaurus documentation site stays deployed on **Vercel** at `sqp-docs.vercel.app`. It is already set up with multi-zoning.

**Routing strategy — pick one:**

| Option | How | Pros | Cons |
|---|---|---|---|
| **A. Cloudflare Worker proxy** | A Worker at `sidequestplugins.com/docs/*` fetches from `sqp-docs.vercel.app/*` and returns the response | Seamless `/docs` URLs, same as current Next.js rewrites | Extra Worker to maintain, slight latency |
| **B. Subdomain** | Point `docs.sidequestplugins.com` → Vercel. Update nav links to use subdomain | Zero proxy complexity, clean separation | Different domain in nav, minor SEO (canonical handles it) |
| **C. Cloudflare `_redirects`** | `/docs/* → https://sqp-docs.vercel.app/:splat 302` | Simplest, zero infra | User sees external URL, not ideal |

**Recommended: Option A** (matches current behavior). Create a lightweight Cloudflare Worker:

```js
// workers/docs-proxy.js (deployed as a Cloudflare Worker route)
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const docsPath = url.pathname.replace(/^\/docs\/?/, "/");
    const target = `https://sqp-docs.vercel.app${docsPath}${url.search}`;
    const response = await fetch(target, { headers: request.headers });
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  },
};
```

Configure a Cloudflare Worker Route: `sidequestplugins.com/docs/*` → this Worker.

---

## Navigation Structure

### Header

Desktop: horizontal nav bar. Mobile: slide-out sheet/drawer.

Links (in order):
1. **Find and Replace Fonts** → `/find-and-replace-fonts`
2. **AE Sheets** → `/ae-sheets`
3. **Freebies** → `/free-ae-scripts`
4. **Help** → `/help` (redirects to `/docs`)
5. **Contact** → `/contact`

Logo/brand "**SideQuest Plugins**" links to `/`.

Mobile drawer grouped as:
- **Products**: Find and Replace Fonts, AE Sheets
- **Resources**: Freebies, Help, Contact

### Footer

| Column | Links |
|---|---|
| **Products** | Find and Replace Fonts (`/find-and-replace-fonts`), Freebies (`/free-ae-scripts`) |
| **Company** | Help (`/help`), Contact (`/contact`) |
| **Connect** | Twitter (`https://twitter.com/sidequestplugins`), Instagram (`https://instagram.com/sidequestplugins`), YouTube (`https://youtube.com/sidequestplugins`) |

Bottom bar:
- `© {year} SideQuest Plugins. All rights reserved.`
- Terms of Service (`/terms`) | Privacy Policy (`/privacy`)

---

## Content Architecture — Astro Content Collections + Constants

No CMS. All content lives in the repo as Markdown/MDX files with Zod-validated frontmatter, or in a typed constants file for site-wide configuration. Edit a file, commit, Cloudflare rebuilds.

### Directory Structure

```
src/
├── content/
│   ├── products/                       # One MDX file per product
│   │   ├── find-and-replace-fonts.mdx
│   │   ├── ae-sheets.mdx
│   │   └── ae-calculator.mdx
│   └── legal/                          # One MD file per legal page
│       ├── privacy.md
│       └── terms.md
├── content.config.ts                   # Collection schemas (Zod)
└── consts.ts                           # Site-wide configuration
```

### Content Collection Schemas (`src/content.config.ts`)

```ts
import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

// ── Product Feature (used in frontmatter arrays) ───────────────────
const featureSchema = z.object({
  title: z.string(),
  description: z.string(),
  icon: z.string(),                     // Lucide icon name, e.g. "Type"
  image: z.string().optional(),         // path to image in public/
});

// ── FAQ Item ────────────────────────────────────────────────────────
const faqSchema = z.object({
  question: z.string(),
  answer: z.string(),                   // supports markdown in MDX rendering
});

// ── Tech Stack Item ─────────────────────────────────────────────────
const techItemSchema = z.object({
  name: z.string(),
  icon: z.string(),                     // path to icon in public/
  label: z.string().optional(),
});

// ── Stat ────────────────────────────────────────────────────────────
const statSchema = z.object({
  value: z.string(),                    // e.g. "500+"
  label: z.string(),                    // e.g. "users"
});

// ── SEO Fields (reused across collections) ──────────────────────────
const seoSchema = z.object({
  metaTitle: z.string(),
  metaDescription: z.string(),
  ogImage: z.string().optional(),       // path in public/images/
  keywords: z.string().optional(),
  noIndex: z.boolean().default(false),
});

// ── Products Collection ─────────────────────────────────────────────
const products = defineCollection({
  loader: glob({ base: "./src/content/products", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    price: z.number(),
    currency: z.string().default("USD"),
    version: z.string(),
    status: z.enum(["available", "coming_soon", "discontinued"]),
    supportedApp: z.string(),           // e.g. "AFTER EFFECTS 24.0+"
    extensionType: z.string(),          // e.g. "Extension (.ZXP)"
    checkoutUrl: z.string().url(),
    heroVideo: z.string().optional(),   // path or external URL
    heroImage: z.string().optional(),
    isFree: z.boolean().default(false),
    category: z.enum(["plugin", "script", "freebie"]),
    sortOrder: z.number().default(0),
    features: z.array(featureSchema).default([]),
    techStack: z.array(techItemSchema).default([]),
    faqs: z.array(faqSchema).default([]),
    stats: z.array(statSchema).default([]),
    seo: seoSchema,
  }),
});

// ── Legal Pages Collection ──────────────────────────────────────────
const legal = defineCollection({
  loader: glob({ base: "./src/content/legal", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    lastUpdated: z.coerce.date(),
    seo: seoSchema,
  }),
});

export const collections = { products, legal };
```

### Example Product File (`src/content/products/find-and-replace-fonts.mdx`)

```mdx
---
title: "Find and Replace Fonts"
tagline: "Advanced font replacement for After Effects"
price: 20
currency: "USD"
version: "1.5.1"
status: "available"
supportedApp: "AFTER EFFECTS 24.0+"
extensionType: "Extension (.ZXP)"
checkoutUrl: "https://sidequestplugins.lemonsqueezy.com/buy/547f1220-90ed-4c38-8fde-2ab174fd95d9?embed=1"
heroVideo: "/videos/frf-demo.mp4"
heroImage: "/images/products/frf-hero.jpg"
isFree: false
category: "plugin"
sortOrder: 1
features:
  - title: "Scope Control"
    description: "Replace fonts across your entire project or just a single comp."
    icon: "Target"
  - title: "Font Picker"
    description: "Visual font picker with preview and search."
    icon: "Type"
  - title: "Missing Fonts Detection"
    description: "Instantly find and fix missing fonts in any project."
    icon: "AlertTriangle"
  - title: "Style Preservation"
    description: "Keeps your text styling intact during replacement."
    icon: "Paintbrush"
techStack:
  - name: "CEP"
    icon: "/images/tech/cep.svg"
  - name: "ExtendScript"
    icon: "/images/tech/extendscript.svg"
faqs:
  - question: "What versions of After Effects are supported?"
    answer: "Find and Replace Fonts supports After Effects 2024 (v24.0) and later."
  - question: "How do I install the extension?"
    answer: "Download the .zxp file and install it using the ZXP Installer or aescripts manager."
  - question: "Can I use it on multiple machines?"
    answer: "Yes, your license allows installation on up to 2 machines."
  - question: "Is there a free trial?"
    answer: "There's no free trial, but we offer a 14-day money-back guarantee."
  - question: "Does it work with expressions and text animators?"
    answer: "Yes, all text properties including expressions and animators are preserved."
  - question: "Where can I get support?"
    answer: "Visit our documentation at /docs or contact us at /contact."
stats:
  - value: "500+"
    label: "users"
  - value: "4.9"
    label: "rating"
seo:
  metaTitle: "Find and Replace Fonts for After Effects"
  metaDescription: "Advanced font replacement plugin for After Effects. Replace fonts across entire projects, detect missing fonts, and preserve styling."
  ogImage: "/images/og/frf.jpg"
  keywords: "After Effects fonts, font replacement, AE plugin, missing fonts"
---

<!-- Optional: any rich body content rendered below the structured sections -->
```

### Example Legal Page (`src/content/legal/privacy.md`)

```md
---
title: "Privacy Policy"
lastUpdated: 2025-03-07
seo:
  metaTitle: "Privacy Policy"
  metaDescription: "Privacy Policy for SideQuest Plugins — how we handle your data."
---

# Privacy Policy

Last updated: March 7, 2025

<!-- Full legal content here in Markdown -->
```

### Site-Wide Constants (`src/consts.ts`)

```ts
// Site metadata
export const SITE = {
  name: "SideQuest Plugins",
  tagline: "After Effects plugins, scripts, and tools for motion designers.",
  domain: "https://sidequestplugins.com",
  supportEmail: "support@sidequestplugins.com",
  defaultOgImage: "/images/og-image.jpg",
  locale: "en_US",
} as const;

// Navigation links (used by navbar + mobile drawer)
export const NAV_LINKS = [
  { label: "Find and Replace Fonts", href: "/find-and-replace-fonts", group: "Products" },
  { label: "AE Sheets", href: "/ae-sheets", group: "Products" },
  { label: "Freebies", href: "/free-ae-scripts", group: "Resources" },
  { label: "Help", href: "/help", group: "Resources" },
  { label: "Contact", href: "/contact", group: "Resources" },
] as const;

// Footer columns
export const FOOTER_COLUMNS = [
  {
    title: "Products",
    links: [
      { text: "Find and Replace Fonts", url: "/find-and-replace-fonts" },
      { text: "Freebies", url: "/free-ae-scripts" },
    ],
  },
  {
    title: "Company",
    links: [
      { text: "Help", url: "/help" },
      { text: "Contact", url: "/contact" },
    ],
  },
  {
    title: "Connect",
    links: [
      { text: "Twitter", url: "https://twitter.com/sidequestplugins" },
      { text: "Instagram", url: "https://instagram.com/sidequestplugins" },
      { text: "YouTube", url: "https://youtube.com/sidequestplugins" },
    ],
  },
] as const;

// Footer bottom links
export const LEGAL_LINKS = [
  { text: "Terms of Service", url: "/terms" },
  { text: "Privacy Policy", url: "/privacy" },
] as const;

// Social links (for structured data)
export const SOCIAL_URLS = [
  "https://twitter.com/sidequestplugins",
  "https://instagram.com/sidequestplugins",
  "https://youtube.com/sidequestplugins",
] as const;
```

### Data Fetching in Pages

Content collections are queried with Astro's built-in `getCollection()` and `getEntry()`:

```astro
---
// src/pages/find-and-replace-fonts.astro
import { getEntry } from "astro:content";

const product = await getEntry("products", "find-and-replace-fonts");
if (!product) throw new Error("Product not found");
const { data, render } = product;
// data.title, data.features, data.faqs, etc. — fully typed from Zod schema
---
```

```astro
---
// src/pages/free-ae-scripts/index.astro (listing page)
import { getCollection } from "astro:content";

const allProducts = await getCollection("products");
const freebies = allProducts
  .filter((p) => p.data.isFree)
  .sort((a, b) => a.data.sortOrder - b.data.sortOrder);
---
```

No API client, no tokens, no network calls. Just typed local file reads at build time.

---

## Astro Configuration

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: "https://sidequestplugins.com",
  output: "hybrid",               // Static by default, server for API routes
  adapter: cloudflare(),
  integrations: [
    react(),
    sitemap({
      filter: (page) =>
        !["/subscription-confirmed", "/subscription-error", "/404"].some((p) =>
          page.includes(p)
        ),
      serialize: (item) => {
        if (item.url === "https://sidequestplugins.com/") item.priority = 1.0;
        if (item.url.includes("/find-and-replace-fonts")) item.priority = 0.9;
        if (item.url.includes("/ae-sheets")) item.priority = 0.9;
        if (item.url.includes("/free-ae-scripts") && !item.url.includes("/ae-calculator"))
          item.priority = 0.7;
        if (item.url.includes("/ae-calculator")) item.priority = 0.6;
        if (item.url.includes("/contact")) item.priority = 0.5;
        if (item.url.includes("/privacy") || item.url.includes("/terms"))
          item.priority = 0.3;
        return item;
      },
    }),
    mdx(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  redirects: {
    "/products/find-and-replace-fonts-ae": {
      status: 301,
      destination: "/find-and-replace-fonts",
    },
    "/help": {
      status: 301,
      destination: "/docs",
    },
  },
});
```

### Environment Variables

```env
# Mailgun (for email subscriptions + contact form)
MAILGUN_API_KEY=your-mailgun-key
MAILGUN_DOMAIN=your-mailgun-domain
MAILGUN_EU=true

# Cloudflare Turnstile (bot protection on contact form)
TURNSTILE_SITE_KEY=your-site-key
TURNSTILE_SECRET_KEY=your-secret-key

# Subscription (HMAC secret for double opt-in hash)
SUBSCRIBE_SECRET=your-hmac-secret
```

That's it. No CMS tokens, no database URLs.

---

## SEO Implementation

### Per-Page Metadata

Every page reads its SEO data from content collection frontmatter (or from `consts.ts` for the homepage) and passes it to `BaseHead.astro`:

```astro
---
// In BaseHead.astro — extend the Mainline template's version
import { SITE } from "@/consts";

const { title, description, ogImage, keywords, noIndex, canonicalUrl, type = "website" } = Astro.props;
const fullTitle = title ? `${title} | ${SITE.name}` : `After Effects Tools - Professional Plugins | ${SITE.name}`;
---
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{fullTitle}</title>
  <meta name="description" content={description} />
  {keywords && <meta name="keywords" content={keywords} />}
  <link rel="canonical" href={canonicalUrl || Astro.url.href} />

  <!-- Open Graph -->
  <meta property="og:type" content={type} />
  <meta property="og:locale" content={SITE.locale} />
  <meta property="og:url" content={Astro.url.href} />
  <meta property="og:title" content={fullTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:site_name" content={SITE.name} />
  <meta property="og:image" content={new URL(ogImage || SITE.defaultOgImage, SITE.domain)} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={fullTitle} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={new URL(ogImage || SITE.defaultOgImage, SITE.domain)} />

  <!-- Robots -->
  {noIndex ? (
    <meta name="robots" content="noindex, nofollow" />
  ) : (
    <meta name="robots" content="index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1" />
  )}

  <!-- Preconnect -->
  <link rel="preconnect" href="https://challenges.cloudflare.com" />

  <!-- Theme & Favicon -->
  <slot name="head" />
</head>
```

### Structured Data (JSON-LD)

Reusable component + builder functions in `src/lib/seo.ts`:

```astro
---
// src/components/StructuredData.astro
const { data } = Astro.props;
---
<script type="application/ld+json" set:html={JSON.stringify(data)} />
```

| Page | Schema Type |
|---|---|
| All pages (root layout) | `Organization` |
| Homepage | `WebSite` |
| Product pages | `SoftwareApplication` with `offers` |
| Product pages with FAQs | `FAQPage` |
| Legal pages | `WebPage` with `breadcrumb` |

### robots.txt

```ts
// src/pages/robots.txt.ts
import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  const body = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

Sitemap: https://sidequestplugins.com/sitemap-index.xml
Sitemap: https://sidequestplugins.com/docs/sitemap.xml`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain" },
  });
};
```

### Additional SEO

- **Canonical URLs** on every page
- **Breadcrumbs** JSON-LD on inner pages
- Preconnect to LemonSqueezy and font CDNs
- Lazy-load images with proper `width`/`height` and `alt` attributes
- Use Astro's built-in `<Image />` component for automatic optimization
- `last-modified` from content frontmatter where available

---

## Security Headers

Configure via Cloudflare Pages `_headers` file in `public/`:

```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.sidequestplugins.com https://*.lemonsqueezy.com; frame-src https://*.lemonsqueezy.com https://challenges.cloudflare.com;
```

---

## Component Architecture

### Principle: Maximum Reusability

Every section of every page should be a composable, **data-driven** component. No content hardcoded in components — all content flows from content collections or `consts.ts` via page-level data fetching and is passed as typed props.

### Full File Tree

```
src/
├── components/
│   ├── BaseHead.astro              # <head> with SEO, OG, structured data slots
│   ├── StructuredData.astro        # JSON-LD injection helper
│   ├── blocks/                     # Full-width page sections (from Mainline, adapted)
│   │   ├── navbar.tsx              # Header navigation (reads from consts via props)
│   │   ├── footer.tsx              # Footer (reads from consts via props)
│   │   ├── hero.tsx                # Generic hero (title, subtitle, CTA, video/image)
│   │   ├── product-hero.tsx        # Product-specific hero with video + purchase button
│   │   ├── features.tsx            # Feature cards grid (icon + title + description)
│   │   ├── faq.tsx                 # FAQ accordion section
│   │   ├── tech-stack.tsx          # Tech/compatibility logos strip
│   │   ├── cta-section.tsx         # CTA block with stats + purchase button
│   │   ├── product-cards.tsx       # Grid of product cards (for homepage)
│   │   ├── freebie-cards.tsx       # Grid of freebie cards
│   │   ├── email-signup.tsx        # Email subscription form
│   │   ├── contact-form.tsx        # Contact form with Turnstile
│   │   └── testimonials.tsx        # Future use
│   └── ui/                         # shadcn/ui primitives (from Mainline, untouched)
│       ├── accordion.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── navigation-menu.tsx
│       ├── sheet.tsx
│       ├── textarea.tsx
│       └── ...
├── content/
│   ├── products/
│   │   ├── find-and-replace-fonts.mdx
│   │   ├── ae-sheets.mdx
│   │   └── ae-calculator.mdx
│   └── legal/
│       ├── privacy.md
│       └── terms.md
├── content.config.ts               # Zod schemas for content collections
├── consts.ts                       # Site metadata, nav, footer, social links
├── layouts/
│   ├── DefaultLayout.astro         # Navbar + <slot /> + Footer (for public pages)
│   └── BasicLayout.astro           # Minimal layout (for utility/confirmation pages)
├── lib/
│   ├── seo.ts                      # Structured data builders (Organization, Product, FAQ, etc.)
│   └── utils.ts                    # Utility functions (cn, formatPrice, etc.)
├── pages/
│   ├── index.astro
│   ├── find-and-replace-fonts.astro
│   ├── ae-sheets.astro
│   ├── free-ae-scripts/
│   │   ├── index.astro
│   │   └── ae-calculator.astro
│   ├── contact.astro
│   ├── privacy.mdx
│   ├── terms.mdx
│   ├── subscription-confirmed.astro
│   ├── subscription-error.astro
│   ├── 404.astro
│   ├── robots.txt.ts
│   └── api/
│       ├── subscribe.ts
│       ├── confirm.ts
│       ├── contact.ts
│       └── health.ts
└── styles/
    └── globals.css                 # Tailwind imports + custom theme tokens
```

### Page Composition Pattern

Every `.astro` page follows the same pattern — fetch from content collections, pass typed data as props to reusable block components:

```astro
---
// src/pages/find-and-replace-fonts.astro
import DefaultLayout from "@/layouts/DefaultLayout.astro";
import ProductHero from "@/components/blocks/product-hero";
import Features from "@/components/blocks/features";
import TechStack from "@/components/blocks/tech-stack";
import FAQ from "@/components/blocks/faq";
import CTASection from "@/components/blocks/cta-section";
import StructuredData from "@/components/StructuredData.astro";
import { getEntry } from "astro:content";
import { buildProductSchema, buildFAQSchema } from "@/lib/seo";

const product = await getEntry("products", "find-and-replace-fonts");
if (!product) throw new Error("Product not found");

const { data } = product;
const productSchema = buildProductSchema(data);
const faqSchema = buildFAQSchema(data.faqs);
---

<DefaultLayout
  title={data.seo.metaTitle}
  description={data.seo.metaDescription}
  ogImage={data.seo.ogImage}
  keywords={data.seo.keywords}
>
  <StructuredData slot="head" data={productSchema} />
  <StructuredData slot="head" data={faqSchema} />

  <ProductHero client:load product={data} />
  <Features features={data.features} />
  <TechStack items={data.techStack} />
  <FAQ client:visible items={data.faqs} />
  <CTASection product={data} />
</DefaultLayout>
```

### Astro Islands Strategy

Only hydrate components that need interactivity:

| Directive | Use For |
|---|---|
| `client:load` | Purchase buttons, email signup form, contact form, mobile nav |
| `client:visible` | FAQ accordion, video players, testimonials carousel |
| `client:idle` | Analytics, non-critical interactive elements |
| *(no directive)* | Static content — feature cards, hero text, footer, legal pages |

---

## Contact Form

Handle contact submissions server-side (no third-party form service):

### Frontend (`contact-form.tsx`)
- Fields: `name` (min 2), `email` (valid), `message` (min 10)
- Validate with Zod
- **Cloudflare Turnstile** widget for bot protection
- POST to `/api/contact`
- Show success/error states inline

### Backend (`src/pages/api/contact.ts`)
- Validate Turnstile token server-side via Cloudflare's siteverify API
- Validate form fields with Zod
- Send notification email via **Mailgun** (to `support@sidequestplugins.com`)
- Rate limiting via Cloudflare (configure in dashboard)

---

## Email Subscription Flow

Reuse the existing double opt-in pattern:

1. User submits email via `EmailSignup` component → POST `/api/subscribe`
2. Server generates HMAC hash, sends confirmation email via Mailgun
3. User clicks confirmation link → GET `/api/confirm?email=...&hash=...&list=...`
4. Server verifies hash, updates Mailgun subscription → redirects to `/subscription-confirmed` or `/subscription-error`

---

## Cloudflare Deployment

### Build Settings

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node.js version | `20` |
| Environment variables | All from `.env` above |

### Files in `public/`

```
public/
├── _headers           # Security headers (see above)
├── _redirects         # Cloudflare-specific rewrites
├── favicon.ico
├── images/
│   ├── og-image.jpg
│   ├── og/            # Per-page OG images
│   ├── logo.svg
│   ├── logo.png
│   ├── products/      # Product hero images
│   └── tech/          # Tech stack icons
└── videos/            # Product demo videos
```

### `_redirects` file

```
/healthz    /api/health    200
/health     /api/health    200
/ping       /api/health    200
```

### Rebuild on Content Changes

Since content lives in the Git repo, any commit to the `main` branch automatically triggers a Cloudflare Pages rebuild. No webhooks needed.

---

## Checklist for Implementation

### Phase 1: Scaffold
- [ ] Clone Mainline template into new repo
- [ ] Replace `@astrojs/vercel` with `@astrojs/cloudflare`
- [ ] Set `output: "hybrid"` in Astro config
- [ ] Set `site: "https://sidequestplugins.com"`
- [ ] Remove unused Mainline pages (about, pricing, faq, login, signup, blog, rss)
- [ ] Create all page files as empty shells with correct routes
- [ ] Set up `_headers` and `_redirects` in `public/`
- [ ] Configure redirects in `astro.config.mjs`

### Phase 2: Content
- [ ] Create `src/content.config.ts` with Product and Legal collection schemas
- [ ] Create `src/consts.ts` with site metadata, nav, footer, social links
- [ ] Create `src/content/products/find-and-replace-fonts.mdx` — migrate all data from Next.js
- [ ] Create `src/content/products/ae-sheets.mdx` — migrate all data
- [ ] Create `src/content/products/ae-calculator.mdx` — migrate all data
- [ ] Create `src/content/legal/privacy.md` — migrate content
- [ ] Create `src/content/legal/terms.md` — migrate content
- [ ] Verify all collections build without Zod errors

### Phase 3: Components & Pages
- [ ] Adapt navbar with SideQuest navigation (data from `consts.ts` via props)
- [ ] Adapt footer with SideQuest columns (data from `consts.ts` via props)
- [ ] Build `ProductHero`, `Features`, `TechStack`, `FAQ`, `CTASection` blocks
- [ ] Build `ProductCards`, `FreebieCards` blocks for listing pages
- [ ] Build `EmailSignup` and `ContactForm` with Turnstile
- [ ] Build homepage with product cards + email signup
- [ ] Build product pages using composition pattern
- [ ] Build freebies listing and detail pages
- [ ] Build contact page
- [ ] Build legal pages (render markdown body from collection)
- [ ] Build confirmation/error pages
- [ ] Build 404 page

### Phase 4: Server Endpoints
- [ ] Implement `/api/subscribe` (Mailgun double opt-in)
- [ ] Implement `/api/confirm` (subscription confirmation)
- [ ] Implement `/api/contact` (Turnstile + Mailgun)
- [ ] Implement `/api/health`

### Phase 5: SEO & Polish
- [ ] Extend `BaseHead.astro` with full SEO meta
- [ ] Build `src/lib/seo.ts` structured data builders
- [ ] Add JSON-LD to all pages (Organization, SoftwareApplication, FAQPage, WebPage)
- [ ] Implement `robots.txt.ts`
- [ ] Verify sitemap generation with correct priorities and filtered pages
- [ ] Add Cloudflare Web Analytics snippet
- [ ] Test OG images and Twitter cards with validators
- [ ] Lighthouse audit — target 95+ on all metrics
- [ ] Test dark/light mode

### Phase 6: Deploy
- [ ] Connect Cloudflare Pages to Git repo
- [ ] Set all environment variables in Cloudflare dashboard
- [ ] Set up custom domain in Cloudflare
- [ ] Deploy Cloudflare Worker for `/docs` proxy (or choose subdomain/redirect approach)
- [ ] Verify all redirects work
- [ ] Verify `/docs` routes to Docusaurus on Vercel
- [ ] Final smoke test all routes
