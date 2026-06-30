"use client";

import { productNav } from "@sqp/shared/products";
import { useSearchParams } from "next/navigation";

import { type NavItem } from "@/components/layout/types";
import { SECTION_NAV, TOOLS_ICON } from "@/data/sidebar-data";

// Params carried across nav so the active product (and date range) survive a
// section change — without them a bare <Link href="/overview"> would drop
// `?product=` and reset the whole dashboard scope.
const CARRY_PARAMS = ["product", "from", "to"] as const;

function buildHref(
  base: string,
  carry: URLSearchParams,
  extra?: Record<string, string>,
): string {
  const sp = new URLSearchParams(carry);
  if (extra) for (const [k, v] of Object.entries(extra)) sp.set(k, v);
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

/**
 * The active product's resolved sidebar items. Reads `?product=` (written by the
 * product switcher via nuqs) and turns each registry NavItem into a concrete
 * `{ title, url, icon }`, carrying the scope params through every link. Shared by
 * the sidebar and the command menu so they never drift.
 */
export function useNavItems(): NavItem[] {
  const searchParams = useSearchParams();
  const product = searchParams.get("product") ?? "all";

  const carry = new URLSearchParams();
  for (const k of CARRY_PARAMS) {
    const v = searchParams.get(k);
    if (v) carry.set(k, v);
  }

  return productNav(product).map((n) => {
    if (n.key === "tools") {
      return {
        title: n.label,
        url: buildHref("/tools", carry, { pane: n.pane }),
        icon: TOOLS_ICON,
      };
    }
    const s = SECTION_NAV[n.key];
    return { title: s.title, url: buildHref(s.url, carry), icon: s.icon };
  });
}
