import { z } from "zod";

import { MINTABLE_TEAM_ROLES, type MintableTeamRole } from "./altar-teams";

export const DEFAULT_ALTAR_VAULT_URL = "https://sign.motionaltar.com";
export const ALTAR_TEAM_INVITE_PATH = "/admin/team-invite";

export type TeamInviteActionStatus =
  | "idle"
  | "sent"
  | "resent"
  | "already_member"
  | "delivery_failed"
  | "invalid"
  | "unknown_team"
  | "unauthorized"
  | "unavailable"
  | "missing_config";

export interface TeamInviteActionState {
  status: TeamInviteActionStatus;
  message?: string;
  email?: string;
  orgId?: string;
  role?: MintableTeamRole;
}

export const idleTeamInviteState: TeamInviteActionState = { status: "idle" };

const emailSchema = z.email();

export function parseTeamInviteInput(input: {
  email?: unknown;
  orgId?: unknown;
  role?: unknown;
}):
  | { ok: true; email: string; orgId: string; role: MintableTeamRole }
  | { ok: false; status: "invalid"; message: string } {
  const email =
    typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const orgId = typeof input.orgId === "string" ? input.orgId.trim() : "";
  const role = typeof input.role === "string" ? input.role.trim() : "member";

  if (!email || !emailSchema.safeParse(email).success) {
    return {
      ok: false,
      status: "invalid",
      message: "A valid email is required.",
    };
  }
  if (!orgId) {
    return { ok: false, status: "invalid", message: "A Team is required." };
  }
  if (role === "viewer") {
    return {
      ok: false,
      status: "invalid",
      message: "viewer is not mintable.",
    };
  }
  if (!(MINTABLE_TEAM_ROLES as readonly string[]).includes(role)) {
    return {
      ok: false,
      status: "invalid",
      message: "Role must be member or admin.",
    };
  }
  return { ok: true, email, orgId, role: role as MintableTeamRole };
}

export function altarTeamInviteUrl(origin: string | undefined): string {
  const trimmed = origin?.trim();
  const base = trimmed ? trimmed.replace(/\/+$/, "") : DEFAULT_ALTAR_VAULT_URL;
  return `${base}${ALTAR_TEAM_INVITE_PATH}`;
}

const successSchema = z.object({
  ok: z.literal(true),
  outcome: z.string().optional(),
  status: z.string().optional(),
  delivered: z.boolean().optional(),
  reused: z.boolean().optional(),
  reason: z.string().optional(),
});

const failureSchema = z.object({
  ok: z.literal(false),
  error: z.string().optional(),
  reason: z.string().optional(),
  code: z.string().optional(),
  outcome: z.string().optional(),
  status: z.string().optional(),
});

function includesAlreadyMember(...values: Array<string | undefined>): boolean {
  return values.some(
    (value) =>
      (value ?? "").toLowerCase().includes("already") &&
      (value ?? "").toLowerCase().includes("member"),
  );
}

function includesReuse(...values: Array<string | undefined>): boolean {
  return values.some((value) => {
    const normalized = (value ?? "").toLowerCase();
    return (
      normalized === "reused" ||
      normalized === "resent" ||
      normalized.includes("reuse") ||
      normalized.includes("resend")
    );
  });
}

export function parseTeamInviteResponse(
  payload: unknown,
  httpStatus: number,
): TeamInviteActionState {
  if (httpStatus === 401) return { status: "unauthorized" };
  if (httpStatus === 404) return { status: "unknown_team" };

  const failed = failureSchema.safeParse(payload);
  if (failed.success) {
    const reason =
      failed.data.reason ?? failed.data.code ?? failed.data.outcome;
    const error = failed.data.error ?? failed.data.status;
    if (includesAlreadyMember(reason, error) || httpStatus === 409) {
      return {
        status: "already_member",
        message: error ?? "Already a member of this Team.",
      };
    }
    if (httpStatus === 404 || reason === "unknown_team") {
      return { status: "unknown_team", message: error };
    }
    return {
      status: "invalid",
      message: error ?? "The Team Invite request was rejected.",
    };
  }

  const succeeded = successSchema.safeParse(payload);
  if (!succeeded.success) return { status: "unavailable" };

  const tokens = [
    succeeded.data.outcome,
    succeeded.data.status,
    succeeded.data.reason,
  ];
  if (includesAlreadyMember(...tokens)) {
    return { status: "already_member" };
  }
  if (succeeded.data.delivered === false) {
    return { status: "delivery_failed" };
  }
  if (succeeded.data.reused === true || includesReuse(...tokens)) {
    return { status: "resent" };
  }
  return { status: "sent" };
}
