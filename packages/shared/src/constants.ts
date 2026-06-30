// Shared telemetry vocabulary + abuse/sanity bounds.
// Both the ingestion Worker (apps/ingest) and the dashboard (apps/dashboard)
// import from here so the wire contract has a single source of truth.
// The product/brand vocabulary (BRANDS, Brand, PRODUCT_REGISTRY) lives in
// ./products and is re-exported through the package barrel (./index).

/** Event names the dashboard understands. Unknown events are still stored raw. */
export const KNOWN_EVENTS = [
  "app_installed",
  "session",
  "fetch",
  "duplication_run",
  "tool_used",
  "error",
] as const;
export type KnownEvent = (typeof KNOWN_EVENTS)[number];

/** duplication_run.mode — which comps were duplicated. */
export const DUPLICATION_MODES = ["current", "all"] as const;
export type DuplicationMode = (typeof DUPLICATION_MODES)[number];

/** error.category — where the error originated (client pre-filters to real bugs). */
export const ERROR_CATEGORIES = ["react", "extendscript", "unhandled"] as const;
export type ErrorCategory = (typeof ERROR_CATEGORIES)[number];

/**
 * Coarse, non-identifying license plan attached to app context. Never the key.
 * "unknown" = the async AESP check hadn't resolved when the event fired.
 */
export const LICENSE_PLANS = ["trial", "paid", "none", "unknown"] as const;
export type LicensePlan = (typeof LICENSE_PLANS)[number];

// --- Sanity / abuse bounds (see plan: "reject absurd compsDuplicated, skewed ts") ---

/** Reject ts older than ~2017 — anything earlier is junk/abuse. */
export const MIN_TS_MS = 1_500_000_000_000;
/** Reject ts more than 2 days in the future relative to receipt (clock-skew tolerance). */
export const MAX_TS_SKEW_MS = 2 * 24 * 60 * 60 * 1000;
/** A single duplication run above this is implausible → drop the event. */
export const MAX_COMPS_PER_RUN = 100_000;
/** Upper bound on a fetch's indexed item count. */
export const MAX_INDEXED_ITEMS = 10_000_000;

// String length caps (also enforced by the error scrubber).
export const MAX_EVENT_NAME_LEN = 64;
export const MAX_VERSION_LEN = 64;
export const MAX_OS_LEN = 64;
export const ERROR_NAME_MAX = 200;
export const ERROR_MESSAGE_MAX = 2000;
export const ERROR_STACK_MAX = 8000;
export const ERROR_ACTION_MAX = 200;

// tool_used caps — low-cardinality identifiers, not free text.
export const MAX_PANE_LEN = 32;
export const MAX_TOOL_LEN = 48;
export const MAX_TOOL_ACTION_LEN = 48;

/** app.license.type — AESP licenseType code (SUL/SUB/EDU/…); low-cardinality. */
export const MAX_LICENSE_TYPE_LEN = 32;
