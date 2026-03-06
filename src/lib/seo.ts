import { SITE, SOCIAL_URLS } from "@/consts";

/**
 * Organization schema — used on every page (in root layout)
 */
export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.domain,
    description:
      "Sidequest Plugins builds professional automation tools for Adobe After Effects, helping motion designers eliminate repetitive tasks in localization, font management, and project organization.",
    logo: `${SITE.domain}/images/logo.png`,
    sameAs: [...SOCIAL_URLS],
    contactPoint: {
      "@type": "ContactPoint",
      email: SITE.supportEmail,
      contactType: "customer support",
    },
  };
}

/**
 * WebSite schema — used on the homepage
 */
export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.domain,
    description: SITE.tagline,
    publisher: {
      "@type": "Organization",
      name: SITE.name,
    },
  };
}

/**
 * SoftwareApplication schema — used on product pages
 */
export function buildProductSchema(data: {
  title: string;
  tagline: string;
  price: number;
  currency: string;
  status: string;
  version: string;
  supportedApp: string;
  seo: { metaDescription: string; ogImage?: string };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: data.title,
    description: data.seo.metaDescription,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Windows, macOS",
    softwareVersion: data.version,
    offers: {
      "@type": "Offer",
      price: data.price,
      priceCurrency: data.currency,
      availability:
        data.status === "available"
          ? "https://schema.org/InStock"
          : "https://schema.org/PreOrder",
    },
    ...(data.seo.ogImage && {
      image: `${SITE.domain}${data.seo.ogImage}`,
    }),
  };
}

/**
 * FAQPage schema — used on product pages with FAQs
 */
export function buildFAQSchema(faqs: { question: string; answer: string }[]) {
  if (faqs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * ItemList schema — used on the homepage product showcase
 */
export function buildItemListSchema(
  products: {
    name: string;
    url: string;
    image?: string;
    description: string;
  }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((product, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: product.name,
      url: product.url,
      ...(product.image && { image: `${SITE.domain}${product.image}` }),
      description: product.description,
    })),
  };
}

/**
 * BlogPosting schema — used on individual blog post pages
 */
export function buildArticleSchema(data: {
  title: string;
  description: string;
  url: string;
  image?: string;
  publishedAt: Date;
  updatedAt?: Date;
  authorName: string;
  authorUrl?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: data.title,
    description: data.description,
    url: data.url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": data.url,
    },
    ...(data.image && { image: `${SITE.domain}${data.image}` }),
    datePublished: data.publishedAt.toISOString(),
    dateModified: (data.updatedAt ?? data.publishedAt).toISOString(),
    author: {
      "@type": "Person",
      name: data.authorName,
      ...(data.authorUrl && { url: data.authorUrl }),
    },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      logo: {
        "@type": "ImageObject",
        url: `${SITE.domain}/images/logo.png`,
      },
    },
  };
}

/**
 * BreadcrumbList schema — used on blog index, taxonomy, and post pages
 */
export function buildBreadcrumbSchema(
  crumbs: { name: string; url: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

/**
 * WebPage schema with breadcrumb — used on legal and inner pages
 */
export function buildWebPageSchema(data: {
  title: string;
  description: string;
  url: string;
  breadcrumbs: { name: string; url: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: data.title,
    description: data.description,
    url: data.url,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: data.breadcrumbs.map((crumb, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    },
  };
}
