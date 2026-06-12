"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useQueryStates } from "nuqs";

import { Logo } from "@/components/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { site } from "@/data/site";
import {
  filterParsers,
  PRODUCT_VALUES,
  type ProductFilter,
  PRODUCTS,
} from "@/lib/telemetry/filter-params";

/**
 * Top-level product scope for the whole dashboard. The selected product is
 * carried in the URL (`?product=`) via nuqs; `shallow: false` re-renders the
 * Server Component pages so every metric re-queries D1 for that product's
 * brands. Sits in the sidebar header where the company is also identified.
 */
export function ProductSwitcher() {
  const { isMobile } = useSidebar();
  const [{ product }, setFilters] = useQueryStates(filterParsers, {
    shallow: false,
  });

  const active = PRODUCTS[product as ProductFilter] ?? PRODUCTS.all;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="ring-sidebar-ring/50 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground focus-visible:ring-1"
            >
              <div className="border-muted-foreground/25 flex aspect-square size-8 items-center justify-center rounded-lg border bg-transparent">
                <Logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-xs leading-tight">
                <span className="truncate font-semibold">{active.label}</span>
                <span className="truncate text-xs">{site.title}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Products
            </DropdownMenuLabel>
            {PRODUCT_VALUES.map((value) => (
              <DropdownMenuItem
                key={value}
                onClick={() => setFilters({ product: value })}
                className="gap-2 p-2 text-balance"
              >
                {PRODUCTS[value].label}
                {value === product && <Check className="ml-auto size-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
