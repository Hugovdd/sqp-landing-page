import { DatabaseSync, type SQLInputValue } from "node:sqlite";

import { describe, expect, it, vi } from "vitest";

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => ({ env: {} }),
}));

import {
  AltarAdminError,
  altarAdminSqlForTest,
  altarTeamsSqlForTest,
  type D1Database,
  getAltarEmailPreviews,
  getAltarPeoplePage,
  getAltarTeamsPage,
  sendAltarTeamInvite,
} from "./altar-admin";
import { DEFAULT_ALTAR_WAITLIST_URL } from "./altar-email";
import {
  LIFECYCLE_STATES,
  type PeopleParams,
  toPersonLifecycle,
} from "./altar-people";
import { DEFAULT_ALTAR_VAULT_URL } from "./altar-team-invite";

function params(overrides: Partial<PeopleParams> = {}): PeopleParams {
  return {
    search: "",
    states: [],
    order: "newest",
    page: 1,
    selectedEmail: null,
    ...overrides,
  };
}

function validRow(overrides: Record<string, unknown> = {}) {
  return {
    email: "person@example.com",
    createdAt: 100,
    waitlistStatus: "pending",
    firstSignedInAt: null,
    inviteCount: 0,
    claimedCount: 0,
    latestInviteCode: null,
    latestInviteStatus: null,
    latestInviteCreatedAt: null,
    latestInviteExpiresAt: null,
    latestClaimedAt: null,
    latestClaimedEmail: null,
    latestClaimedUserId: null,
    totalCount: 1,
    actualOffset: 0,
    ...overrides,
  };
}

function fakeDb(results: unknown[][], failure?: Error) {
  const calls: Array<{ sql: string; binds: unknown[] }> = [];
  let index = 0;
  const database = {
    prepare(sql: string) {
      const call = { sql, binds: [] as unknown[] };
      calls.push(call);
      return {
        bind(...binds: unknown[]) {
          call.binds = binds;
          return this;
        },
        async all() {
          if (failure) throw failure;
          return { results: results[index++] ?? [] };
        },
      };
    },
  } as D1Database;
  return { database, calls };
}

function sqliteDb(database: DatabaseSync): D1Database {
  return {
    prepare(sql: string) {
      let values: unknown[] = [];
      return {
        bind(...binds: unknown[]) {
          values = binds;
          return this;
        },
        async all<T = Record<string, unknown>>() {
          return {
            results: database
              .prepare(sql)
              .all(...(values as SQLInputValue[])) as T[],
          };
        },
      };
    },
  };
}

function lifecycleDatabase(): DatabaseSync {
  const database = new DatabaseSync(":memory:");
  database.exec(`
    CREATE TABLE waitlist (
      email TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      status TEXT NOT NULL,
      first_signed_in_at INTEGER
    );
    CREATE TABLE invite_codes (
      code TEXT PRIMARY KEY,
      intended_email TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      status TEXT NOT NULL,
      claimed_at INTEGER,
      claimed_email TEXT,
      claimed_user_id TEXT
    );
    INSERT INTO waitlist VALUES
      ('awaiting@example.com', 10, 'pending', NULL),
      ('issued@example.com', 20, 'pending', NULL),
      ('expired@example.com', 30, 'pending', NULL),
      ('joined@example.com', 40, 'joined', NULL),
      ('intended@example.com', 50, 'pending', NULL),
      ('active-account@example.com', 60, 'joined', 700),
      ('legacy@example.com', 70, 'invited', NULL);
    INSERT INTO invite_codes VALUES
      ('ALTAR-ISSU-ED01', 'issued@example.com', 100, 4102444800000, 'sent', NULL, NULL, NULL),
      ('ALTAR-EXPI-RED1', 'expired@example.com', 110, 1, 'sent', NULL, NULL, NULL),
      ('ALTAR-OLDI-NV01', 'intended@example.com', 120, 4102444800000, 'claimed', 500, 'older-account@example.com', 'user_older'),
      ('ALTAR-CLAI-MED1', 'intended@example.com', 130, 4102444800000, 'claimed', 600, 'active-account@example.com', 'user_active');
  `);
  return database;
}

