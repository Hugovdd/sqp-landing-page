import { z } from "zod";

export const PEOPLE_PAGE_SIZE = 50;

export const LIFECYCLE_STATES = [
  "awaiting_invite",
  "invite_issued",
  "invite_expired",
  "account_joined",
  "active_in_panel",
  "manual_legacy_grant",
] as const;

export type LifecycleState = (typeof LIFECYCLE_STATES)[number];
export type PeopleOrder = "newest" | "oldest";

export const LIFECYCLE_LABELS: Record<LifecycleState, string> = {
  awaiting_invite: "Awaiting invite",
  invite_issued: "Invite issued",
  invite_expired: "Invite expired",
  account_joined: "Account joined",
  active_in_panel: "Active in panel",
  manual_legacy_grant: "Manual/legacy grant",
};

export interface PeopleParams {
  search: string;
  states: LifecycleState[];
  order: PeopleOrder;
  page: number;
  selectedEmail: string | null;
}

type SearchParams = Record<string, string | string[] | undefined>;

function firstSearchParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export function parsePeopleParams(searchParams: SearchParams): PeopleParams {
  const requestedStates = Array.isArray(searchParams.state)
    ? searchParams.state
    : firstSearchParam(searchParams.state).split(",");
  const states = LIFECYCLE_STATES.filter((state) =>
    requestedStates.includes(state),
  );
  const rawPage = Number(firstSearchParam(searchParams.page));
  const selectedEmail = firstSearchParam(searchParams.person)
    .trim()
    .toLowerCase();

  return {
    search: firstSearchParam(searchParams.search).trim().slice(0, 254),
    states,
    order:
      firstSearchParam(searchParams.order) === "oldest" ? "oldest" : "newest",
    page:
      Number.isSafeInteger(rawPage) && rawPage > 0
        ? Math.min(rawPage, 100_000)
        : 1,
    selectedEmail: selectedEmail || null,
  };
}

const nullableString = z.string().nullable();
const nullableTimestamp = z.number().int().nonnegative().nullable();

export const peopleListRowSchema = z.object({
  email: z.string().email(),
  createdAt: z.number().int().nonnegative(),
  waitlistStatus: z.enum(["pending", "invited", "joined"]),
  firstSignedInAt: nullableTimestamp,
  inviteCount: z.number().int().nonnegative(),
  claimedCount: z.number().int().nonnegative(),
  latestInviteCode: nullableString,
  latestInviteStatus: z.enum(["sent", "claimed"]).nullable(),
  latestInviteCreatedAt: nullableTimestamp,
  latestInviteExpiresAt: nullableTimestamp,
  latestClaimedAt: nullableTimestamp,
  latestClaimedEmail: nullableString,
  latestClaimedUserId: nullableString,
  totalCount: z.number().int().nonnegative(),
});

export type PeopleListRow = z.infer<typeof peopleListRowSchema>;

interface LifecycleRule {
  state: LifecycleState;
  sql: string;
  matches: (row: PeopleListRow, now: number) => boolean;
}

/** Ordered lifecycle precedence shared by SQL filtering and view-model derivation. */
export const LIFECYCLE_RULES: readonly LifecycleRule[] = [
  {
    state: "active_in_panel",
    sql: "firstSignedInAt IS NOT NULL",
    matches: (row) => row.firstSignedInAt !== null,
  },
  {
    state: "account_joined",
    sql: "claimedCount > 0 OR waitlistStatus = 'joined'",
    matches: (row) => row.claimedCount > 0 || row.waitlistStatus === "joined",
  },
  {
    state: "manual_legacy_grant",
    sql: "waitlistStatus = 'invited'",
    matches: (row) => row.waitlistStatus === "invited",
  },
  {
    state: "awaiting_invite",
    sql: "inviteCount = 0",
    matches: (row) => row.inviteCount === 0,
  },
  {
    state: "invite_expired",
    sql: "latestInviteExpiresAt <= unixepoch('subsec') * 1000",
    matches: (row, now) =>
      row.latestInviteExpiresAt !== null && row.latestInviteExpiresAt <= now,
  },
  {
    state: "invite_issued",
    sql: "1 = 1",
    matches: () => true,
  },
];

export function lifecycleCaseSql(): string {
  return `CASE ${LIFECYCLE_RULES.map(
    (rule) => `WHEN ${rule.sql} THEN '${rule.state}'`,
  ).join(" ")} END`;
}

function deriveLifecycleState(row: PeopleListRow, now: number): LifecycleState {
  const match = LIFECYCLE_RULES.find((rule) => rule.matches(row, now));
  if (!match) throw new Error("Lifecycle rules must include a fallback.");
  return match.state;
}

