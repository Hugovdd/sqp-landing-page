import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";

import {
  type AltarEmailPreviewsResult,
  altarEmailPreviewsUrl,
  parseAltarEmailPreviews,
} from "./altar-email";
import {
  lifecycleCaseSql,
  PEOPLE_PAGE_SIZE,
  type PeopleParams,
  type PersonDetail,
  type PersonLifecycle,
  toPersonDetail,
  toPersonLifecycle,
} from "./altar-people";
import {
  altarTeamInviteUrl,
  parseTeamInviteInput,
  parseTeamInviteResponse,
  type TeamInviteActionState,
} from "./altar-team-invite";
import {
  buildIdentityMap,
  type Membership,
  MEMBERSHIPS_LIST_LIMIT,
  PEOPLE_EMAIL_LIMIT,
  type Team,
  type TeamInvite,
  TEAMS_LIST_LIMIT,
  TEAMS_PAGE_SIZE,
  type TeamsParams,
  toMembership,
  toTeam,
  toTeamInvite,
} from "./altar-teams";

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export type AltarAdminErrorKind =
  | "missing_binding"
  | "query_failed"
  | "malformed_data";

export class AltarAdminError extends Error {
  constructor(
    public readonly kind: AltarAdminErrorKind,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "AltarAdminError";
  }
}

export interface PeoplePageData {
  people: PersonLifecycle[];
  total: number;
  page: number;
  pageCount: number;
  detail: PersonDetail | null;
}

export interface TeamsPageData {
  teams: Team[];
  memberships: Membership[];
  invites: TeamInvite[];
  inviteTotal: number;
  invitePage: number;
  invitePageCount: number;
  peopleEmails: string[];
  mutation: { status: "ready" } | { status: "missing_config" };
}

function altarWaitlistDb(): D1Database {
  const env = getCloudflareContext().env as unknown as {
    ALTAR_WAITLIST?: D1Database;
  };
  if (!env.ALTAR_WAITLIST) {
    const error = new AltarAdminError(
      "missing_binding",
      "ALTAR_WAITLIST D1 binding is not configured.",
    );
    console.error(error.message);
    throw error;
  }
  return env.ALTAR_WAITLIST;
}

function optionalAltarWaitlistDb(): D1Database | null {
  const env = getCloudflareContext().env as unknown as {
    ALTAR_WAITLIST?: D1Database;
  };
  return env.ALTAR_WAITLIST ?? null;
}

function altarVaultCatalogDb(): D1Database {
  const env = getCloudflareContext().env as unknown as {
    ALTAR_VAULT_CATALOG?: D1Database;
  };
  if (!env.ALTAR_VAULT_CATALOG) {
    const error = new AltarAdminError(
      "missing_binding",
      "ALTAR_VAULT_CATALOG D1 binding is not configured.",
    );
    console.error(error.message);
    throw error;
  }
  return env.ALTAR_VAULT_CATALOG;
}

