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
export function buildFAQSchema(
  faqs: { question: string; answer: string }[],
) {
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
