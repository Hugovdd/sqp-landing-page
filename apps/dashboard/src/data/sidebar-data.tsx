import { type NavKey } from "@sqp/shared/products";
import {
  IconBug,
  IconChartBar,
  IconCopy,
  IconLayoutDashboard,
  IconLicense,
  IconTool,
  IconUsers,
  IconWorld,
} from "@tabler/icons-react";

// Cosmetic only — real identity is enforced by Cloudflare Access in front of
// the hostname (decision 10).
export const sidebarUser = {
  name: "Admin",
  email: "admin@sidequestplugins.com",
  avatar: "/avatars/ausrobdev-avatar.png",
};

/**
 * Fixed-section presentation, keyed by the registry's `NavKey`. The product
 * registry (@sqp/shared) decides *which* sections a product shows and in what
 * order; this map supplies each section's title/url/icon. `tools` entries are
 * pane-scoped and rendered separately (label from the registry, IconTool, a
 * `/tools?pane=` url), so they aren't keyed here.
 */
export const SECTION_NAV: Record<
  NavKey,
  { title: string; url: string; icon: React.ElementType }
> = {
  overview: { title: "Overview", url: "/overview", icon: IconLayoutDashboard },
  duplication: { title: "Duplication", url: "/duplication", icon: IconCopy },
  licensing: { title: "Licensing", url: "/licensing", icon: IconLicense },
  people: { title: "People", url: "/people", icon: IconUsers },
  geography: { title: "Geography", url: "/geography", icon: IconWorld },
  breakdowns: { title: "Breakdowns", url: "/breakdowns", icon: IconChartBar },
  errors: { title: "Errors", url: "/errors", icon: IconBug },
};

/** Icon for every pane-scoped tool-usage entry (Rigging tools, Forge, …). */
export const TOOLS_ICON = IconTool;
