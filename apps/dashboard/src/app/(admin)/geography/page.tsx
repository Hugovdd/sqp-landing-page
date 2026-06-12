import { BarList } from "@/components/telemetry/bar-list";
import { ChartCard } from "@/components/telemetry/chart-card";
import { CountryFlag } from "@/components/telemetry/country-flag";
import { PageShell } from "@/components/telemetry/page-shell";
import { fmt, StatCard } from "@/components/telemetry/stat-card";
import { countryName } from "@/lib/telemetry/countries";
import { filterCache, resolveFilters } from "@/lib/telemetry/filters";
import { getGeography } from "@/lib/telemetry/queries";

export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function GeographyPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const f = resolveFilters(filterCache.parse(await searchParams));
  const countries = await getGeography(f);
  const total = countries.reduce((s, c) => s + c.count, 0);

  return (
    <PageShell
      title="Geography"
      description="Install base by country (latest-seen, server-derived from request.cf)."
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Countries" value={fmt(countries.length)} />
        <StatCard label="Located installs" value={fmt(total)} />
      </div>

      <ChartCard title="Installs by country">
        <BarList
          items={countries.map((c) => ({
            key: c.key,
            count: c.count,
            label: countryName(c.key),
            leading: <CountryFlag code={c.key} />,
          }))}
          emptyLabel="No located installs in range"
        />
      </ChartCard>
    </PageShell>
  );
}
