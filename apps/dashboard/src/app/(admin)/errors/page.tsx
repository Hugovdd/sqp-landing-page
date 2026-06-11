import { ChartCard } from "@/components/telemetry/chart-card";
import { ErrorsTable } from "@/components/telemetry/errors-table";
import { PageShell } from "@/components/telemetry/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { filterCache, resolveFilters } from "@/lib/telemetry/filters";
import { getErrorGroups, getErrorOccurrences } from "@/lib/telemetry/queries";

export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;

function fmtTime(ms: number): string {
  return new Date(ms).toISOString().replace("T", " ").slice(0, 19) + "Z";
}

export default async function ErrorsPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const sp = await searchParams;
  const f = resolveFilters(filterCache.parse(sp));
  const groups = await getErrorGroups(f);

  const rawIdx = Number(sp.error);
  const selected =
    Number.isInteger(rawIdx) && rawIdx >= 0 && rawIdx < groups.length
      ? rawIdx
      : null;

  const group = selected !== null ? groups[selected] : null;
  const occurrences = group
    ? await getErrorOccurrences(group.name, group.message, f)
    : [];

  return (
    <PageShell
      title="Errors"
      description="Grouped by name + message. Every row is a real, client-filtered bug to triage."
    >
      <ChartCard title={`Error groups (${groups.length})`}>
        <ErrorsTable groups={groups} selected={selected} />
      </ChartCard>

      {group ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              {group.name}
              <Badge variant="secondary">{group.count} occurrences</Badge>
              <Badge variant="outline">{group.affected} installs</Badge>
            </CardTitle>
            <p className="text-muted-foreground text-sm">{group.message}</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {occurrences.map((o, i) => (
              <div
                key={i}
                className="rounded-md border p-3 text-sm"
              >
                <div className="text-muted-foreground mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span>{fmtTime(o.receivedAt)}</span>
                  <span>brand: {o.brand}</span>
                  {o.category ? <span>category: {o.category}</span> : null}
                  {o.os ? <span>os: {o.os}</span> : null}
                  {o.appVersion ? <span>app: {o.appVersion}</span> : null}
                  {o.aeVersion ? <span>ae: {o.aeVersion}</span> : null}
                  {o.country ? <span>country: {o.country}</span> : null}
                  {o.action ? <span>action: {o.action}</span> : null}
                </div>
                {o.stack ? (
                  <pre className="bg-muted overflow-x-auto rounded p-2 text-xs whitespace-pre-wrap">
                    {o.stack}
                  </pre>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </PageShell>
  );
}