describe("getAltarPeoplePage", () => {
  it("fails explicitly when the ALTAR_WAITLIST binding is missing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(getAltarPeoplePage(params())).rejects.toMatchObject({
      kind: "missing_binding",
    } satisfies Partial<AltarAdminError>);
  });

  it("binds hostile search, lifecycle filters, limit, and offset as data", async () => {
    const hostile = `%' OR 1=1; DROP TABLE waitlist; --`;
    const { database, calls } = fakeDb([[validRow()]]);
    await getAltarPeoplePage(
      params({
        search: hostile,
        states: ["invite_issued", "active_in_panel"],
        order: "oldest",
        page: 3,
      }),
      database,
    );

    expect(calls).toHaveLength(1);
    expect(calls[0].sql).not.toContain(hostile);
    expect(calls[0].sql).toContain("ORDER BY createdAt ASC, email ASC");
    expect(calls[0].binds).toEqual([
      expect.stringContaining("drop table waitlist"),
      expect.stringContaining("drop table waitlist"),
      expect.stringContaining("drop table waitlist"),
      "invite_issued",
      "active_in_panel",
      100,
      50,
      50,
      50,
    ]);
  });

  it("runs a full-history detail query only for a selected row", async () => {
    const detailRow = {
      waitlistEmail: "person@example.com",
      waitlistCreatedAt: 100,
      waitlistStatus: "pending",
      waitlistFirstSignedInAt: null,
      code: null,
      intendedEmail: null,
      inviteCreatedAt: null,
      expiresAt: null,
      inviteStatus: null,
      claimedAt: null,
      claimedEmail: null,
      claimedUserId: null,
      accountFirstSignedInAt: null,
    };
    const { database, calls } = fakeDb([[validRow()], [detailRow]]);
    const data = await getAltarPeoplePage(
      params({ selectedEmail: "person@example.com" }),
      database,
    );
    expect(calls).toHaveLength(2);
    expect(calls[1].binds).toEqual(["person@example.com"]);
    expect(data.detail).toMatchObject({
      email: "person@example.com",
      invites: [],
    });
  });

  it("executes the aggregate SQL across every lifecycle branch, multiple invites, and divergent identities", async () => {
    const database = lifecycleDatabase();
    const query = altarAdminSqlForTest.listQuery(params({ order: "oldest" }));
    const rows = database
      .prepare(query.sql)
      .all(...(query.binds as SQLInputValue[])) as Record<string, unknown>[];
    const people = rows
      .filter((row) => row.email !== null)
      .map((row) => toPersonLifecycle(row));
    const byEmail = new Map(people.map((person) => [person.email, person]));

    expect(byEmail.get("awaiting@example.com")?.state).toBe("awaiting_invite");
    expect(byEmail.get("issued@example.com")?.state).toBe("invite_issued");
    expect(byEmail.get("expired@example.com")?.state).toBe("invite_expired");
    expect(byEmail.get("joined@example.com")?.state).toBe("account_joined");
    expect(byEmail.get("legacy@example.com")?.state).toBe(
      "manual_legacy_grant",
    );
    expect(byEmail.get("intended@example.com")).toMatchObject({
      state: "active_in_panel",
      inviteCount: 2,
      latestInviteCode: "ALTAR-CLAI-MED1",
      claimedEmail: "active-account@example.com",
      claimedUserId: "user_active",
      identityDiverged: true,
      firstSignedInAt: 700,
    });

    for (const state of LIFECYCLE_STATES) {
      const filteredQuery = altarAdminSqlForTest.listQuery(
        params({ order: "oldest", states: [state] }),
      );
      const filteredEmails = database
        .prepare(filteredQuery.sql)
        .all(...(filteredQuery.binds as SQLInputValue[]))
        .flatMap((row) => (typeof row.email === "string" ? [row.email] : []));
      expect(
        filteredEmails,
        `SQL and TypeScript disagree for ${state}`,
      ).toEqual(
        people
          .filter((person) => person.state === state)
          .map((person) => person.email),
      );
    }

    database.close();
  });

  it("clamps a requested page past the final row to a populated last page", async () => {
    const database = lifecycleDatabase();
    const data = await getAltarPeoplePage(
      params({ page: 99 }),
      sqliteDb(database),
    );
    expect(data).toMatchObject({
      total: 7,
      page: 1,
      pageCount: 1,
    });
    expect(data.people).toHaveLength(7);
    database.close();
  });

  it.each(["older-account@example.com", "user_older"])(
    "searches every claimed identity in invite history: %s",
    async (search) => {
      const database = lifecycleDatabase();
      const data = await getAltarPeoplePage(
        params({ search }),
        sqliteDb(database),
      );
      expect(data.people.map((person) => person.email)).toEqual([
        "intended@example.com",
      ]);
      database.close();
    },
  );

  it("keeps a claimed Account linked to the intended invite lifecycle only", async () => {
    const database = lifecycleDatabase();
    const intended = await getAltarPeoplePage(
      params({ selectedEmail: "intended@example.com" }),
      sqliteDb(database),
    );
    expect(intended.detail).toMatchObject({
      email: "intended@example.com",
      firstSignedInAt: 700,
      invites: [
        {
          code: "ALTAR-CLAI-MED1",
          claimedEmail: "active-account@example.com",
          accountFirstSignedInAt: 700,
        },
        { code: "ALTAR-OLDI-NV01" },
      ],
    });

    const account = await getAltarPeoplePage(
      params({ selectedEmail: "active-account@example.com" }),
      sqliteDb(database),
    );
    expect(account.detail).toMatchObject({
      email: "active-account@example.com",
      invites: [],
    });
    database.close();
  });

  it("distinguishes query failure from malformed row data", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const queryFailure = fakeDb([], new Error("D1 unavailable"));
    await expect(
      getAltarPeoplePage(params(), queryFailure.database),
    ).rejects.toMatchObject({
      kind: "query_failed",
    } satisfies Partial<AltarAdminError>);

    const malformed = fakeDb([[validRow({ inviteCount: "many" })]]);
    await expect(
      getAltarPeoplePage(params(), malformed.database),
    ).rejects.toMatchObject({
      kind: "malformed_data",
    } satisfies Partial<AltarAdminError>);
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const sampleTemplate = {
  id: "waitlist-confirm",
  name: "Waitlist confirmation",
  trigger: "Someone joins the waitlist",
  subject: "You're on the list",
  html: "<p>Welcome</p>",
  text: "Welcome",
};

describe("getAltarEmailPreviews", () => {
  it("returns missing_config when the admin token is unset", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(getAltarEmailPreviews()).resolves.toEqual({
      status: "missing_config",
    });
  });

  it("fetches live previews with no-store and a bearer token", async () => {
    const fetchImpl = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        expect(String(input)).toBe(
          `${DEFAULT_ALTAR_WAITLIST_URL}/admin/email-previews`,
        );
        expect(init?.cache).toBe("no-store");
        expect(init?.headers).toMatchObject({
          Authorization: "Bearer test-admin-token",
          Accept: "application/json",
        });
        return jsonResponse({ ok: true, templates: [sampleTemplate] });
      },
    );

    await expect(
      getAltarEmailPreviews({
        env: { ALTAR_ADMIN_TOKEN: "test-admin-token" },
        fetch: fetchImpl,
      }),
    ).resolves.toEqual({
      status: "ready",
      templates: [{ ok: true, ...sampleTemplate }],
    });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("strips a trailing slash from the configured waitlist origin", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe(
        "https://waitlist.example.test/admin/email-previews",
      );
      return jsonResponse({ ok: true, templates: [sampleTemplate] });
    });

    await getAltarEmailPreviews({
      env: {
        ALTAR_WAITLIST_URL: "https://waitlist.example.test/",
        ALTAR_ADMIN_TOKEN: "test-admin-token",
      },
      fetch: fetchImpl,
    });
  });

  it("keeps a per-template error without blanking the gallery", async () => {
    const failed = {
      id: "invite-follow-up",
      name: "Invite follow-up",
      error: "sample render failed",
    };
    const result = await getAltarEmailPreviews({
      env: { ALTAR_ADMIN_TOKEN: "test-admin-token" },
      fetch: async () =>
        jsonResponse({ ok: true, templates: [sampleTemplate, failed] }),
    });
    expect(result).toEqual({
      status: "ready",
      templates: [
        { ok: true, ...sampleTemplate },
        {
          ok: false,
          id: "invite-follow-up",
          name: "Invite follow-up",
          trigger: "",
          error: "sample render failed",
        },
      ],
    });
  });

  it("returns empty when the worker sends no templates", async () => {
    await expect(
      getAltarEmailPreviews({
        env: { ALTAR_ADMIN_TOKEN: "test-admin-token" },
        fetch: async () => jsonResponse({ ok: true, templates: [] }),
      }),
    ).resolves.toEqual({ status: "empty" });
  });

  it("returns unauthorized on HTTP 401", async () => {
    await expect(
      getAltarEmailPreviews({
        env: { ALTAR_ADMIN_TOKEN: "wrong-token" },
        fetch: async () => jsonResponse({ ok: false }, 401),
      }),
    ).resolves.toEqual({ status: "unauthorized" });
  });

  it("returns unavailable on network and 5xx failures", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(
      getAltarEmailPreviews({
        env: { ALTAR_ADMIN_TOKEN: "test-admin-token" },
        fetch: async () => {
          throw new Error("connect failed");
        },
      }),
    ).resolves.toEqual({ status: "unavailable" });
    await expect(
      getAltarEmailPreviews({
        env: { ALTAR_ADMIN_TOKEN: "test-admin-token" },
        fetch: async () => jsonResponse({ ok: false }, 503),
      }),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("returns malformed for non-JSON and schema-invalid bodies", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(
      getAltarEmailPreviews({
        env: { ALTAR_ADMIN_TOKEN: "test-admin-token" },
        fetch: async () => new Response("<html>nope</html>", { status: 200 }),
      }),
    ).resolves.toEqual({ status: "malformed" });
    await expect(
      getAltarEmailPreviews({
        env: { ALTAR_ADMIN_TOKEN: "test-admin-token" },
        fetch: async () =>
          jsonResponse({ ok: true, templates: [{ id: "broken" }] }),
      }),
    ).resolves.toEqual({ status: "malformed" });
  });
});

