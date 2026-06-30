import { BarList } from "@/components/telemetry/bar-list";
import { ChartCard } from "@/components/telemetry/chart-card";
import { PageShell } from "@/components/telemetry/page-shell";
import { filterCache, resolveFilters } from "@/lib/telemetry/filters";
import { getLicensing } from "@/lib/telemetry/queries";

export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function LicensingPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const f = resolveFilters(filterCache.parse(await searchParams));
  const { plan, type } = await getLicensing(f);

  return (
    <PageShell
      title="Licensing"
      description="License plan across the current install base (latest-seen)."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="License plan">
          <BarList items={plan} />
        </ChartCard>
        <ChartCard title="License type (paid)">
          <BarList items={type} emptyLabel="No paid installs in range" />
        </ChartCard>
      </div>
    </PageShell>
  );
}
