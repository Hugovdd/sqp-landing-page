import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import type { PersonDetail } from "./altar-people";
import type { D1Database } from "./telemetry/d1";

export interface IdentifiedUsage {
  installId: string;
  orgId: string | null;
  lastSeen: number | null;
  appVersion: string | null;
  os: string | null;
  sessionDays: number;
  tools: { tool: string; count: number }[];
}

export type IdentifiedUsageResult =
  | { status: "ready"; rows: IdentifiedUsage[] }
  | { status: "empty" }
  | {
      status: "unavailable";
      reason: "missing_binding" | "missing_table" | "query_failed";
    };

function telemetryDb(): D1Database | null {
  const env = getCloudflareContext().env as unknown as { DB?: D1Database };
  return env.DB ?? null;
}

function waitlistDb(): D1Database | null {
  const env = getCloudflareContext().env as unknown as {
    ALTAR_WAITLIST?: D1Database;
  };
  return env.ALTAR_WAITLIST ?? null;
}

function placeholders(count: number): string {
  return Array.from({ length: count }, () => "?").join(",");
}

function usageFailure(error: unknown): IdentifiedUsageResult {
  const message = error instanceof Error ? error.message : String(error);
  const reason = /no such table/i.test(message)
    ? "missing_table"
    : "query_failed";
  console.error("Identified usage query failed.", error);
  return { status: "unavailable", reason };
}

export async function getIdentifiedUsage(args: {
  emails?: string[];
  userIds?: string[];
  orgIds?: string[];
  waitlist?: D1Database | null;
  telemetry?: D1Database | null;
}): Promise<IdentifiedUsageResult> {
  const waitlist = args.waitlist === undefined ? waitlistDb() : args.waitlist;
  const telemetry =
    args.telemetry === undefined ? telemetryDb() : args.telemetry;
  if (!waitlist || !telemetry) {
    return { status: "unavailable", reason: "missing_binding" };
  }

  const emails = (args.emails ?? []).filter(Boolean);
  const userIds = (args.userIds ?? []).filter(Boolean);
  const orgIds = (args.orgIds ?? []).filter(Boolean);
  if (emails.length === 0 && userIds.length === 0 && orgIds.length === 0) {
    return { status: "empty" };
  }

  const clauses: string[] = [];
  const binds: string[] = [];
  if (orgIds.length > 0) {
    clauses.push(`orgId IN (${placeholders(orgIds.length)})`);
    binds.push(...orgIds);
  }
  if (emails.length > 0) {
    clauses.push(`email IN (${placeholders(emails.length)})`);
    binds.push(...emails);
  }
  if (userIds.length > 0) {
    clauses.push(`userId IN (${placeholders(userIds.length)})`);
    binds.push(...userIds);
  }

  let links: { installId: string; orgId: string }[] = [];
  try {
    const rows = await waitlist
      .prepare(
        `SELECT DISTINCT installId, orgId FROM account_installs WHERE ${clauses.join(" OR ")}`,
      )
      .bind(...binds)
      .all<{ installId: string; orgId: string }>();
    links = rows.results ?? [];
  } catch (error) {
    return usageFailure(error);
  }
  if (links.length === 0) return { status: "empty" };

  const installIds = [...new Set(links.map((row) => row.installId))];
  const inList = placeholders(installIds.length);
  try {
    const [installs, days, tools] = await Promise.all([
      telemetry
        .prepare(
          `SELECT installId, lastSeen, appVersion, os FROM installs
            WHERE brand = 'altar' AND installId IN (${inList})`,
        )
        .bind(...installIds)
        .all<{
          installId: string;
          lastSeen: number | null;
          appVersion: string | null;
          os: string | null;
        }>(),
      telemetry
        .prepare(
          `SELECT installId, COUNT(DISTINCT day) AS sessionDays FROM daily_active
            WHERE brand = 'altar' AND installId IN (${inList})
            GROUP BY installId`,
        )
        .bind(...installIds)
        .all<{ installId: string; sessionDays: number }>(),
      telemetry
        .prepare(
          `SELECT installId, tool, COUNT(*) AS count FROM usage_events
            WHERE brand = 'altar' AND event = 'tool_used' AND installId IN (${inList})
              AND tool IS NOT NULL
            GROUP BY installId, tool
            ORDER BY count DESC`,
        )
        .bind(...installIds)
        .all<{ installId: string; tool: string; count: number }>(),
    ]);

    const dayMap = new Map(
      (days.results ?? []).map((row) => [row.installId, row.sessionDays]),
    );
    const toolMap = new Map<string, { tool: string; count: number }[]>();
    for (const row of tools.results ?? []) {
      const list = toolMap.get(row.installId) ?? [];
      if (list.length < 5) list.push({ tool: row.tool, count: row.count });
      toolMap.set(row.installId, list);
    }
    const installMap = new Map(
      (installs.results ?? []).map((row) => [row.installId, row]),
    );

    const rows = links.map((link) => {
      const install = installMap.get(link.installId);
      return {
        installId: link.installId,
        orgId: link.orgId,
        lastSeen: install?.lastSeen ?? null,
        appVersion: install?.appVersion ?? null,
        os: install?.os ?? null,
        sessionDays: dayMap.get(link.installId) ?? 0,
        tools: toolMap.get(link.installId) ?? [],
      };
    });
    return { status: "ready", rows };
  } catch (error) {
    return usageFailure(error);
  }
}

export async function getPersonUsage(
  detail: PersonDetail,
): Promise<IdentifiedUsageResult> {
  return getIdentifiedUsage({
    emails: [
      detail.email,
      ...detail.invites.flatMap((invite) =>
        invite.claimedEmail ? [invite.claimedEmail] : [],
      ),
    ],
    userIds: detail.invites.flatMap((invite) =>
      invite.claimedUserId ? [invite.claimedUserId] : [],
    ),
  });
}

export function usageUnavailableCopy(
  reason: Extract<IdentifiedUsageResult, { status: "unavailable" }>["reason"],
): string {
  if (reason === "missing_binding") {
    return "Identified usage is unavailable. A database binding is missing.";
  }
  if (reason === "missing_table") {
    return "Identified usage is unavailable. account_installs is not migrated.";
  }
  return "Identified usage could not be queried.";
}

export function usageForOrg(
  result: IdentifiedUsageResult,
  orgId: string,
): IdentifiedUsageResult {
  if (result.status !== "ready") return result;
  const rows = result.rows.filter((row) => row.orgId === orgId);
  return rows.length > 0 ? { status: "ready", rows } : { status: "empty" };
}
