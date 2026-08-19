import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

/** Altar-only pages bounce any other product scope back to Overview. */
export function redirectUnlessAltarProduct(searchParams: SearchParams): void {
  if (searchParams.product === "altar") return;
  const next = new URLSearchParams();
  const product = Array.isArray(searchParams.product)
    ? searchParams.product[0]
    : searchParams.product;
  if (product) next.set("product", product);
  for (const key of ["from", "to"] as const) {
    const value = Array.isArray(searchParams[key])
      ? searchParams[key]?.[0]
      : searchParams[key];
    if (value) next.set(key, value);
  }
  redirect(`/overview${next.size ? `?${next.toString()}` : ""}`);
}
