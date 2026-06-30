// The wire envelope sent by the plugins to POST /e.
// See CONTEXT.md for the meaning of installId / Brand / Session.

import type {
  DuplicationMode,
  ErrorCategory,
  KnownEvent,
  LicensePlan,
} from "./constants";
import type { Brand } from "./products";

/** Coarse, non-identifying license classification. Never the license key. */
export interface LicenseInfo {
  plan: LicensePlan;
  /** AESP licenseType code (SUL/SUB/EDU/…), when known. */
  type?: string;
}

/** Anonymous app context attached to every event. */
export interface AppInfo {
  brand: Brand;
  appVersion: string;
  /** After Effects version — present for the AE brand; may be absent for binance. */
  aeVersion?: string;
  /** OS string, e.g. "macOS 14". */
  os?: string;
  /** Coarse license plan — resolves async, so may be "unknown" on early events. */
  license?: LicenseInfo;
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
export interface ToolUsedProps {
  /** Which panel surface the tool lives in, e.g. "rigging". */
  pane: string;
  /** Tool family, e.g. "pinning" | "grid-packer". */
  tool: string;
  /** Optional sub-action, e.g. a position ("top-left") or dimension ("width"). */
  action?: string;
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

export type { KnownEvent, DuplicationMode, ErrorCategory, LicensePlan };
