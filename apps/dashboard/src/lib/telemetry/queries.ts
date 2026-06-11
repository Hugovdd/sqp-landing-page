import "server-only";

import { db } from "./d1";
import { brandFilter, type ResolvedFilters } from "./filters";

// All queries are exact SQL over the single D1 store (ADR-0001). Each is filtered
// by the resolved brand + date range. `brandFilter` appends `AND brand = ?` last,
// so its bind always goes at the end of the binds array.

export interface Kpis {
  totalInstalls: number;
  newInstalls: number;
  dau: number;
  mau: number;
  compsTotal: number;
  runsTotal: number;
  fetchCount: number;
}

async function scalar(sql: string, binds: unknown[]): Promise<number> {
  const row = await db()
    .prepare(sql)
    .bind(...binds)
    .first<{ c: number }>();
  return row?.c ?? 0;
}

export async function getKpis(f: ResolvedFilters): Promise<Kpis> {
  const b = brandFilter(f);
  const [totalInstalls, newInstalls, dau, mau, counters, fetchCount] =
    await Promise.all([
      scalar(`SELECT count(*) c FROM installs WHERE 1=1${b.sql}`, b.binds),
      scalar(
        `SELECT count(*) c FROM installs WHERE installedAt IS NOT NULL AND installedAt BETWEEN ? AND ?${b.sql}`,
        [f.fromMs, f.toMs, ...b.binds],
      ),
      scalar(`SELECT count(*) c FROM daily_active WHERE day = ?${b.sql}`, [
        f.todayDay,
        ...b.binds,
      ]),
      scalar(
        `SELECT count(DISTINCT installId) c FROM daily_active WHERE day BETWEEN ? AND ?${b.sql}`,
        [f.mauFromDay, f.todayDay, ...b.binds],
      ),
      db()
        .prepare(
          `SELECT COALESCE(sum(comps_total),0) comps, COALESCE(sum(runs_total),0) runs FROM counters WHERE 1=1${b.sql}`,
        )
        .bind(...b.binds)
        .first<{ comps: number; runs: number }>(),
      scalar(
        `SELECT count(*) c FROM usage_events WHERE event='fetch' AND receivedAt BETWEEN ? AND ?${b.sql}`,
        [f.fromMs, f.toMs, ...b.binds],
      ),
    ]);

  return {
    totalInstalls,
    newInstalls,
    dau,
    mau,
    compsTotal: counters?.comps ?? 0,
    runsTotal: counters?.runs ?? 0,
    fetchCount,
  };
}

export interface DayCount {
  day: string;
  count: number;
}

/** New installs/day (by installedAt) plus a running cumulative total. */
export async function getInstallsSeries(
  f: ResolvedFilters,
): Promise<{ day: string; created: number; cumulative: number }[]> {
  const b = brandFilter(f);
  const rows = (
    await db()
      .prepare(
        `SELECT date(installedAt/1000,'unixepoch') day, count(*) count
           FROM installs
          WHERE installedAt IS NOT NULL AND installedAt BETWEEN ? AND ?${b.sql}
          GROUP BY day ORDER BY day`,
      )
      .bind(f.fromMs, f.toMs, ...b.binds)
      .all<DayCount>()
  ).results;

  // Cumulative needs the count of installs created before the window.
  const base = await scalar(
    `SELECT count(*) c FROM installs WHERE installedAt IS NOT NULL AND installedAt < ?${b.sql}`,
    [f.fromMs, ...b.binds],
  );

  let running = base;
  return rows.map((r) => {
    running += r.count;
    return { day: r.day, created: r.count, cumulative: running };
  });
}

/** DAU per day across the range (distinct active installs that day). */
export async function getActiveSeries(f: ResolvedFilters): Promise<DayCount[]> {
  const b = brandFilter(f);
  return (
    await db()
      .prepare(
        `SELECT day, count(*) count FROM daily_active
          WHERE day BETWEEN ? AND ?${b.sql}
          GROUP BY day ORDER BY day`,
      )
      .bind(f.fromDay, f.toDay, ...b.binds)
      .all<DayCount>()
  ).results;
}

export interface DuplicationData {
  runs: number;
  comps: number;
  avgPerRun: number;
  compsLifetime: number;
  perDay: { day: string; runs: number; comps: number }[];
  modeSplit: { mode: string; count: number }[];
}