interface LifecycleBase {
  email: string;
  createdAt: number;
  firstSignedInAt: number | null;
  inviteCount: number;
  latestInviteCode: string | null;
  latestInviteCreatedAt: number | null;
  latestInviteExpiresAt: number | null;
  claimedEmail: string | null;
  claimedUserId: string | null;
  identityDiverged: boolean;
}

export type PersonLifecycle = LifecycleBase &
  (
    | { state: "awaiting_invite" }
    | { state: "invite_issued" }
    | { state: "invite_expired" }
    | { state: "account_joined"; claimedAt: number | null }
    | { state: "active_in_panel"; claimedAt: number | null }
    | { state: "manual_legacy_grant" }
  );

/** Central lifecycle derivation. React consumes this discriminated view model, never raw D1 rows. */
export function toPersonLifecycle(
  input: unknown,
  now: number = Date.now(),
): PersonLifecycle {
  const row = peopleListRowSchema.parse(input);
  const claimedEmail =
    row.latestClaimedEmail ??
    (row.waitlistStatus === "joined" ? row.email : null);
  const base: LifecycleBase = {
    email: row.email,
    createdAt: row.createdAt,
    firstSignedInAt: row.firstSignedInAt,
    inviteCount: row.inviteCount,
    latestInviteCode: row.latestInviteCode,
    latestInviteCreatedAt: row.latestInviteCreatedAt,
    latestInviteExpiresAt: row.latestInviteExpiresAt,
    claimedEmail,
    claimedUserId: row.latestClaimedUserId,
    identityDiverged: claimedEmail !== null && claimedEmail !== row.email,
  };
  const state = deriveLifecycleState(row, now);
  return state === "account_joined" || state === "active_in_panel"
    ? { ...base, state, claimedAt: row.latestClaimedAt }
    : { ...base, state };
}

export const inviteHistoryRowSchema = z.object({
  waitlistEmail: z.string().email(),
  waitlistCreatedAt: z.number().int().nonnegative(),
  waitlistStatus: z.enum(["pending", "invited", "joined"]),
  waitlistFirstSignedInAt: nullableTimestamp,
  code: nullableString,
  intendedEmail: nullableString,
  inviteCreatedAt: nullableTimestamp,
  expiresAt: nullableTimestamp,
  inviteStatus: z.enum(["sent", "claimed"]).nullable(),
  claimedAt: nullableTimestamp,
  claimedEmail: nullableString,
  claimedUserId: nullableString,
  accountFirstSignedInAt: nullableTimestamp,
});

export interface InviteHistoryItem {
  code: string;
  intendedEmail: string | null;
  createdAt: number;
  expiresAt: number;
  status: "sent" | "claimed";
  claimedAt: number | null;
  claimedEmail: string | null;
  claimedUserId: string | null;
  accountFirstSignedInAt: number | null;
  identityDiverged: boolean;
}

export interface PersonDetail {
  email: string;
  createdAt: number;
  waitlistStatus: "pending" | "invited" | "joined";
  firstSignedInAt: number | null;
  invites: InviteHistoryItem[];
}

export function toPersonDetail(rows: unknown[]): PersonDetail | null {
  if (rows.length === 0) return null;
  const parsed = rows.map((row) => inviteHistoryRowSchema.parse(row));
  const first = parsed[0];
  const firstSignedInAt = parsed.reduce<number | null>((earliest, row) => {
    for (const timestamp of [
      row.waitlistFirstSignedInAt,
      row.accountFirstSignedInAt,
    ]) {
      if (timestamp !== null && (earliest === null || timestamp < earliest)) {
        earliest = timestamp;
      }
    }
    return earliest;
  }, null);
  return {
    email: first.waitlistEmail,
    createdAt: first.waitlistCreatedAt,
    waitlistStatus: first.waitlistStatus,
    firstSignedInAt,
    invites: parsed.flatMap((row) =>
      row.code === null ||
      row.inviteCreatedAt === null ||
      row.expiresAt === null ||
      row.inviteStatus === null
        ? []
        : [
            {
              code: row.code,
              intendedEmail: row.intendedEmail,
              createdAt: row.inviteCreatedAt,
              expiresAt: row.expiresAt,
              status: row.inviteStatus,
              claimedAt: row.claimedAt,
              claimedEmail: row.claimedEmail,
              claimedUserId: row.claimedUserId,
              accountFirstSignedInAt: row.accountFirstSignedInAt,
              identityDiverged:
                row.claimedEmail !== null &&
                row.intendedEmail !== null &&
                row.claimedEmail !== row.intendedEmail,
            },
          ],
    ),
  };
}
