"use client";

import { NavGroup } from "@/components/layout/nav-group";
import { NavUser } from "@/components/layout/nav-user";
import { ProductSwitcher } from "@/components/layout/product-switcher";
import { useNavItems } from "@/components/layout/use-nav-items";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { sidebarUser } from "@/data/sidebar-data";

/**
 * The sidebar is product-aware: it renders the active product's declared nav
 * (PRODUCT_REGISTRY in @sqp/shared), resolved from `?product=` by useNavItems.
 * Switching product re-renders this client component, so the section set
 * re-resolves automatically.
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const items = useNavItems();

  return (
    <div className="relative">
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <ProductSwitcher />
        </SidebarHeader>
        <SidebarContent>
          <NavGroup title="Telemetry" items={items} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={sidebarUser} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </div>
  );
}
