import { redirect } from "next/navigation";

import { TeamsPageView } from "@/components/teams/teams-page";
import { AltarAdminError, getAltarTeamsPage } from "@/lib/altar-admin";
import { parseTeamsParams } from "@/lib/altar-teams";
import { getIdentifiedUsage } from "@/lib/altar-usage";
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


  try {
    const data = await getAltarTeamsPage(params);
    if (params.page > data.invitePageCount) {
      redirect(teamsPageHref(data.invitePageCount));
    }
    const identifiedIds = data.teams
      .filter((team) => team.identified === 1)
      .map((team) => team.orgId);
    const usage =
      identifiedIds.length > 0
        ? await getIdentifiedUsage({ orgIds: identifiedIds })
        : { status: "empty" as const };
    return <TeamsPageView result={{ status: "ready", data }} usage={usage} />;
  } catch (error) {
    if (error instanceof AltarAdminError) {
      return (
        <TeamsPageView
          result={{ status: "unavailable", kind: error.kind }}
          usage={{ status: "empty" }}
        />
      );
    }
    throw error;
  }
}
