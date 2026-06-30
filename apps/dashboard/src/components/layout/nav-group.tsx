"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ReactNode } from "react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { Badge } from "../ui/badge";
import { type NavGroup, NavItem } from "./types";

export function NavGroup({ title, items }: NavGroup) {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  // Several entries can share the /tools path, distinguished only by ?pane=
  // (Forge / Chat / Vault). Compare the active pane so only the matching one lights.
  const activePane = useSearchParams().get("pane");
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={isActive(pathname, activePane, item)}
              tooltip={item.title}
            >
              <Link href={item.url} onClick={() => setOpenMobile(false)}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
                {item.badge && <NavBadge>{item.badge}</NavBadge>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

const NavBadge = ({ children }: { children: ReactNode }) => (
  <Badge className="rounded-full px-1 py-0 text-xs">{children}</Badge>
);

function isActive(
  pathname: string,
  activePane: string | null,
  item: NavItem,
): boolean {
  const currentPath = normalizePath(pathname);
  const itemPath = normalizePath(item.url);
  if (currentPath === itemPath) {
    // Pane-scoped entries (/tools?pane=…) only match when the pane agrees, so
    // sibling tool surfaces don't all highlight on the shared /tools path.
    const itemPane = new URLSearchParams(item.url.split("?")[1]).get("pane");
    return itemPane ? itemPane === activePane : true;
  }
  return itemPath !== "/" && currentPath.startsWith(`${itemPath}/`);
}

function normalizePath(url: string): string {
  const [path] = url.split("?");
  return path.replace(/\/$/, "") || "/";
}
