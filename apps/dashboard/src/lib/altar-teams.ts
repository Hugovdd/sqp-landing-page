import { z } from "zod";

export const TEAMS_PAGE_SIZE = 50;
export const TEAMS_LIST_LIMIT = 200;
export const MEMBERSHIPS_LIST_LIMIT = 500;
export const PEOPLE_EMAIL_LIMIT = 200;

export const MINTABLE_TEAM_ROLES = ["member", "admin"] as const;
export type MintableTeamRole = (typeof MINTABLE_TEAM_ROLES)[number];
export type TeamRole = MintableTeamRole | "viewer";

export const TEAM_INVITE_STATUSES = ["active", "expired", "claimed"] as const;
export type TeamInviteStatus = (typeof TEAM_INVITE_STATUSES)[number];

export interface TeamsParams {
  page: number;
}

type SearchParams = Record<string, string | string[] | undefined>;

export function parseTeamsParams(searchParams: SearchParams): TeamsParams {
  const raw = searchParams.page;
  const rawPage = Number(Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? ""));
  return {
    page:
      Number.isSafeInteger(rawPage) && rawPage > 0
        ? Math.min(rawPage, 100_000)
        : 1,
  };
}

const nullableString = z.string().nullable();
const epochSeconds = z.number().int().nonnegative();
const nullableEpochSeconds = epochSeconds.nullable();
export const teamRoleSchema = z.enum(["admin", "member", "viewer"]);

export const teamRowSchema = z.object({
  orgId: z.string().min(1),
  name: z.string(),
  quotaBytes: z.number().int().nullable(),
  createdAt: epochSeconds,
  memberCount: z.number().int().nonnegative(),
  inviteCount: z.number().int().nonnegative(),
  identified: z.coerce.number().int().pipe(z.union([z.literal(0), z.literal(1)])),
});

export type Team = z.infer<typeof teamRowSchema>;

export const membershipRowSchema = z.object({
  userId: z.string().min(1),
  orgId: z.string().min(1),
  orgName: z.string(),
  role: teamRoleSchema,
  createdAt: epochSeconds,
});

export type MembershipRow = z.infer<typeof membershipRowSchema>;

export interface Membership extends MembershipRow {
  email: string | null;
  identity: string;
}

export const teamInviteRowSchema = z.object({
  code: z.string().min(1),
  orgId: z.string().min(1),
  orgName: z.string(),
  role: teamRoleSchema,
  intendedEmail: nullableString,
  createdAt: epochSeconds,
  expiresAt: epochSeconds,
  status: z.enum(["sent", "claimed"]),
  claimedAt: nullableEpochSeconds,
  claimedUserId: nullableString,
  totalCount: z.number().int().nonnegative(),
});

export type TeamInviteRow = z.infer<typeof teamInviteRowSchema>;

export interface TeamInvite extends Omit<TeamInviteRow, "totalCount"> {
  displayStatus: TeamInviteStatus;
  claimedEmail: string | null;
  claimedIdentity: string | null;
}

export const identityRowSchema = z.object({
  userId: z.string().min(1),
  email: z.string().min(1),
});

export type IdentityRow = z.infer<typeof identityRowSchema>;

export function toTeam(input: unknown): Team {
  return teamRowSchema.parse(input);
}

export function membershipIdentity(
  userId: string,
  emails: ReadonlyMap<string, string>,
): { email: string | null; identity: string } {
  const email = emails.get(userId) ?? null;
  return { email, identity: email ?? userId };
}

export function toMembership(
  input: unknown,
  emails: ReadonlyMap<string, string>,
): Membership {
  const row = membershipRowSchema.parse(input);
  return { ...row, ...membershipIdentity(row.userId, emails) };
}

export function inviteDisplayStatus(
  row: Pick<TeamInviteRow, "status" | "expiresAt">,
  nowSeconds: number,
): TeamInviteStatus {
  if (row.status === "claimed") return "claimed";
  return row.expiresAt <= nowSeconds ? "expired" : "active";
}

export function toTeamInvite(
  input: unknown,
  emails: ReadonlyMap<string, string>,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): TeamInvite {
  const row = teamInviteRowSchema.parse(input);
  const claimedEmail = row.claimedUserId
    ? (emails.get(row.claimedUserId) ?? null)
    : null;
  const { totalCount: _totalCount, ...invite } = row;
  return {
    ...invite,
    displayStatus: inviteDisplayStatus(row, nowSeconds),
    claimedEmail,
    claimedIdentity: row.claimedUserId
      ? (claimedEmail ?? row.claimedUserId)
      : null,
  };
}

export function buildIdentityMap(rows: unknown[]): Map<string, string> {
  const emails = new Map<string, string>();
  for (const row of rows) {
    const parsed = identityRowSchema.safeParse(row);
    if (parsed.success && !emails.has(parsed.data.userId)) {
      emails.set(parsed.data.userId, parsed.data.email);
    }
  }
  return emails;
}

export const TEAM_INVITE_STATUS_LABELS: Record<TeamInviteStatus, string> = {
  active: "Active",
  expired: "Expired",
  claimed: "Claimed",
};

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

export const TEAM_ROLE_RANK: Record<TeamRole, number> = {
  admin: 3,
  member: 2,
  viewer: 1,
};

/** True when a known membership already satisfies the invite, so no new code is needed. */
export function alreadyHoldsRole(
  existing: TeamRole,
  requested: MintableTeamRole,
): boolean {
  return TEAM_ROLE_RANK[existing] >= TEAM_ROLE_RANK[requested];
}
