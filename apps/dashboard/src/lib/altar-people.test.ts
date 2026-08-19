import { describe, expect, it } from "vitest";

import {
  LIFECYCLE_RULES,
  lifecycleCaseSql,
  parsePeopleParams,
  toPersonDetail,
  toPersonLifecycle,
} from "./altar-people";

const NOW = 2_000;

function row(overrides: Record<string, unknown> = {}) {
  return {
    email: "intended@example.com",
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
    ...overrides,
  };
}

describe("toPersonLifecycle", () => {
  it.each([
    [row(), "awaiting_invite"],
    [
      row({
        inviteCount: 1,
        latestInviteCode: "ALTAR-AAAA-BBBB",
        latestInviteStatus: "sent",
        latestInviteCreatedAt: 500,
        latestInviteExpiresAt: NOW + 1,
      }),
      "invite_issued",
    ],
    [
      row({
        inviteCount: 1,
        latestInviteCode: "ALTAR-AAAA-BBBB",
        latestInviteStatus: "sent",
        latestInviteCreatedAt: 500,
        latestInviteExpiresAt: NOW,
      }),
      "invite_expired",
    ],
    [row({ waitlistStatus: "joined" }), "account_joined"],
    [
      row({ waitlistStatus: "joined", firstSignedInAt: 1_500 }),
      "active_in_panel",
    ],
    [row({ waitlistStatus: "invited" }), "manual_legacy_grant"],
  ])("maps the diagram branch to %s", (input, expected) => {
    expect(toPersonLifecycle(input, NOW).state).toBe(expected);
  });

  it("uses one ordered declaration for TypeScript and SQL lifecycle precedence", () => {
    const sql = lifecycleCaseSql();
    expect(LIFECYCLE_RULES.map((rule) => rule.state)).toEqual([
      "active_in_panel",
      "account_joined",
      "manual_legacy_grant",
      "awaiting_invite",
      "invite_expired",
      "invite_issued",
    ]);
    for (const rule of LIFECYCLE_RULES) {
      expect(sql.match(new RegExp(`'${rule.state}'`, "g"))).toHaveLength(1);
    }
  });

  it("uses the Waitlist Entry email as the Account identity for legacy joined rows", () => {
    expect(toPersonLifecycle(row({ waitlistStatus: "joined" }))).toMatchObject({
      state: "account_joined",
      claimedEmail: "intended@example.com",
      identityDiverged: false,
    });
  });

  it("preserves intended and differently claimed identities", () => {
    const person = toPersonLifecycle(
      row({
        inviteCount: 2,
        claimedCount: 1,
        latestInviteCode: "ALTAR-AAAA-BBBB",
        latestInviteStatus: "claimed",
        latestInviteCreatedAt: 500,
        latestInviteExpiresAt: 5_000,
        latestClaimedAt: 900,
        latestClaimedEmail: "claimed@example.com",
        latestClaimedUserId: "user_123",
      }),
      NOW,
    );
    expect(person).toMatchObject({
      email: "intended@example.com",
      claimedEmail: "claimed@example.com",
      claimedUserId: "user_123",
      identityDiverged: true,
      state: "account_joined",
      inviteCount: 2,
    });
  });

  it("rejects malformed D1 rows", () => {
    expect(() => toPersonLifecycle(row({ createdAt: "yesterday" }))).toThrow();
  });
});

describe("detail and filter parsing", () => {
  it("maps multiple invite rows and nullable optional fields", () => {
    const base = {
      waitlistEmail: "person@example.com",
      waitlistCreatedAt: 10,
      waitlistStatus: "joined",
      waitlistFirstSignedInAt: null,
    };
    const detail = toPersonDetail([
      {
        ...base,
        code: "ALTAR-AAAA-BBBB",
        intendedEmail: "other@example.com",
        inviteCreatedAt: 30,
        expiresAt: 60,
        inviteStatus: "claimed",
        claimedAt: 40,
        claimedEmail: "person@example.com",
        claimedUserId: null,
        accountFirstSignedInAt: 45,
      },
      {
        ...base,
        code: "ALTAR-CCCC-DDDD",
        intendedEmail: "person@example.com",
        inviteCreatedAt: 20,
        expiresAt: 50,
        inviteStatus: "sent",
        claimedAt: null,
        claimedEmail: null,
        claimedUserId: null,
        accountFirstSignedInAt: null,
      },
    ]);
    expect(detail?.invites).toHaveLength(2);
    expect(detail?.invites[0]).toMatchObject({ identityDiverged: true });
    expect(detail?.invites[1]).toMatchObject({ claimedEmail: null });
    expect(detail?.firstSignedInAt).toBe(45);
  });

  it("accepts multiple lifecycle filters and bounds pagination", () => {
    expect(
      parsePeopleParams({
        state: ["invite_issued", "active_in_panel", "bogus"],
        page: "999999999",
        order: "oldest",
      }),
    ).toMatchObject({
      states: ["invite_issued", "active_in_panel"],
      page: 100_000,
      order: "oldest",
    });
  });
});
