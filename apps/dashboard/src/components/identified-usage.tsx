import type { IdentifiedUsageResult } from "@/lib/altar-usage";
import { usageUnavailableCopy } from "@/lib/altar-usage";

export function IdentifiedUsageCard({
  result,
  title = "Identified usage",
}: {
  result: IdentifiedUsageResult;
  title?: string;
}) {
  return (
    <div className="rounded-lg border p-3 text-sm">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {title}
      </p>
      {result.status === "unavailable" ? (
        <p className="mt-2">{usageUnavailableCopy(result.reason)}</p>
      ) : result.status === "empty" ? (
        <p className="text-muted-foreground mt-2">
          No installs attached yet.
        </p>
      ) : (
        result.rows.map((row) => (
          <div key={`${row.orgId}:${row.installId}`} className="mt-2">
            <p className="font-mono text-xs">{row.installId}</p>
            <p className="text-muted-foreground text-xs">
              {row.appVersion ?? "Unknown version"} · {row.sessionDays} session
              days
            </p>
          </div>
        ))
      )}
    </div>
  );
}