function vaultDatabase(): DatabaseSync {
  const database = new DatabaseSync(":memory:");
  database.exec(`
    CREATE TABLE orgs (
      orgId TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      quotaBytes INTEGER,
      createdAt INTEGER NOT NULL
    );
    CREATE TABLE memberships (
      userId TEXT NOT NULL,
      orgId TEXT NOT NULL,
      role TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      PRIMARY KEY (userId, orgId)
    );
    CREATE TABLE org_invite_codes (
      code TEXT PRIMARY KEY,
      orgId TEXT NOT NULL,
      role TEXT NOT NULL,
      intendedEmail TEXT,
      createdAt INTEGER NOT NULL,
      expiresAt INTEGER NOT NULL,
      status TEXT NOT NULL,
      claimedAt INTEGER,
      claimedUserId TEXT
    );
    INSERT INTO orgs VALUES
      ('org_binance', 'Binance', NULL, 10),
      ('org_sqp', 'Sidequest', 1000, 20);
    INSERT INTO memberships VALUES
      ('user_alice', 'org_binance', 'admin', 30),
      ('user_bob', 'org_binance', 'member', 40),
      ('user_ghost', 'org_sqp', 'member', 50);
    INSERT INTO org_invite_codes VALUES
      ('ALTAR-ACTI-VE01', 'org_binance', 'member', 'pat@example.com', 60, 5000, 'sent', NULL, NULL),
      ('ALTAR-EXPI-RED1', 'org_binance', 'admin', 'old@example.com', 70, 80, 'sent', NULL, NULL),
      ('ALTAR-CLAI-MED1', 'org_sqp', 'member', 'ghost@example.com', 90, 5000, 'claimed', 100, 'user_ghost');
  `);
  return database;
}

