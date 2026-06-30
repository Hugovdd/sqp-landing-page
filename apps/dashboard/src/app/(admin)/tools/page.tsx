import { toolNav } from "@sqp/shared/products";
import { parseAsString } from "nuqs/server";

import { BarList } from "@/components/telemetry/bar-list";
import { ChartCard } from "@/components/telemetry/chart-card";
import { BarSeriesChart } from "@/components/telemetry/charts";
import { PageShell } from "@/components/telemetry/page-shell";
import { fmt, StatCard } from "@/components/telemetry/stat-card";
import { filterCache, resolveFilters } from "@/lib/telemetry/filters";
import { getToolUsage } from "@/lib/telemetry/queries";

export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const sp = await searchParams;
  const f = resolveFilters(filterCache.parse(sp));
  // The pane is the surface identity (rigging / forge / chat / vault); default to
  // "rigging" so AE Sheets' single tools route keeps working without a ?pane=.
  const pane = parseAsString.withDefault("rigging").parseServerSide(sp.pane);
  const navItem = toolNav(f.product, pane);
  const title = navItem?.label ?? "Tools";

  // Surfaces whose telemetry isn't wired yet (Chat / Vault): show an empty state,
  // never query — the same pane-driven page lights up once events ship.
  if (navItem?.placeholder) {
    return (
      <PageShell title={title} description="This surface isn't reporting yet.">
        <div className="border-border text-muted-foreground flex min-h-[240px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm font-medium">Telemetry not wired yet</p>
          <p className="text-xs">
            {title} events aren&apos;t being collected. This view will populate
            automatically once they ship.
          </p>
        </div>
      </PageShell>
    );
  }

  const { tools, actions, perDay, reach, activeInstalls } = await getToolUsage(
    f,
    pane,
  );

  return (
    <PageShell
      title={title}
      description={`Which ${title.toLowerCase()} are used most (successful invocations, in the selected range).`}
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active installs"
          value={fmt(activeInstalls)}
          hint="used this surface in range"
        />
        <StatCard label="Distinct tools" value={fmt(tools.length)} />
        <StatCard
          label="Total uses"
          value={fmt(tools.reduce((s, t) => s + t.count, 0))}
          hint="in selected range"
        />
        <StatCard
          label="Top tool"
          value={tools[0]?.key ?? "-"}
          hint={tools[0] ? `${fmt(tools[0].count)} uses` : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="By tool" description="Most-used tools by invocations">
          <BarList items={tools} emptyLabel="No tool usage yet" />
        </ChartCard>
        <ChartCard
          title="By tool · action"
          description="Tool drilled down to sub-action"
        >
          <BarList items={actions} emptyLabel="No tool usage yet" />
        </ChartCard>
        <ChartCard
          title="Usage over time"
          description="tool_used events per day"
        >
          <BarSeriesChart
            data={perDay}
            xKey="day"
            series={[{ key: "count", label: "Uses" }]}
          />
        </ChartCard>
        <ChartCard
          title="Reach per tool"
          description="Distinct installs that used each tool"
        >
          <BarList
            items={reach}
            emptyLabel="No tool usage yet"
            showPercent={false}
          />
        </ChartCard>
      </div>
    </PageShell>
  );
}
