// Server-side error scrubbing (decision 4). Error strings are runtime-generated
// and routinely embed user-home paths and project filenames — PII + "project
// content", both forbidden. We redact before anything touches D1. Raw stacks are
// NEVER stored. This is heuristic defense-in-depth, not a guarantee.

import {
  ERROR_ACTION_MAX,
  ERROR_MESSAGE_MAX,
  ERROR_NAME_MAX,
  ERROR_STACK_MAX,
} from "./constants";

// User-content / media extensions whose *filenames* are private project data.
// Code extensions (.js/.jsx/.ts/.json) are deliberately KEPT so stack traces of
// our own source stay debuggable.
const PRIVATE_FILE_RE =
  /[^\s"'()]*\.(aep|aepx|ai|psd|pdf|prproj|mogrt|sketch|fig|png|jpe?g|gif|webp|tiff?|exr|svg|mp4|mov|avi|mkv|wav|mp3|aif{1,2})\b/gi;

/** Collapse home dirs and strip private project filenames from one string. */
export function scrubString(input: string | undefined | null): string {
  if (!input) return "";
  let out = input;
  // user home directories -> ~
  // Windows first (both slash styles), dropping the drive letter: C:\Users\x | C:/Users/x
  out = out.replace(/[A-Za-z]:[\\/]Users[\\/][^\\/\s]+/gi, "~");
  out = out.replace(/\/Users\/[^/\s]+/gi, "~"); // macOS
  out = out.replace(/\/home\/[^/\s]+/gi, "~"); // linux
  out = out.replace(/\/Volumes\/[^/\s]+/gi, "~"); // mac external / scratch volumes
  // private project / media filenames -> placeholder
  out = out.replace(PRIVATE_FILE_RE, "<file>");
  return out;
}

function clip(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) : s;
}

export interface RawError {
  name?: string;
  message?: string;
  stack?: string;
  action?: string;
}

export interface ScrubbedError {
  name: string;
  message: string;
  stack?: string;
  action?: string;
}

/** Scrub + length-cap an error payload before storage. */
export function scrubError(e: RawError): ScrubbedError {
  return {
    name: clip(scrubString(e.name), ERROR_NAME_MAX),
    message: clip(scrubString(e.message), ERROR_MESSAGE_MAX),
    stack: e.stack ? clip(scrubString(e.stack), ERROR_STACK_MAX) : undefined,
    action: e.action ? clip(scrubString(e.action), ERROR_ACTION_MAX) : undefined,
  };
}
