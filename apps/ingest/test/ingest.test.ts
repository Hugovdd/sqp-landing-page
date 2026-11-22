// Endpoint behaviour against real SQLite with every migration applied, so the
// migration SQL and the Worker's INSERTs are checked together.
import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { beforeEach, describe, expect, it } from "vitest";

import worker from "../src/index";

const MIGRATIONS = new URL("../migrations/", import.meta.url);
const UUID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

let sqlite: DatabaseSync;

// Minimal D1 shim: prepare().bind().run() and batch().
function d1(db: DatabaseSync) {
  const prepare = (sql: string) => {
    const stmt = {
      args: [] as unknown[],
      bind: (...args: unknown[]) => ((stmt.args = args), stmt),
      run: async () => db.prepare(sql).run(...(stmt.args as never[])),
    };
    return stmt;
  };
  return {
    prepare,
    batch: async (stmts: { run: () => Promise<unknown> }[]) => {
      for (const s of stmts) await s.run();
    },
  } as unknown as D1Database;
}

async function post(event: string, app: Record<string, unknown>, props = {}) {
  const waits: Promise<unknown>[] = [];
  const res = await worker.fetch(
    new Request("https://ingest.test/e", {
      method: "POST",
      body: JSON.stringify({ v: 1, installId: UUID, event, ts: Date.now(), app, props }),
    }),
    { DB: d1(sqlite), TELEMETRY_ENABLED: "true" },
    { waitUntil: (p: Promise<unknown>) => waits.push(p) } as unknown as ExecutionContext,
  );
  await Promise.all(waits);
  return res;
}

const rows = (sql: string) => sqlite.prepare(sql).all();

const ae = { brand: "altar", appVersion: "0.9.0", aeVersion: "26.0", os: "macOS 15" };
const premiere = { ...ae, hostApp: "premiere", aeVersion: "26.1" };

beforeEach(() => {
  sqlite = new DatabaseSync(":memory:");
  for (const f of readdirSync(MIGRATIONS).filter((n) => n.endsWith(".sql")).sort()) {
    sqlite.exec(readFileSync(new URL(f, MIGRATIONS), "utf8"));
  }
});

describe("POST /e hostApp", () => {
  it("stores hostApp on every telemetry table", async () => {
    await post("session", premiere);
    await post("tool_used", premiere, { pane: "bridge", tool: "remove_ranges" });
    await post("error", premiere, { category: "react", name: "E", message: "m" });

    expect(rows("SELECT hostApp FROM installs")).toEqual([{ hostApp: "premiere" }]);
    expect(rows("SELECT hostApp FROM daily_active")).toEqual([{ hostApp: "premiere" }]);
    expect(rows("SELECT hostApp FROM usage_events")).toEqual([{ hostApp: "premiere" }]);
    // aeVersion keeps its name and carries the host's version (gate d4).
    expect(rows("SELECT hostApp, aeVersion FROM errors")).toEqual([
      { hostApp: "premiere", aeVersion: "26.1" },
    ]);
  });

  it("ingests an old payload without hostApp unchanged (NULL reads as After Effects)", async () => {
    await post("session", ae);
    await post("tool_used", ae, { pane: "rigging", tool: "pinning" });
    await post("error", ae, { category: "react", name: "E", message: "m" });

    expect(rows("SELECT hostApp FROM installs")).toEqual([{ hostApp: null }]);
    expect(rows("SELECT hostApp FROM daily_active")).toEqual([{ hostApp: null }]);
    expect(rows("SELECT hostApp, tool FROM usage_events")).toEqual([
      { hostApp: null, tool: "pinning" },
    ]);
    expect(rows("SELECT hostApp, aeVersion FROM errors")).toEqual([
      { hostApp: null, aeVersion: "26.0" },
    ]);
  });

  it("accepts hostApp ae", async () => {
    await post("tool_used", { ...ae, hostApp: "ae" }, { pane: "p", tool: "t" });
    expect(rows("SELECT hostApp FROM usage_events")).toEqual([{ hostApp: "ae" }]);
  });

  it("drops an event with an unknown hostApp", async () => {
    const res = await post("tool_used", { ...ae, hostApp: "illustrator" }, { pane: "p", tool: "t" });
    expect(res.status).toBe(204);
    expect(rows("SELECT * FROM usage_events")).toEqual([]);
  });
});
