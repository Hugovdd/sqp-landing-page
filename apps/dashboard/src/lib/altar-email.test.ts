import { describe, expect, it } from "vitest";

import {
  altarEmailPreviewsUrl,
  DEFAULT_ALTAR_WAITLIST_URL,
  parseAltarEmailPreviews,
} from "./altar-email";

const sample = {
  id: "waitlist-confirm",
  name: "Waitlist confirmation",
  trigger: "Someone joins the waitlist",
  subject: "You're on the list",
  html: "<p>Welcome</p>",
  text: "Welcome",
};

describe("parseAltarEmailPreviews", () => {
  it("normalizes a ready gallery and a per-template error", () => {
    expect(
      parseAltarEmailPreviews({
        ok: true,
        templates: [
          sample,
          { id: "invite-follow-up", error: "sample render failed" },
        ],
      }),
    ).toEqual({
      status: "ready",
      templates: [
        { ok: true, ...sample },
        {
          ok: false,
          id: "invite-follow-up",
          name: "invite-follow-up",
          trigger: "",
          error: "sample render failed",
        },
      ],
    });
  });

  it("returns empty when the worker sends no templates", () => {
    expect(parseAltarEmailPreviews({ ok: true, templates: [] })).toEqual({
      status: "empty",
    });
  });

  it("returns malformed for schema-invalid bodies", () => {
    expect(parseAltarEmailPreviews({ ok: false })).toEqual({
      status: "malformed",
    });
    expect(
      parseAltarEmailPreviews({ ok: true, templates: [{ id: "broken" }] }),
    ).toEqual({ status: "malformed" });
  });
});

describe("altarEmailPreviewsUrl", () => {
  it("defaults the waitlist origin and strips a trailing slash", () => {
    expect(altarEmailPreviewsUrl(undefined)).toBe(
      `${DEFAULT_ALTAR_WAITLIST_URL}/admin/email-previews`,
    );
    expect(altarEmailPreviewsUrl("https://waitlist.example.test/")).toBe(
      "https://waitlist.example.test/admin/email-previews",
    );
  });
});
