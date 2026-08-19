import { describe, expect, it } from "vitest";

import {
  alreadyHoldsRole,
  buildIdentityMap,
  membershipIdentity,
  parseTeamsParams,
  toMembership,
  toTeamInvite,
} from "./altar-teams";

describe("parseTeamsParams", () => {
  it("defaults to page 1 and clamps hostile values", () => {
    expect(parseTeamsParams({})).toEqual({ page: 1 });
    expect(parseTeamsParams({ page: ["3"] })).toEqual({ page: 3 });
    expect(parseTeamsParams({ page: "-2" })).toEqual({ page: 1 });
    expect(parseTeamsParams({ page: "nope" })).toEqual({ page: 1 });
  });
});

describe("identity mapping", () => {
  it("falls back to the Clerk user ID when no email is known", () => {
    expect(membershipIdentity("user_ghost", new Map())).toEqual({
      email: null,
      identity: "user_ghost",
    });
  });

  it("uses the claimed access-invite email when present", () => {
    const emails = buildIdentityMap([
      { userId: "user_alice", email: "alice@example.com" },
      { userId: "user_alice", email: "ignored@example.com" },
    ]);
    expect(membershipIdentity("user_alice", emails)).toEqual({
      email: "alice@example.com",
      identity: "alice@example.com",
    });
  });
});

describe("toMembership / toTeamInvite", () => {
  it("maps membership identity without guessing an email", () => {
    const membership = toMembership(
      {
        userId: "user_ghost",
        orgId: "org_binance",
        orgName: "Binance",
        role: "member",
        createdAt: 100,
      },
      new Map(),
    );
    expect(membership.identity).toBe("user_ghost");
    expect(membership.email).toBeNull();
  });

  it("classifies active, expired, and claimed invites", () => {
    const now = 1_000;
    const base = {
      orgId: "org_binance",
      orgName: "Binance",
      role: "member" as const,
      intendedEmail: "pat@example.com",
      createdAt: 10,
      claimedAt: null,
      claimedUserId: null,
      totalCount: 3,
    };
    expect(
      toTeamInvite(
        { ...base, code: "ALTAR-ACTI-VE01", expiresAt: 2_000, status: "sent" },
        new Map(),
        now,
      ).displayStatus,
    ).toBe("active");
    expect(
      toTeamInvite(
        { ...base, code: "ALTAR-EXPI-RED1", expiresAt: 500, status: "sent" },
        new Map(),
        now,
      ).displayStatus,
    ).toBe("expired");
    expect(
      toTeamInvite(
        {
          ...base,
          code: "ALTAR-CLAI-MED1",
          expiresAt: 500,
          status: "claimed",
          claimedAt: 200,
          claimedUserId: "user_alice",
        },
        new Map([["user_alice", "alice@example.com"]]),
        now,
      ),
    ).toMatchObject({
      displayStatus: "claimed",
      claimedEmail: "alice@example.com",
      claimedIdentity: "alice@example.com",
    });
  });
});

describe("alreadyHoldsRole", () => {
  it("treats an existing admin as already holding member or admin", () => {
    expect(alreadyHoldsRole("admin", "member")).toBe(true);
    expect(alreadyHoldsRole("admin", "admin")).toBe(true);
  });

  it("lets a member still receive an explicit admin invite", () => {
    expect(alreadyHoldsRole("member", "member")).toBe(true);
    expect(alreadyHoldsRole("member", "admin")).toBe(false);
  });
});
