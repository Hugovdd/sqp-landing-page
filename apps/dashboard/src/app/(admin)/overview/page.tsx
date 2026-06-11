import { BarSeriesChart, LineSeriesChart } from "@/components/telemetry/charts";
import { ChartCard } from "@/components/telemetry/chart-card";
import { PageShell } from "@/components/telemetry/page-shell";
import { fmt, StatCard } from "@/components/telemetry/stat-card";
import { filterCache, resolveFilters } from "@/lib/telemetry/filters";
import {
  getActiveSeries,
  getFetchSeries,
  getInstallsSeries,
  getKpis,
} from "@/lib/telemetry/queries";

export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const f = resolveFilters(filterCache.parse(await searchParams));
  const [kpis, installs, active, fetches] = await Promise.all([
    getKpis(f),
    getInstallsSeries(f),
    getActiveSeries(f),
    getFetchSeries(f),
  ]);

  return (
    <PageShell
      title="Overview"
      description="Installs, active users, duplications and fetch volume."
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard label="Total installs" value={fmt(kpis.totalInstalls)} />
        <StatCard
          label="New installs"
          value={fmt(kpis.newInstalls)}
          hint="in selected range"
        />
        <StatCard label="DAU" value={fmt(kpis.dau)} hint="active today" />
        <StatCard label="MAU" value={fmt(kpis.mau)} hint="trailing 28 days" />
        <StatCard
          label="Comps duplicated"
          value={fmt(kpis.compsTotal)}
          hint="lifetime"
        />
        <StatCard
          label="Fetches"
          value={fmt(kpis.fetchCount)}
          hint="in selected range"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Cumulative installs"
          description="Running total of installs over the range"
        >
          <LineSeriesChart
            data={installs}
            xKey="day"
            series={[{ key: "cumulative", label: "Installs" }]}
          />
        </ChartCard>
        <ChartCard
          title="Active users / day"
          description="Distinct installs active each day (DAU)"
        >
          <LineSeriesChart
            data={active}
            xKey="day"
            series={[{ key: "count", label: "Active" }]}
          />
        </ChartCard>
        <ChartCard
          title="New installs / day"
          description="First app_installed per day"
        >
          <BarSeriesChart
            data={installs}
            xKey="day"
            series={[{ key: "created", label: "New installs" }]}
          />
        </ChartCard>
        <ChartCard
          title="Fetch volume / day"
          description="Fetch events per day"
        >
          <BarSeriesChart
            data={fetches}
            xKey="day"
            series={[{ key: "count", label: "Fetches" }]}
          />
        </ChartCard>
      </div>
    </PageShell>
  );
}