function listQuery(params: PeopleParams): { sql: string; binds: unknown[] } {
  const where: string[] = [];
  const binds: unknown[] = [];
  if (params.search) {
    const needle = `%${params.search.toLowerCase().replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
    where.push(`(
      lower(email) LIKE ? ESCAPE '\\'
      OR EXISTS (
        SELECT 1 FROM invite_codes search_invite
         WHERE search_invite.intended_email = lifecycle.email
           AND (
             lower(COALESCE(search_invite.claimed_email, '')) LIKE ? ESCAPE '\\'
             OR lower(COALESCE(search_invite.claimed_user_id, '')) LIKE ? ESCAPE '\\'
           )
      )
    )`);
    binds.push(needle, needle, needle);
  }
  if (params.states.length) {
    where.push(
      `lifecycle_state IN (${params.states.map(() => "?").join(", ")})`,
    );
    binds.push(...params.states);
  }

  const direction = params.order === "oldest" ? "ASC" : "DESC";
  binds.push(
    (params.page - 1) * PEOPLE_PAGE_SIZE,
    PEOPLE_PAGE_SIZE,
    PEOPLE_PAGE_SIZE,
    PEOPLE_PAGE_SIZE,
  );

  return {
    sql: `WITH invite_summary AS (
      SELECT intended_email,
             COUNT(*) AS inviteCount,
             SUM(CASE WHEN status = 'claimed' THEN 1 ELSE 0 END) AS claimedCount
        FROM invite_codes
       GROUP BY intended_email
    ), ranked_invites AS (
      SELECT i.*,
             ROW_NUMBER() OVER (
               PARTITION BY intended_email ORDER BY created_at DESC, code DESC
             ) AS row_number
        FROM invite_codes i
    ), ranked_claims AS (
      SELECT i.*,
             account_waitlist.first_signed_in_at AS account_first_signed_in_at,
             ROW_NUMBER() OVER (
               PARTITION BY intended_email
               ORDER BY (account_waitlist.first_signed_in_at IS NOT NULL) DESC,
                        account_waitlist.first_signed_in_at DESC,
                        i.claimed_at DESC, i.created_at DESC, i.code DESC
             ) AS row_number
        FROM invite_codes i
        LEFT JOIN waitlist account_waitlist
          ON account_waitlist.email = i.claimed_email
       WHERE i.status = 'claimed'
    ), facts AS (
      SELECT w.email AS email,
             w.created_at AS createdAt,
             w.status AS waitlistStatus,
             COALESCE(c.account_first_signed_in_at, w.first_signed_in_at) AS firstSignedInAt,
             COALESCE(s.inviteCount, 0) AS inviteCount,
             COALESCE(s.claimedCount, 0) AS claimedCount,
             i.code AS latestInviteCode,
             i.status AS latestInviteStatus,
             i.created_at AS latestInviteCreatedAt,
             i.expires_at AS latestInviteExpiresAt,
             c.claimed_at AS latestClaimedAt,
             c.claimed_email AS latestClaimedEmail,
             c.claimed_user_id AS latestClaimedUserId
        FROM waitlist w
        LEFT JOIN invite_summary s ON s.intended_email = w.email
        LEFT JOIN ranked_invites i
          ON i.intended_email = w.email AND i.row_number = 1
        LEFT JOIN ranked_claims c
          ON c.intended_email = w.email AND c.row_number = 1
    ), lifecycle AS (
      SELECT facts.*, ${lifecycleCaseSql()} AS lifecycle_state
        FROM facts
    ), filtered AS (
      SELECT * FROM lifecycle
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ), totals AS (
      SELECT COUNT(*) AS totalCount FROM filtered
    ), pagination AS (
      SELECT CASE
               WHEN totalCount = 0 THEN 0
               ELSE MIN(?, CAST((totalCount - 1) / ? AS INTEGER) * ?)
             END AS actualOffset
        FROM totals
    ), page_rows AS (
      SELECT * FROM filtered
       ORDER BY createdAt ${direction}, email ${direction}
       LIMIT ? OFFSET (SELECT actualOffset FROM pagination)
    )
    SELECT p.email, p.createdAt, p.waitlistStatus, p.firstSignedInAt,
           p.inviteCount, p.claimedCount, p.latestInviteCode,
           p.latestInviteStatus, p.latestInviteCreatedAt,
           p.latestInviteExpiresAt, p.latestClaimedAt,
           p.latestClaimedEmail, p.latestClaimedUserId, t.totalCount,
           pagination.actualOffset
      FROM totals t
      CROSS JOIN pagination
      LEFT JOIN page_rows p ON 1 = 1
     ORDER BY p.createdAt ${direction}, p.email ${direction}`,
    binds,
  };
}

const DETAIL_SQL = `SELECT w.email AS waitlistEmail,
       w.created_at AS waitlistCreatedAt,
       w.status AS waitlistStatus,
       w.first_signed_in_at AS waitlistFirstSignedInAt,
       i.code AS code,
       i.intended_email AS intendedEmail,
       i.created_at AS inviteCreatedAt,
       i.expires_at AS expiresAt,
       i.status AS inviteStatus,
       i.claimed_at AS claimedAt,
       i.claimed_email AS claimedEmail,
       i.claimed_user_id AS claimedUserId,
       account_waitlist.first_signed_in_at AS accountFirstSignedInAt
  FROM waitlist w
  LEFT JOIN invite_codes i
    ON i.intended_email = w.email
  LEFT JOIN waitlist account_waitlist
    ON account_waitlist.email = i.claimed_email
 WHERE w.email = ?
 ORDER BY i.created_at DESC, i.code DESC`;

/** The only server-side Altar admin integration seam. All dashboard access is read-only and bound. */
export async function getAltarPeoplePage(
  params: PeopleParams,
  database: D1Database = altarWaitlistDb(),
): Promise<PeoplePageData> {
  try {
    const query = listQuery(params);
    const [list, detailRows] = await Promise.all([
      database
        .prepare(query.sql)
        .bind(...query.binds)
        .all(),
      params.selectedEmail
        ? database.prepare(DETAIL_SQL).bind(params.selectedEmail).all()
        : Promise.resolve({ results: [] }),
    ]);

    const firstListRow = list.results[0] as
      | { totalCount?: unknown }
      | undefined;
    const total = z
      .number()
      .int()
      .nonnegative()
      .parse(firstListRow?.totalCount);
    const actualOffset = z
      .number()
      .int()
      .nonnegative()
      .parse(
        (firstListRow as { actualOffset?: unknown } | undefined)?.actualOffset,
      );
    const people = list.results
      .filter(
        (row): row is Record<string, unknown> & { email: string } =>
          typeof (row as { email?: unknown }).email === "string",
      )
      .map((row) => toPersonLifecycle(row));
    const detail = params.selectedEmail
      ? toPersonDetail(detailRows.results)
      : null;
    return {
      people,
      total,
      page: total === 0 ? 1 : Math.floor(actualOffset / PEOPLE_PAGE_SIZE) + 1,
      pageCount: Math.max(1, Math.ceil(total / PEOPLE_PAGE_SIZE)),
      detail,
    };
  } catch (error) {
    if (error instanceof AltarAdminError) throw error;
    const kind =
      error instanceof z.ZodError ? "malformed_data" : "query_failed";
    const wrapped = new AltarAdminError(
      kind,
      kind === "malformed_data"
        ? "Altar lifecycle data is malformed."
        : "Altar lifecycle data could not be queried.",
      { cause: error },
    );
    console.error(wrapped.message, error);
    throw wrapped;
  }
}

export const altarAdminSqlForTest = { listQuery, detail: DETAIL_SQL };

export interface AltarEmailPreviewEnv {
  ALTAR_WAITLIST_URL?: string;
  ALTAR_ADMIN_TOKEN?: string;
}

/** Live email HTML/text come from the waitlist Worker. The dashboard never stores a second copy. */
export async function getAltarEmailPreviews(
  options: {
    env?: AltarEmailPreviewEnv;
    fetch?: typeof globalThis.fetch;
  } = {},
): Promise<AltarEmailPreviewsResult> {
  const env =
    options.env ??
    (getCloudflareContext().env as unknown as AltarEmailPreviewEnv);
  const token = env.ALTAR_ADMIN_TOKEN?.trim();
  if (!token) {
    console.error("ALTAR_ADMIN_TOKEN is not configured.");
    return { status: "missing_config" };
  }

  const url = altarEmailPreviewsUrl(env.ALTAR_WAITLIST_URL);
  const fetchImpl = options.fetch ?? globalThis.fetch;

  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
  } catch (error) {
    console.error("Altar email preview request failed.", error);
    return { status: "unavailable" };
  }

  if (response.status === 401) return { status: "unauthorized" };
  if (!response.ok) {
    console.error(
      `Altar email preview endpoint returned HTTP ${response.status}.`,
    );
    return { status: "unavailable" };
  }

  try {
    return parseAltarEmailPreviews(await response.json());
  } catch (error) {
    console.error("Altar email preview response was not JSON.", error);
    return { status: "malformed" };
  }
}

export interface AltarTeamInviteEnv {
  ALTAR_VAULT_URL?: string;
  ALTAR_ADMIN_TOKEN?: string;
}

const TEAMS_SQL = `SELECT o.orgId AS orgId,
       o.name AS name,
       o.quotaBytes AS quotaBytes,
       o.createdAt AS createdAt,
       COUNT(DISTINCT m.userId) AS memberCount,
       COUNT(DISTINCT i.code) AS inviteCount
  FROM orgs o
  LEFT JOIN memberships m ON m.orgId = o.orgId
  LEFT JOIN org_invite_codes i ON i.orgId = o.orgId
 GROUP BY o.orgId, o.name, o.quotaBytes, o.createdAt
 ORDER BY o.name ASC, o.orgId ASC
 LIMIT ?`;

const MEMBERSHIPS_SQL = `SELECT m.userId AS userId,
       m.orgId AS orgId,
       o.name AS orgName,
       m.role AS role,
       m.createdAt AS createdAt
  FROM memberships m
  JOIN orgs o ON o.orgId = m.orgId
 ORDER BY o.name ASC, m.createdAt DESC, m.userId ASC
 LIMIT ?`;

function inviteListQuery(params: TeamsParams): {
  sql: string;
  binds: unknown[];
} {
  return {
    sql: `WITH invites AS (
      SELECT i.code AS code,
             i.orgId AS orgId,
             o.name AS orgName,
             i.role AS role,
             i.intendedEmail AS intendedEmail,
             i.createdAt AS createdAt,
             i.expiresAt AS expiresAt,
             i.status AS status,
             i.claimedAt AS claimedAt,
             i.claimedUserId AS claimedUserId
        FROM org_invite_codes i
        JOIN orgs o ON o.orgId = i.orgId
    ), totals AS (
      SELECT COUNT(*) AS totalCount FROM invites
    ), pagination AS (
      SELECT CASE
               WHEN totalCount = 0 THEN 0
               ELSE MIN(?, CAST((totalCount - 1) / ? AS INTEGER) * ?)
             END AS actualOffset
        FROM totals
    ), page_rows AS (
      SELECT * FROM invites
       ORDER BY createdAt DESC, code DESC
       LIMIT ? OFFSET (SELECT actualOffset FROM pagination)
    )
    SELECT p.code, p.orgId, p.orgName, p.role, p.intendedEmail,
           p.createdAt, p.expiresAt, p.status, p.claimedAt, p.claimedUserId,
           t.totalCount, pagination.actualOffset
      FROM totals t
      CROSS JOIN pagination
      LEFT JOIN page_rows p ON 1 = 1
     ORDER BY p.createdAt DESC, p.code DESC`,
    binds: [
      (params.page - 1) * TEAMS_PAGE_SIZE,
      TEAMS_PAGE_SIZE,
      TEAMS_PAGE_SIZE,
      TEAMS_PAGE_SIZE,
    ],
  };
}

const IDENTITY_SQL = `WITH ranked AS (
  SELECT claimed_user_id AS userId,
         claimed_email AS email,
         ROW_NUMBER() OVER (
           PARTITION BY claimed_user_id
           ORDER BY claimed_at DESC, code DESC
         ) AS row_number
    FROM invite_codes
   WHERE status = 'claimed'
     AND claimed_user_id IS NOT NULL
     AND claimed_user_id != ''
     AND claimed_email IS NOT NULL
     AND claimed_email != ''
)
SELECT userId, email FROM ranked WHERE row_number = 1`;

const PEOPLE_EMAILS_SQL = `SELECT email FROM waitlist ORDER BY email LIMIT ?`;

export const altarTeamsSqlForTest = {
  teams: TEAMS_SQL,
  memberships: MEMBERSHIPS_SQL,
  invites: inviteListQuery,
  identities: IDENTITY_SQL,
  peopleEmails: PEOPLE_EMAILS_SQL,
};

function mutationConfig(
  env: AltarTeamInviteEnv | undefined,
): TeamsPageData["mutation"] {
  const resolved =
    env ?? (getCloudflareContext().env as unknown as AltarTeamInviteEnv);
  return resolved.ALTAR_ADMIN_TOKEN?.trim()
    ? { status: "ready" }
    : { status: "missing_config" };
}

/** Bounded Team, Membership, and Team Invite read models. Identity emails come from one waitlist map. */
export async function getAltarTeamsPage(
  params: TeamsParams,
  options: {
    vault?: D1Database;
    waitlist?: D1Database | null;
    env?: AltarTeamInviteEnv;
    nowSeconds?: number;
  } = {},
): Promise<TeamsPageData> {
  const vault = options.vault ?? altarVaultCatalogDb();
  const waitlist =
    options.waitlist === undefined
      ? optionalAltarWaitlistDb()
      : options.waitlist;
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);

  try {
    const inviteQuery = inviteListQuery(params);
    const [teamRows, membershipRows, inviteRows, identityRows, peopleRows] =
      await Promise.all([
        vault.prepare(TEAMS_SQL).bind(TEAMS_LIST_LIMIT).all(),
        vault.prepare(MEMBERSHIPS_SQL).bind(MEMBERSHIPS_LIST_LIMIT).all(),
        vault
          .prepare(inviteQuery.sql)
          .bind(...inviteQuery.binds)
          .all(),
        waitlist
          ? waitlist.prepare(IDENTITY_SQL).all()
          : Promise.resolve({ results: [] }),
        waitlist
          ? waitlist.prepare(PEOPLE_EMAILS_SQL).bind(PEOPLE_EMAIL_LIMIT).all()
          : Promise.resolve({ results: [] }),
      ]);

    const emails = buildIdentityMap(identityRows.results);
    const totalsRow = z
      .object({
        totalCount: z.number().int().nonnegative(),
        actualOffset: z.number().int().nonnegative(),
      })
      .parse(inviteRows.results[0]);
    const invites = inviteRows.results.flatMap((row) => {
      if (!row || typeof row !== "object" || !("code" in row)) return [];
      if (typeof row.code !== "string") return [];
      return [toTeamInvite(row, emails, nowSeconds)];
    });
    const peopleEmailRow = z.object({ email: z.string().min(1) });

    return {
      teams: teamRows.results.map((row) => toTeam(row)),
      memberships: membershipRows.results.map((row) =>
        toMembership(row, emails),
      ),
      invites,
      inviteTotal: totalsRow.totalCount,
      invitePage:
        totalsRow.totalCount === 0
          ? 1
          : Math.floor(totalsRow.actualOffset / TEAMS_PAGE_SIZE) + 1,
      invitePageCount: Math.max(
        1,
        Math.ceil(totalsRow.totalCount / TEAMS_PAGE_SIZE),
      ),
      peopleEmails: peopleRows.results.flatMap((row) => {
        const parsed = peopleEmailRow.safeParse(row);
        return parsed.success ? [parsed.data.email] : [];
      }),
      mutation: mutationConfig(options.env),
    };
  } catch (error) {
    if (error instanceof AltarAdminError) throw error;
    const kind =
      error instanceof z.ZodError ? "malformed_data" : "query_failed";
    const wrapped = new AltarAdminError(
      kind,
      kind === "malformed_data"
        ? "Altar Teams data is malformed."
        : "Altar Teams data could not be queried.",
      { cause: error },
    );
    console.error(wrapped.message, error);
    throw wrapped;
  }
}

/** Mint or reuse a Team Invite through the vault-signing Worker. Never writes Membership. */
export async function sendAltarTeamInvite(
  input: { email?: unknown; orgId?: unknown; role?: unknown },
  options: {
    env?: AltarTeamInviteEnv;
    fetch?: typeof globalThis.fetch;
  } = {},
): Promise<TeamInviteActionState> {
  const parsed = parseTeamInviteInput(input);
  if (!parsed.ok) return { status: "invalid", message: parsed.message };
  const request = {
    email: parsed.email,
    orgId: parsed.orgId,
    role: parsed.role,
  };

  const env =
    options.env ??
    (getCloudflareContext().env as unknown as AltarTeamInviteEnv);
  const token = env.ALTAR_ADMIN_TOKEN?.trim();
  if (!token) {
    console.error("ALTAR_ADMIN_TOKEN is not configured.");
    return { status: "missing_config", ...request };
  }

  const url = altarTeamInviteUrl(env.ALTAR_VAULT_URL);
  const fetchImpl = options.fetch ?? globalThis.fetch;
  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: "POST",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
  } catch (error) {
    console.error("Altar team invite request failed.", error);
    return { status: "unavailable", ...request };
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch (error) {
    console.error("Altar team invite response was not JSON.", error);
    if (response.status === 401) return { status: "unauthorized", ...request };
    if (response.status === 404) return { status: "unknown_team", ...request };
    return { status: "unavailable", ...request };
  }

  return { ...parseTeamInviteResponse(payload, response.status), ...request };
}
