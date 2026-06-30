interface BaseNavItem {
  title: string;
  badge?: string;
  icon?: React.ElementType;
}

/** A single sidebar entry: a labelled link, optionally with an icon/badge. */
export type NavItem = BaseNavItem & { url: string };

interface NavGroup {
  title: string;
  items: NavItem[];
}

export type { NavGroup };
