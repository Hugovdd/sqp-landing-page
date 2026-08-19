import { EmailTemplatesPageView } from "@/components/email-templates/email-templates-page";
import { getAltarEmailPreviews } from "@/lib/altar-admin";
import { redirectUnlessAltarProduct } from "@/lib/require-altar-product";

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
  redirectUnlessAltarProduct(rawSearchParams);

  const rawTemplate = rawSearchParams.template;
  const selectedId = Array.isArray(rawTemplate) ? rawTemplate[0] : rawTemplate;
  const result = await getAltarEmailPreviews();
  return <EmailTemplatesPageView result={result} selectedId={selectedId} />;
}
