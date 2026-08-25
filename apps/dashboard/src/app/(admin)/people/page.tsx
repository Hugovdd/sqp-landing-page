import { redirect } from "next/navigation";

import { PeoplePageView } from "@/components/people/people-page";
import { AltarAdminError, getAltarPeoplePage } from "@/lib/altar-admin";
import { parsePeopleParams } from "@/lib/altar-people";
import { getPersonUsage } from "@/lib/altar-usage";
import { redirectUnlessAltarProduct } from "@/lib/require-altar-product";

export const dynamic = "force-dynamic";

type SearchParamsPromise = Promise<
  Record<string, string | string[] | undefined>
>;

function peoplePageHref(
  params: ReturnType<typeof parsePeopleParams>,
  page: number,
): string {
  const query = new URLSearchParams({ product: "altar" });
  if (params.search) query.set("search", params.search);
  for (const state of params.states) query.append("state", state);
  query.set("order", params.order);
  if (page > 1) query.set("page", String(page));
  if (params.selectedEmail) query.set("person", params.selectedEmail);
  return `/people?${query.toString()}`;
}

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: SearchParamsPromise;
}) {
  const rawSearchParams = await searchParams;
  redirectUnlessAltarProduct(rawSearchParams);
  const params = parsePeopleParams(rawSearchParams);

  try {
    const data = await getAltarPeoplePage(params);
    if (params.page > data.pageCount) {
      redirect(peoplePageHref(params, data.pageCount));
    }
    const usage = data.detail
      ? await getPersonUsage(data.detail)
      : { status: "empty" as const };
    return (
      <PeoplePageView
        params={params}
        result={{ status: "ready", data }}
        usage={usage}
      />
    );
  } catch (error) {
    if (error instanceof AltarAdminError) {
      return (
        <PeoplePageView
          params={params}
          result={{ status: "unavailable", kind: error.kind }}
          usage={{ status: "empty" }}
        />
      );
    }
    throw error;
  }
}
