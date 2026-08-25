import { z } from "zod";

import { DEFAULT_ALTAR_WAITLIST_URL } from "./altar-email";
import { altarOriginUrl } from "./altar-urls";

export const ALTAR_ACCESS_INVITE_PATH = "/admin/invite";
export const ALTAR_ACCESS_REVOKE_PATH = "/admin/revoke";

export type AccessInviteActionStatus =
  | "idle"
  | "sent"
  | "resent"
  | "revoked"
  | "unknown_person"
  | "invalid"
  | "unauthorized"
  | "unavailable"
  | "missing_config";

export interface AccessInviteActionState {
  status: AccessInviteActionStatus;
  email?: string;
  message?: string;
}

export const idleAccessInviteState: AccessInviteActionState = { status: "idle" };

const emailSchema = z.email();

export function parseAccessEmail(input: { email?: unknown }):
  | { ok: true; email: string }
  | { ok: false; status: "invalid"; message: string } {
  const email =
    typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (!email || !emailSchema.safeParse(email).success) {
    return {
      ok: false,
      status: "invalid",
      message: "A valid email is required.",
    };
  }
  return { ok: true, email };
}

export function altarAccessInviteUrl(origin: string | undefined): string {
  return altarOriginUrl(origin, DEFAULT_ALTAR_WAITLIST_URL, ALTAR_ACCESS_INVITE_PATH);
}

export function altarAccessRevokeUrl(origin: string | undefined): string {
  return altarOriginUrl(origin, DEFAULT_ALTAR_WAITLIST_URL, ALTAR_ACCESS_REVOKE_PATH);
}

const inviteOkSchema = z.object({
  ok: z.literal(true),
  issued: z.array(
    z.object({
      email: z.string(),
      outcome: z.enum(["minted", "reused"]).optional(),
    }),
  ),
  failed: z.array(z.object({ email: z.string() })).optional(),
});

export function parseAccessInviteResponse(
  payload: unknown,
  httpStatus: number,
): AccessInviteActionState {
  if (httpStatus === 401) return { status: "unauthorized" };
  const parsed = inviteOkSchema.safeParse(payload);
  if (parsed.success && parsed.data.issued.length > 0) {
    const reused = parsed.data.issued.every(
      (row) => row.outcome === "reused",
    );
    return { status: reused ? "resent" : "sent" };
  }
  if (httpStatus === 400) {
    return { status: "invalid", message: "Invite was rejected." };
  }
  return { status: "unavailable" };
}

const revokeOkSchema = z.object({
  ok: z.literal(true),
  email: z.string(),
});

export function parseAccessRevokeResponse(
  payload: unknown,
  httpStatus: number,
): AccessInviteActionState {
  if (httpStatus === 401) return { status: "unauthorized" };
  if (httpStatus === 404) return { status: "unknown_person" };
  if (revokeOkSchema.safeParse(payload).success) return { status: "revoked" };
  if (httpStatus === 400) return { status: "invalid" };
  return { status: "unavailable" };
}
