import { BarList } from "@/components/telemetry/bar-list";
import { ChartCard } from "@/components/telemetry/chart-card";
import { PageShell } from "@/components/telemetry/page-shell";
import { filterCache, resolveFilters } from "@/lib/telemetry/filters";
import { getBreakdowns } from "@/lib/telemetry/queries";

export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function BreakdownsPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const f = resolveFilters(filterCache.parse(await searchParams));
  const { os, version } = await getBreakdowns(f);

  return (
    <PageShell
      title="Breakdowns"
      description="OS and app version across the current install base (latest-seen)."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Operating system">
          <BarList items={os} />
        </ChartCard>
        <ChartCard title="App version">
          <BarList items={version} />
        </ChartCard>
      </div>
    </PageShell>
  );
}
