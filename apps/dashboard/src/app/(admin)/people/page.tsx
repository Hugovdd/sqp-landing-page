import { redirect } from "next/navigation";

import { PeoplePageView } from "@/components/people/people-page";
import {
  AltarAdminError,
  type AltarAdminErrorKind,
  getAltarPeoplePage,
} from "@/lib/altar-admin";
import { parsePeopleParams } from "@/lib/altar-people";
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

  let result:
    | { status: "ready"; data: Awaited<ReturnType<typeof getAltarPeoplePage>> }
    | { status: "unavailable"; kind: AltarAdminErrorKind };
  try {
    const data = await getAltarPeoplePage(params);
    if (params.page > data.pageCount) {
      redirect(peoplePageHref(params, data.pageCount));
    }
    result = { status: "ready", data };
  } catch (error) {
    if (error instanceof AltarAdminError) {
      result = { status: "unavailable", kind: error.kind };
    } else {
      throw error;
    }
  }
  return <PeoplePageView params={params} result={result} />;
}
