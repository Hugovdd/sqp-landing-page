// Site metadata
export const SITE = {
  name: "SideQuest Plugins",
  tagline:
    "Professional After Effects plugins designed to streamline your workflow. Find and replace fonts globally, connect to spreadsheets, and automate your motion graphics workflow.",
  domain: "https://sidequestplugins.com",
  supportEmail: "support@sidequestplugins.com",
  defaultOgImage: "/images/og-homepage.jpg",
  locale: "en_US",
} as const;

// Product links (used by desktop dropdown + mobile menu)
export const PRODUCT_LINKS = [
  {
    label: "Find and Replace Fonts",
    href: "/find-and-replace-fonts",
    description: "Advanced font replacement workflows for After Effects projects.",
    previewImage: "/images/find-and-replace-fonts/find-and-replace-fonts-product.png",
  },
  {
    label: "AE Sheets",
    href: "/ae-sheets",
    description:
      "Localize and version compositions with spreadsheet-driven automation.",
    previewImage: "/images/ae-sheets/AE_Sheets_Homepage_Product_Thumb.png",
  },
] as const;

// Navigation links (used by desktop navbar + mobile menu)
export const NAV_LINKS = [
  { label: "Freebies", href: "/free-ae-scripts", group: "Resources" },
  { label: "Help", href: "/help", group: "Resources" },
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
      {
        text: "Instagram",
        url: "https://instagram.com/sidequestplugins",
      },
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
