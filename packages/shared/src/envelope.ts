// The wire envelope sent by the plugins to POST /e.
// See CONTEXT.md for the meaning of installId / Brand / Session.

import type { DuplicationMode, ErrorCategory, KnownEvent } from "./constants";
import type { Brand } from "./products";

/** Anonymous app context attached to every event. */
export interface AppInfo {
  brand: Brand;
  appVersion: string;
  /** After Effects version — present for the AE brand; may be absent for binance. */
  aeVersion?: string;
  /** OS string, e.g. "macOS 14". */
  os?: string;
}

// Per-event props (the brief's payload shapes).
export interface AppInstalledProps {}
export interface SessionProps {}
export interface FetchProps {
  indexedItemCount?: number;
}
export interface DuplicationRunProps {
  compsDuplicated: number;
  mode: DuplicationMode;
}
export interface ErrorProps {
  category: ErrorCategory;
  name: string;
  message: string;
  stack?: string;
  action?: string;
}

/** The raw envelope as it arrives on the wire (before server stamping). */
export interface Envelope {
  v: 1;
  installId: string;
  event: string;
  ts: number;
  app: AppInfo;
  props: Record<string, unknown>;
}

/**
 * Result of validating an envelope. `known` distinguishes a recognised event
 * (props validated + bounded) from a forward-compat unknown event (stored raw).
 */
export interface ParsedEnvelope {
  v: 1;
  installId: string;
  event: string;
  known: boolean;
  ts: number;
  app: AppInfo;
  props: Record<string, unknown>;
}

export type { KnownEvent, DuplicationMode, ErrorCategory };
