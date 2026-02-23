import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

// -- Product Feature (used in frontmatter arrays) --
const featureSchema = z.object({
  title: z.string(),
  description: z.string(),
  icon: z.string(), // Lucide icon name, e.g. "Type"
  image: z.string().optional(), // path to image in public/
  video: z.string().optional(), // path to video in public/
});

// -- FAQ Item --
const faqSchema = z.object({
  question: z.string(),
  answer: z.string(), // supports markdown in MDX rendering
});

// -- Tech Stack Item --
const techItemSchema = z.object({
  name: z.string(),
  icon: z.string(), // path to icon in public/
  darkIcon: z.string().optional(), // alternate icon for dark mode
  label: z.string().optional(),
});

// -- Stat --
const statSchema = z.object({
  value: z.string(), // e.g. "500+"
  label: z.string(), // e.g. "users"
});

// -- Hero Feature Chip (icon + short label, shown in product hero) --
const heroChipSchema = z.object({
  icon: z.string(), // Lucide icon name, e.g. "Sparkles"
  title: z.string(), // Short label, e.g. "Google Gemini & OpenAI"
});

// -- Homepage Product Card --
const homeCardSchema = z.object({
  title: z.string().optional(),
  tagline: z.string().optional(),
  price: z.number().optional(),
  currency: z.string().optional(),
  heroImage: z.string().optional(),
  features: z.array(featureSchema).optional(),
  buyButtonLabel: z.string().optional(),
});

// -- SEO Fields (reused across collections) --
const seoSchema = z.object({
  metaTitle: z.string(),
  metaDescription: z.string(),
  ogImage: z.string().optional(), // path in public/images/
  keywords: z.string().optional(),
  noIndex: z.boolean().default(false),
});

// -- Products Collection --
const products = defineCollection({
  loader: glob({ base: "./src/content/products", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    price: z.number(),
    currency: z.string().default("USD"),
    version: z.string(),
    status: z.enum(["available", "coming_soon", "discontinued"]),
    supportedApp: z.string(), // e.g. "AFTER EFFECTS 24.0+"
    extensionType: z.string(), // e.g. "Extension (.ZXP)"
    checkoutUrl: z.string().url(),
    buyButtonLabel: z.string().optional(),
    heroVideo: z.string().optional(), // path or external URL
    heroImage: z.string().optional(),
    tutorialVideoId: z.string().optional(), // YouTube video ID
    isFree: z.boolean().default(false),
    category: z.enum(["extension", "plugin", "script", "freebie"]),
    sortOrder: z.number().default(0),
    features: z.array(featureSchema).default([]),
    heroFeatures: z.array(heroChipSchema).optional(),
    homeCard: homeCardSchema.optional(),
    techStack: z.array(techItemSchema).default([]),
    faqs: z.array(faqSchema).default([]),
    stats: z.array(statSchema).default([]),
    seo: seoSchema,
  }),
});

// -- Legal Pages Collection --
const legal = defineCollection({
  loader: glob({ base: "./src/content/legal", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    lastUpdated: z.coerce.date(),
    seo: seoSchema,
  }),
});

export const collections = { products, legal };
