import { describe, expect, it } from "vitest";

import {
  ALTAR_TEAM_INVITE_PATH,
  altarTeamInviteUrl,
  DEFAULT_ALTAR_VAULT_URL,
  parseTeamInviteInput,
  parseTeamInviteResponse,
} from "./altar-team-invite";

describe("parseTeamInviteInput", () => {
  it("defaults the role to member and normalizes email", () => {
    expect(
      parseTeamInviteInput({
        email: "  Pat@Example.com ",
        orgId: "org_binance",
      }),
    ).toEqual({
      ok: true,
      email: "pat@example.com",
      orgId: "org_binance",
      role: "member",
    });
  });

  it("accepts an explicit admin role", () => {
    expect(
      parseTeamInviteInput({
        email: "pat@example.com",
        orgId: "org_binance",
        role: "admin",
      }),
    ).toMatchObject({ ok: true, role: "admin" });
  });

  it("rejects viewer and invalid email or Team before any write", () => {
    expect(
      parseTeamInviteInput({
        email: "pat@example.com",
        orgId: "org_binance",
        role: "viewer",
      }),
    ).toEqual({
      ok: false,
      status: "invalid",
      message: "viewer is not mintable.",
    });
    expect(
      parseTeamInviteInput({ email: "not-an-email", orgId: "org_binance" }),
    ).toMatchObject({ ok: false, status: "invalid" });
    expect(
      parseTeamInviteInput({ email: "pat@example.com", orgId: "" }),
    ).toMatchObject({ ok: false, status: "invalid" });
  });
});

describe("parseTeamInviteResponse", () => {
  it("maps minted and reused deliveries from the Worker contract", () => {
    expect(
      parseTeamInviteResponse({ ok: true, outcome: "minted" }, 200),
    ).toEqual({ status: "sent" });
    expect(
      parseTeamInviteResponse({ ok: true, outcome: "reused" }, 200),
    ).toEqual({ status: "resent" });
  });

  it("maps HTTP 502 delivery_failed to a retryable partial failure", () => {
    expect(
      parseTeamInviteResponse(
        {
          ok: false,
          outcome: "delivery_failed",
          code: "ALTAR-AAAA-BBBB",
          error: "Email delivery failed.",
        },
        502,
      ),
    ).toEqual({ status: "delivery_failed" });
  });

  it("maps unknown Team, unauthorized, and invalid payloads", () => {
    expect(
      parseTeamInviteResponse({ ok: false, error: "No such org." }, 404),
    ).toEqual({ status: "unknown_team" });
    expect(parseTeamInviteResponse({ ok: false }, 401)).toEqual({
      status: "unauthorized",
    });
    expect(
      parseTeamInviteResponse(
        { ok: false, error: "role must be admin or member" },
        400,
      ),
    ).toEqual({
      status: "invalid",
      message: "role must be admin or member",
    });
  });
});

describe("altarTeamInviteUrl", () => {
  it("defaults the vault-signing origin and strips a trailing slash", () => {
    expect(altarTeamInviteUrl(undefined)).toBe(
      `${DEFAULT_ALTAR_VAULT_URL}${ALTAR_TEAM_INVITE_PATH}`,
    );
    expect(altarTeamInviteUrl("https://sign.example.test/")).toBe(
      "https://sign.example.test/admin/team-invite",
    );
    expect(altarTeamInviteUrl(undefined)).not.toContain("token");
  });
});
