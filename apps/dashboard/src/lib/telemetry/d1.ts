import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

// Minimal D1 surface we use. Avoids pulling the full @cloudflare/workers-types
// runtime globals, which clash with Next's lib.dom (Request/Response/etc.).
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<unknown>;
}
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
}

/** The shared telemetry D1 store (read path). */
export function db(): D1Database {
  const env = getCloudflareContext().env as unknown as { DB: D1Database };
  return env.DB;
}