function waitlistIdentityDatabase(): DatabaseSync {
  const database = new DatabaseSync(":memory:");
  database.exec(`
    CREATE TABLE waitlist (
      email TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      status TEXT NOT NULL,
      first_signed_in_at INTEGER
    );
    CREATE TABLE invite_codes (
      code TEXT PRIMARY KEY,
      intended_email TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      status TEXT NOT NULL,
      claimed_at INTEGER,
      claimed_email TEXT,
      claimed_user_id TEXT
    );
    INSERT INTO waitlist VALUES
      ('alice@example.com', 1, 'joined', 2),
      ('pat@example.com', 3, 'pending', NULL);
    INSERT INTO invite_codes VALUES
      ('ALTAR-ACCE-SS01', 'alice@example.com', 4, 9, 'claimed', 5, 'alice@example.com', 'user_alice');
  `);
  return database;
}

describe("getAltarTeamsPage", () => {
  it("fails explicitly when the ALTAR_VAULT_CATALOG binding is missing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(getAltarTeamsPage({ page: 1 })).rejects.toMatchObject({
      kind: "missing_binding",
    } satisfies Partial<AltarAdminError>);
  });

  it("loads bounded Teams, Memberships, and Invites without per-row queries", async () => {
    const vault = vaultDatabase();
    const waitlist = waitlistIdentityDatabase();
    const data = await getAltarTeamsPage(
      { page: 1 },
      {
        vault: sqliteDb(vault),
        waitlist: sqliteDb(waitlist),
        env: { ALTAR_ADMIN_TOKEN: "test-admin-token" },
        nowSeconds: 1_000,
      },
    );

    expect(data.teams.map((team) => team.name)).toEqual([
      "Binance",
      "Sidequest",
    ]);
    expect(data.teams[0]).toMatchObject({ memberCount: 2, inviteCount: 2 });
    expect(data.memberships).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: "user_alice",
          identity: "alice@example.com",
          role: "admin",
        }),
        expect.objectContaining({
          userId: "user_ghost",
          identity: "user_ghost",
          email: null,
        }),
      ]),
    );
    expect(data.invites.map((invite) => invite.displayStatus).sort()).toEqual([
      "active",
      "claimed",
      "expired",
    ]);
    expect(data.peopleEmails).toEqual(["alice@example.com", "pat@example.com"]);
    expect(data.mutation).toEqual({ status: "ready" });
    vault.close();
    waitlist.close();
  });

  it("binds invite pagination values and does not interpolate page into SQL", () => {
    const query = altarTeamsSqlForTest.invites({ page: 3 });
    expect(query.sql).not.toContain("100");
    expect(query.binds).toEqual([100, 50, 50, 50]);
  });

  it("falls back to user IDs when the waitlist identity map is unavailable", async () => {
    const vault = vaultDatabase();
    const data = await getAltarTeamsPage(
      { page: 1 },
      { vault: sqliteDb(vault), waitlist: null, nowSeconds: 1_000 },
    );
    expect(data.memberships.every((row) => row.email === null)).toBe(true);
    expect(data.memberships.map((row) => row.identity)).toEqual(
      expect.arrayContaining(["user_alice", "user_bob", "user_ghost"]),
    );
    vault.close();
  });
});