export async function getDuplication(
  f: ResolvedFilters,
): Promise<DuplicationData> {
  const b = brandFilter(f);
  const range = [f.fromMs, f.toMs, ...b.binds];
  const [totals, perDay, modeSplit, lifetime] = await Promise.all([
    db()
      .prepare(
        `SELECT count(*) runs, COALESCE(sum(compsDuplicated),0) comps
           FROM usage_events
          WHERE event='duplication_run' AND receivedAt BETWEEN ? AND ?${b.sql}`,
      )
      .bind(...range)
      .first<{ runs: number; comps: number }>(),
    db()
      .prepare(
        `SELECT date(receivedAt/1000,'unixepoch') day, count(*) runs,
                COALESCE(sum(compsDuplicated),0) comps
           FROM usage_events
          WHERE event='duplication_run' AND receivedAt BETWEEN ? AND ?${b.sql}
          GROUP BY day ORDER BY day`,
      )
      .bind(...range)
      .all<{ day: string; runs: number; comps: number }>(),
    db()
      .prepare(
        `SELECT COALESCE(mode,'unknown') mode, count(*) count
           FROM usage_events
          WHERE event='duplication_run' AND receivedAt BETWEEN ? AND ?${b.sql}
          GROUP BY mode`,
      )
      .bind(...range)
      .all<{ mode: string; count: number }>(),
    scalar(
      `SELECT COALESCE(sum(comps_total),0) c FROM counters WHERE 1=1${b.sql}`,
      b.binds,
    ),
  ]);

  const runs = totals?.runs ?? 0;
  const comps = totals?.comps ?? 0;
  return {
    runs,
    comps,
    avgPerRun: runs > 0 ? comps / runs : 0,
    compsLifetime: lifetime,
    perDay: perDay.results,
    modeSplit: modeSplit.results,
  };
}

/** Fetch volume per day (events + indexed items). */
export async function getFetchSeries(
  f: ResolvedFilters,
): Promise<{ day: string; count: number; items: number }[]> {
  const b = brandFilter(f);
  return (
    await db()
      .prepare(
        `SELECT date(receivedAt/1000,'unixepoch') day, count(*) count,
                COALESCE(sum(indexedItemCount),0) items
           FROM usage_events
          WHERE event='fetch' AND receivedAt BETWEEN ? AND ?${b.sql}
          GROUP BY day ORDER BY day`,
      )
      .bind(f.fromMs, f.toMs, ...b.binds)
      .all<{ day: string; count: number; items: number }>()
  ).results;
}

export interface KeyCount {
  key: string;
  count: number;
}

/** Install base by latest-seen country (decision 7). */
export async function getGeography(f: ResolvedFilters): Promise<KeyCount[]> {
  const b = brandFilter(f);
  return (
    await db()
      .prepare(
        `SELECT country key, count(*) count FROM installs
          WHERE country IS NOT NULL AND country <> ''${b.sql}
          GROUP BY country ORDER BY count DESC`,
      )
      .bind(...b.binds)
      .all<KeyCount>()
  ).results;
}

/** OS + app-version breakdown of the install base (latest-seen). */
export async function getBreakdowns(
  f: ResolvedFilters,
): Promise<{ os: KeyCount[]; version: KeyCount[] }> {
  const b = brandFilter(f);
  const [os, version] = await Promise.all([
    db()
      .prepare(
        `SELECT COALESCE(NULLIF(os,''),'Unknown') key, count(*) count
           FROM installs WHERE 1=1${b.sql} GROUP BY key ORDER BY count DESC`,
      )
      .bind(...b.binds)
      .all<KeyCount>(),
    db()
      .prepare(
        `SELECT COALESCE(NULLIF(appVersion,''),'Unknown') key, count(*) count
           FROM installs WHERE 1=1${b.sql} GROUP BY key ORDER BY count DESC`,
      )
      .bind(...b.binds)
      .all<KeyCount>(),
  ]);
  return { os: os.results, version: version.results };
}

export interface ErrorGroup {
  name: string;
  message: string;
  count: number;
  lastSeen: number;
  affected: number;
}

/** Errors grouped by name+message — every row is a real bug to triage. */
export async function getErrorGroups(
  f: ResolvedFilters,
): Promise<ErrorGroup[]> {
  const b = brandFilter(f);
  return (
    await db()
      .prepare(
        `SELECT name, message, count(*) count, max(receivedAt) lastSeen,
                count(DISTINCT installId) affected
           FROM errors
          WHERE receivedAt BETWEEN ? AND ?${b.sql}
          GROUP BY name, message ORDER BY count DESC LIMIT 200`,
      )
      .bind(f.fromMs, f.toMs, ...b.binds)
      .all<ErrorGroup>()
  ).results;
}

export interface ErrorOccurrence {
  receivedAt: number;
  brand: string;
  appVersion: string | null;
  aeVersion: string | null;
  os: string | null;
  country: string | null;
  category: string | null;
  stack: string | null;
  action: string | null;
}

/** Recent individual occurrences of one error group (drill-down). */
export async function getErrorOccurrences(
  name: string,
  message: string,
  f: ResolvedFilters,
): Promise<ErrorOccurrence[]> {
  const b = brandFilter(f);
  // Range-bound to match getErrorGroups, so the drill-down rows agree with the
  // group's count/affected totals.
  return (
    await db()
      .prepare(
        `SELECT receivedAt, brand, appVersion, aeVersion, os, country,
                category, stack, action
           FROM errors
          WHERE name = ? AND message = ? AND receivedAt BETWEEN ? AND ?${b.sql}
          ORDER BY receivedAt DESC LIMIT 100`,
      )
      .bind(name, message, f.fromMs, f.toMs, ...b.binds)
      .all<ErrorOccurrence>()
  ).results;
}
