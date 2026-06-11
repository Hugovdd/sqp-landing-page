import {
  IconBug,
  IconChartBar,
  IconCopy,
  IconLayoutDashboard,
  IconWorld,
} from "@tabler/icons-react";

import { type SidebarData } from "@/components/layout/types";
import { Logo } from "@/components/logo";
import { site } from "@/data/site";

export const sidebarData: SidebarData = {
  // Cosmetic only — real identity is enforced by Cloudflare Access in front of
  // the hostname (decision 10).
  user: {
    name: "Admin",
    email: "admin@sidequestplugins.com",
    avatar: "/avatars/ausrobdev-avatar.png",
  },
  teams: [
    {
      name: site.title,
      logo: ({ className }: { className: string }) => (
        <Logo className={className} />
      ),
      plan: "Telemetry",
    },
  ],
  navGroups: [
    {
      title: "Telemetry",
      items: [
        { title: "Overview", url: "/overview", icon: IconLayoutDashboard },
        { title: "Duplication", url: "/duplication", icon: IconCopy },
        { title: "Geography", url: "/geography", icon: IconWorld },
        { title: "Breakdowns", url: "/breakdowns", icon: IconChartBar },
        { title: "Errors", url: "/errors", icon: IconBug },
      ],
    },
  ],
};
