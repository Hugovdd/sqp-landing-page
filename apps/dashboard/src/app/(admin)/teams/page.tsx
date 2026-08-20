import { redirect } from "next/navigation";

import { TeamsPageView } from "@/components/teams/teams-page";
import {
  AltarAdminError,
  type AltarAdminErrorKind,
  getAltarTeamsPage,
  type TeamsPageData,
} from "@/lib/altar-admin";
import { parseTeamsParams } from "@/lib/altar-teams";
import { redirectUnlessAltarProduct } from "@/lib/require-altar-product";

export const dynamic = "force-dynamic";

type SearchParamsPromise = Promise<
  Record<string, string | string[] | undefined>
>;

function teamsPageHref(page: number): string {
  const query = new URLSearchParams({ product: "altar" });
  if (page > 1) query.set("page", String(page));
  return `/teams?${query.toString()}`;
}

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: SearchParamsPromise;
}) {
  const rawSearchParams = await searchParams;
  redirectUnlessAltarProduct(rawSearchParams);
  const params = parseTeamsParams(rawSearchParams);

  let result:
    | { status: "ready"; data: TeamsPageData }
    | { status: "unavailable"; kind: AltarAdminErrorKind };
  try {
    const data = await getAltarTeamsPage(params);
    if (params.page > data.invitePageCount) {
      redirect(teamsPageHref(data.invitePageCount));
    }
    result = { status: "ready", data };
  } catch (error) {
    if (error instanceof AltarAdminError) {
      result = { status: "unavailable", kind: error.kind };
    } else {
      throw error;
    }
  }
  return <TeamsPageView result={result} />;
}
