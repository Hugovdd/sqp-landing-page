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
