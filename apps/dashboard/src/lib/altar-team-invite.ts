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
const mintableRoleSchema = z.enum(MINTABLE_TEAM_ROLES);

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
  const role =
    input.role === undefined || input.role === "" ? "member" : input.role;

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
  const parsedRole = mintableRoleSchema.safeParse(role);
  if (!parsedRole.success) {
    return {
      ok: false,
      status: "invalid",
      message: "Role must be member or admin.",
    };
  }
  return { ok: true, email, orgId, role: parsedRole.data };
}

export function altarTeamInviteUrl(origin: string | undefined): string {
  const trimmed = origin?.trim();
  const base = trimmed ? trimmed.replace(/\/+$/, "") : DEFAULT_ALTAR_VAULT_URL;
  return `${base}${ALTAR_TEAM_INVITE_PATH}`;
}

const deliveredSchema = z.object({
  ok: z.literal(true),
  outcome: z.enum(["minted", "reused"]),
});

const deliveryFailedSchema = z.object({
  ok: z.literal(false),
  outcome: z.literal("delivery_failed"),
});

const rejectedSchema = z.object({
  ok: z.literal(false),
  error: z.string().optional(),
});

/** Map the vault-signing Worker contract. already_member is decided in dashboard D1, not here. */
export function parseTeamInviteResponse(
  payload: unknown,
  httpStatus: number,
): TeamInviteActionState {
  if (httpStatus === 401) return { status: "unauthorized" };
  if (httpStatus === 404) return { status: "unknown_team" };

  const delivered = deliveredSchema.safeParse(payload);
  if (delivered.success) {
    return {
      status: delivered.data.outcome === "reused" ? "resent" : "sent",
    };
  }

  if (deliveryFailedSchema.safeParse(payload).success) {
    return { status: "delivery_failed" };
  }

  const rejected = rejectedSchema.safeParse(payload);
  if (httpStatus === 400) {
    return {
      status: "invalid",
      message: rejected.success ? rejected.data.error : undefined,
    };
  }
  return { status: "unavailable" };
}