describe("sendAltarTeamInvite", () => {
  it("rejects viewer and invalid email before calling the Worker", async () => {
    const fetchImpl = vi.fn();
    await expect(
      sendAltarTeamInvite(
        { email: "pat@example.com", orgId: "org_binance", role: "viewer" },
        { env: { ALTAR_ADMIN_TOKEN: "secret" }, fetch: fetchImpl },
      ),
    ).resolves.toMatchObject({ status: "invalid" });
    await expect(
      sendAltarTeamInvite(
        { email: "nope", orgId: "org_binance", role: "member" },
        { env: { ALTAR_ADMIN_TOKEN: "secret" }, fetch: fetchImpl },
      ),
    ).resolves.toMatchObject({ status: "invalid" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("posts to the vault-signing Worker with a bearer token and no-store", async () => {
    const fetchImpl = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        expect(String(input)).toBe(
          `${DEFAULT_ALTAR_VAULT_URL}/admin/team-invite`,
        );
        expect(init?.method).toBe("POST");
        expect(init?.cache).toBe("no-store");
        expect(init?.headers).toMatchObject({
          Authorization: "Bearer secret-token",
        });
        expect(JSON.parse(String(init?.body))).toEqual({
          email: "pat@example.com",
          orgId: "org_binance",
          role: "member",
        });
        return jsonResponse({ ok: true, outcome: "minted", delivered: true });
      },
    );

    const result = await sendAltarTeamInvite(
      { email: "Pat@Example.com", orgId: "org_binance", role: "member" },
      { env: { ALTAR_ADMIN_TOKEN: "secret-token" }, fetch: fetchImpl },
    );
    expect(result).toEqual({
      status: "sent",
      email: "pat@example.com",
      orgId: "org_binance",
      role: "member",
    });
    expect(JSON.stringify(result)).not.toContain("secret-token");
  });

  it("maps resent, delivery-failed, and already-a-member outcomes", async () => {
    await expect(
      sendAltarTeamInvite(
        { email: "pat@example.com", orgId: "org_binance", role: "admin" },
        {
          env: { ALTAR_ADMIN_TOKEN: "secret" },
          fetch: async () =>
            jsonResponse({ ok: true, outcome: "reused", delivered: true }),
        },
      ),
    ).resolves.toMatchObject({ status: "resent", role: "admin" });
    await expect(
      sendAltarTeamInvite(
        { email: "pat@example.com", orgId: "org_binance", role: "member" },
        {
          env: { ALTAR_ADMIN_TOKEN: "secret" },
          fetch: async () =>
            jsonResponse({ ok: true, outcome: "minted", delivered: false }),
        },
      ),
    ).resolves.toMatchObject({ status: "delivery_failed" });
    await expect(
      sendAltarTeamInvite(
        { email: "pat@example.com", orgId: "org_binance", role: "member" },
        {
          env: { ALTAR_ADMIN_TOKEN: "secret" },
          fetch: async () =>
            jsonResponse(
              {
                ok: false,
                reason: "already_member",
                error: "Already a member.",
              },
              409,
            ),
        },
      ),
    ).resolves.toMatchObject({ status: "already_member" });
  });

  it("returns missing_config, unauthorized, and unavailable without leaking the token", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(
      sendAltarTeamInvite({
        email: "pat@example.com",
        orgId: "org_binance",
        role: "member",
      }),
    ).resolves.toEqual({
      status: "missing_config",
      email: "pat@example.com",
      orgId: "org_binance",
      role: "member",
    });
    await expect(
      sendAltarTeamInvite(
        { email: "pat@example.com", orgId: "org_binance", role: "member" },
        {
          env: { ALTAR_ADMIN_TOKEN: "secret" },
          fetch: async () => jsonResponse({ ok: false }, 401),
        },
      ),
    ).resolves.toMatchObject({ status: "unauthorized" });
    const unavailable = await sendAltarTeamInvite(
      { email: "pat@example.com", orgId: "org_binance", role: "member" },
      {
        env: { ALTAR_ADMIN_TOKEN: "secret" },
        fetch: async () => {
          throw new Error("connect failed");
        },
      },
    );
    expect(unavailable.status).toBe("unavailable");
    expect(JSON.stringify(unavailable)).not.toContain("secret");
  });
});
