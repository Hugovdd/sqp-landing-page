import { redirect } from "next/navigation";

import { EmailTemplatesPageView } from "@/components/email-templates/email-templates-page";
import { getAltarEmailPreviews } from "@/lib/altar-admin";

export const dynamic = "force-dynamic";

type SearchParamsPromise = Promise<
  Record<string, string | string[] | undefined>
>;

export default async function EmailTemplatesPage({
  searchParams,
}: {
  searchParams: SearchParamsPromise;
}) {
  const rawSearchParams = await searchParams;
  if (rawSearchParams.product !== "altar") {
    const next = new URLSearchParams();
    const product = Array.isArray(rawSearchParams.product)
      ? rawSearchParams.product[0]
      : rawSearchParams.product;
    if (product) next.set("product", product);
    for (const key of ["from", "to"] as const) {
      const value = Array.isArray(rawSearchParams[key])
        ? rawSearchParams[key]?.[0]
        : rawSearchParams[key];
      if (value) next.set(key, value);
    }
    redirect(`/overview${next.size ? `?${next.toString()}` : ""}`);
  }

  const rawTemplate = rawSearchParams.template;
  const selectedId = Array.isArray(rawTemplate) ? rawTemplate[0] : rawTemplate;
  const result = await getAltarEmailPreviews();
  return <EmailTemplatesPageView result={result} selectedId={selectedId} />;
}
