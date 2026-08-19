import { BarList } from "@/components/telemetry/bar-list";
import { ChartCard } from "@/components/telemetry/chart-card";
import { BarSeriesChart, LineSeriesChart } from "@/components/telemetry/charts";
import { PageShell } from "@/components/telemetry/page-shell";
import { fmt, StatCard } from "@/components/telemetry/stat-card";
import { filterCache, resolveFilters } from "@/lib/telemetry/filters";
import { getDuplication } from "@/lib/telemetry/queries";

export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function DuplicationPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const f = resolveFilters(filterCache.parse(await searchParams));
  const d = await getDuplication(f);

  return (
    <PageShell
      title="Duplication"
      description="Comps duplicated — the core action the plugins perform."
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Comps duplicated"
          value={fmt(d.compsLifetime)}
          hint="lifetime (exact)"
        />
        <StatCard label="Runs" value={fmt(d.runs)} hint="in selected range" />
        <StatCard
          label="Comps in range"
          value={fmt(d.comps)}
          hint="in selected range"
        />
        <StatCard
          label="Avg comps / run"
          value={d.avgPerRun.toFixed(1)}
          hint="in selected range"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Runs / day">
          <BarSeriesChart
            data={d.perDay}
            xKey="day"
            series={[{ key: "runs", label: "Runs" }]}
          />
        </ChartCard>
        <ChartCard title="Comps duplicated / day">
          <LineSeriesChart
            data={d.perDay}
            xKey="day"
            series={[{ key: "comps", label: "Comps" }]}
          />
        </ChartCard>
        <ChartCard
          title="Mode split"
          description="Duplicated current comp vs all comps"
          className="lg:col-span-2"
        >
          <BarList
            items={d.modeSplit.map((m) => ({ key: m.mode, count: m.count }))}
            emptyLabel="No duplication runs in range"
          />
        </ChartCard>
      </div>
    </PageShell>
  );
}
