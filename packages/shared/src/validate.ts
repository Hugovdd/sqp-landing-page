// Envelope validation: strict spine (the drop-malformed gate), lenient props
// (unknown keys allowed), sanity bounds, and forward-compat capture of unknown
// event types. See decisions 4/5/8 in the plan.

import { z } from "zod";

import {
  KNOWN_EVENTS,
  MAX_COMPS_PER_RUN,
  MAX_EVENT_NAME_LEN,
  MAX_INDEXED_ITEMS,
  MAX_OS_LEN,
  MAX_TS_SKEW_MS,
  MAX_VERSION_LEN,
  MIN_TS_MS,
  ERROR_ACTION_MAX,
  ERROR_MESSAGE_MAX,
  ERROR_NAME_MAX,
  ERROR_STACK_MAX,
} from "./constants";
import type { ParsedEnvelope } from "./envelope";

// Version-proof UUID check (avoids zod v3/v4 `.uuid()` API drift). Any version.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const AppSchema = z
  .object({
    brand: z.enum(["ae", "binance"]),
    appVersion: z.string().min(1).max(MAX_VERSION_LEN),
    aeVersion: z.string().max(MAX_VERSION_LEN).optional(),
    os: z.string().max(MAX_OS_LEN).optional(),
  })
  .catchall(z.unknown());

// The spine. If this fails, the row is malformed → dropped silently.
const SpineSchema = z
  .object({
    v: z.literal(1),
    installId: z.string().regex(UUID_RE),
    event: z.string().min(1).max(MAX_EVENT_NAME_LEN),
    ts: z.number().refine(Number.isFinite, "ts must be finite"),
    app: AppSchema,
    props: z.record(z.string(), z.unknown()).optional().default({}),
  })
  .catchall(z.unknown());

// Per-known-event props. `.catchall` keeps unknown keys (forward-compat);
// the explicit fields impose sanity bounds (abuse rejection).
const PropsByEvent = {
  app_installed: z.object({}).catchall(z.unknown()),
  session: z.object({}).catchall(z.unknown()),
  fetch: z
    .object({
      indexedItemCount: z
        .number()
        .int()
        .nonnegative()
        .max(MAX_INDEXED_ITEMS)
        .optional(),
    })
    .catchall(z.unknown()),
  duplication_run: z
    .object({
      compsDuplicated: z.number().int().nonnegative().max(MAX_COMPS_PER_RUN),
      mode: z.enum(["current", "all"]),
    })
    .catchall(z.unknown()),
  error: z
    .object({
      category: z.enum(["react", "extendscript", "unhandled"]),
      name: z.string().min(1).max(ERROR_NAME_MAX),
      message: z.string().max(ERROR_MESSAGE_MAX),
      stack: z.string().max(ERROR_STACK_MAX).optional(),
      action: z.string().max(ERROR_ACTION_MAX).optional(),
    })
    .catchall(z.unknown()),
} as const;

const KNOWN = new Set<string>(KNOWN_EVENTS);

/**
 * Validate a parsed-JSON envelope.
 * @returns the parsed envelope, or `null` if the spine is malformed or a known
 *   event's props violate their sanity bounds. Unknown event types pass the
 *   spine and are returned with `known: false` and raw props.
 */
export function parseEnvelope(
  input: unknown,
  now: number = Date.now(),
): ParsedEnvelope | null {
  const spine = SpineSchema.safeParse(input);
  if (!spine.success) return null;
  const e = spine.data;

  // ts sanity bound (light abuse protection; we bucket on receivedAt anyway).
  if (e.ts < MIN_TS_MS || e.ts > now + MAX_TS_SKEW_MS) return null;

  const known = KNOWN.has(e.event);
  let props: Record<string, unknown> = e.props;

  if (known) {
    const schema = PropsByEvent[e.event as keyof typeof PropsByEvent];
    const parsed = schema.safeParse(e.props);
    if (!parsed.success) return null; // known event with bad/abusive props → drop
    props = parsed.data as Record<string, unknown>;
  }

  return {
    v: 1,
    installId: e.installId,
    event: e.event,
    known,
    ts: e.ts,
    app: {
      brand: e.app.brand,
      appVersion: e.app.appVersion,
      aeVersion: e.app.aeVersion,
      os: e.app.os,
    },
    props,
  };
}
