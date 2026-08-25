import { describe, expect, it } from "vitest";

import {
  parseAccessEmail,
  parseAccessInviteResponse,
  parseAccessRevokeResponse,
} from "./altar-access-invite";

describe("parseAccessEmail", () => {
  it("normalizes a valid address", () => {
    expect(parseAccessEmail({ email: "  A@X.com " })).toEqual({
      ok: true,
      email: "a@x.com",
    });
  });

  it("rejects junk", () => {
    expect(parseAccessEmail({ email: "nope" }).ok).toBe(false);
  });
});

describe("parseAccessInviteResponse", () => {
  it("maps minted and reused outcomes", () => {
    expect(
      parseAccessInviteResponse(
        { ok: true, issued: [{ email: "a@x.com", outcome: "minted" }] },
        200,
      ).status,
    ).toBe("sent");
    expect(
      parseAccessInviteResponse(
        { ok: true, issued: [{ email: "a@x.com", outcome: "reused" }] },
        200,
      ).status,
    ).toBe("resent");
  });

  it("maps 401", () => {
    expect(parseAccessInviteResponse({}, 401).status).toBe("unauthorized");
  });
});

describe("parseAccessRevokeResponse", () => {
  it("maps success and missing person", () => {
    expect(
      parseAccessRevokeResponse({ ok: true, email: "a@x.com" }, 200).status,
    ).toBe("revoked");
    expect(parseAccessRevokeResponse({}, 404).status).toBe("unknown_person");
  });
});
