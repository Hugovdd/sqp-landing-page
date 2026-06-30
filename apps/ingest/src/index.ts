// Telemetry ingestion Worker — POST /e, fire-and-forget.
// Returns 204 for every request (valid, malformed, or kill-switch-off); clients
// ignore the response. All DB writes happen in ctx.waitUntil() so client-visible
// latency is negligible. Storage is D1 only (ADR-0001).

import { parseEnvelope, scrubError, type ParsedEnvelope } from "@sqp/shared";

export interface Env {
  DB: D1Database;
  TELEMETRY_ENABLED: string;
}

const CORS: Record<string, string> = {
  // Client is a CEP/Chromium panel with no fixed origin — CORS is open.
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Max-Age": "86400",
};

function noContent(): Response {
  return new Response(null, { status: 204, headers: CORS });
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") return noContent(); // CORS preflight
    if (req.method !== "POST" || url.pathname !== "/e") {
      return new Response("Not found", { status: 404, headers: CORS });
    }

    // Kill switch: accept-and-discard (no write) when disabled.
    if (env.TELEMETRY_ENABLED !== "true") return noContent();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return noContent(); // malformed JSON → silent drop
    }

    const receivedAt = Date.now();
    const parsed = parseEnvelope(body, receivedAt);
    if (!parsed) return noContent(); // malformed envelope → silent drop

    const country = (req.cf?.country as string | undefined) ?? null;

    // Respond immediately; persist in the background.
    ctx.waitUntil(
      writeEvent(env.DB, parsed, receivedAt, country).catch((err) => {
        console.error("ingest write failed", err);
      }),
    );
    return noContent();
  },

  // Daily retention prune (decision 6).
  async scheduled(
    _event: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    ctx.waitUntil(prune(env.DB));
  },
};

// --- helpers ---

function utcDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

function numOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function strOrNull(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

// --- write routing ---

async function writeEvent(
  db: D1Database,
  e: ParsedEnvelope,
  receivedAt: number,
  country: string | null,
): Promise<void> {
  const { installId, event, app } = e;
  const brand = app.brand;
  const os = app.os ?? null;
  const appVersion = app.appVersion ?? null;
  // Coarse license plan resolves asynchronously on the client, so early events
  // carry "unknown". Treat unknown/absent as "no new information" so a later
  // session heartbeat can't clobber a previously-resolved plan back to unknown.
  const licensePlanRaw = app.license?.plan ?? null;
  const licensePlan =
    licensePlanRaw && licensePlanRaw !== "unknown" ? licensePlanRaw : null;
  const licenseType = licensePlan ? (app.license?.type ?? null) : null;

  // Upsert the identity row. `withInstalledAt` is only true for app_installed.
  // firstSeen is never overwritten; installedAt is set once and kept (COALESCE);
  // os/appVersion/country are refreshed to latest-seen. license* are latest
  // *known* (COALESCE(new, existing) — a NULL/unknown never overwrites a value).
  const upsertInstall = (withInstalledAt: boolean) =>
    db
      .prepare(
        `INSERT INTO installs
           (installId, firstSeen, installedAt, lastSeen, brand, os, appVersion, country,
            licensePlan, licenseType)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(installId) DO UPDATE SET
           lastSeen    = excluded.lastSeen,
           brand       = excluded.brand,
           os          = excluded.os,
           appVersion  = excluded.appVersion,
           country     = excluded.country,
           installedAt = COALESCE(installs.installedAt, excluded.installedAt),
           licensePlan = COALESCE(excluded.licensePlan, installs.licensePlan),
           licenseType = COALESCE(excluded.licenseType, installs.licenseType)`,
      )
      .bind(
        installId,
        receivedAt,
        withInstalledAt ? receivedAt : null,
        receivedAt,
        brand,
        os,
        appVersion,
        country,
        licensePlan,
        licenseType,
      );

  const insertUsage = (
    ev: string,
    indexedItemCount: number | null,
    compsDuplicated: number | null,
    mode: string | null,
    pane: string | null = null,
    tool: string | null = null,
    action: string | null = null,
  ) =>
    db
      .prepare(
        `INSERT INTO usage_events
           (receivedAt, brand, event, installId, os, appVersion, country,
            indexedItemCount, compsDuplicated, mode, pane, tool, action)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        receivedAt,
        brand,
        ev,
        installId,
        os,
        appVersion,
        country,
        indexedItemCount,
        compsDuplicated,
        mode,
        pane,
        tool,
        action,
      );

  switch (event) {
    case "app_installed":
      await upsertInstall(true).run();
      return;

    case "session":
      await db.batch([
        upsertInstall(false),
        db
          .prepare(
            `INSERT OR IGNORE INTO daily_active (installId, day, brand) VALUES (?, ?, ?)`,
          )
          .bind(installId, utcDay(receivedAt), brand),
      ]);
      return;

    case "fetch":
      await insertUsage(
        "fetch",
        numOrNull(e.props.indexedItemCount),
        null,
        null,
      ).run();
      return;

    case "tool_used":
      await insertUsage(
        "tool_used",
        null,
        null,
        null,
        strOrNull(e.props.pane),
        strOrNull(e.props.tool),
        strOrNull(e.props.action),
      ).run();
      return;

    case "duplication_run": {
      const comps = numOrNull(e.props.compsDuplicated) ?? 0;
      const mode = strOrNull(e.props.mode);
      await db.batch([
        insertUsage("duplication_run", null, comps, mode),
        // Upsert so a brand's counter row is created on first run — no per-brand
        // seed needed when onboarding a new product (the migration's seed lines
        // remain for the original brands but are no longer required).
        db
          .prepare(
            `INSERT INTO counters (brand, comps_total, runs_total)
               VALUES (?, ?, 1)
             ON CONFLICT(brand) DO UPDATE SET
               comps_total = comps_total + excluded.comps_total,
               runs_total  = runs_total  + 1`,
          )
          .bind(brand, comps),
      ]);
      return;
    }

    case "error": {
      const s = scrubError({
        name: strOrNull(e.props.name) ?? undefined,
        message: strOrNull(e.props.message) ?? undefined,
        stack: strOrNull(e.props.stack) ?? undefined,
        action: strOrNull(e.props.action) ?? undefined,
      });
      await db.batch([
        upsertInstall(false),
        db
          .prepare(
            `INSERT INTO errors
               (installId, receivedAt, brand, appVersion, aeVersion, os, country,
                category, name, message, stack, action)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            installId,
            receivedAt,
            brand,
            appVersion,
            app.aeVersion ?? null,
            os,
            country,
            strOrNull(e.props.category),
            s.name,
            s.message,
            s.stack ?? null,
            s.action ?? null,
          ),
      ]);
      return;
    }

    default:
      // Unknown event type — captured raw for later (decision 8).
      await insertUsage(event, null, null, null).run();
      return;
  }
}

// --- retention ---

const DAY_MS = 24 * 60 * 60 * 1000;

async function prune(db: D1Database): Promise<void> {
  const now = Date.now();
  const cut18mo = now - 550 * DAY_MS; // ~18 months
  const cut90d = now - 90 * DAY_MS;
  await db.batch([
    db.prepare(`DELETE FROM usage_events WHERE receivedAt < ?`).bind(cut18mo),
    db.prepare(`DELETE FROM daily_active WHERE day < ?`).bind(utcDay(cut18mo)),
    db.prepare(`DELETE FROM errors WHERE receivedAt < ?`).bind(cut90d),
  ]);
  // installs and counters are never pruned.
}
