import { productNav } from "@sqp/shared/products";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { TeamsPageData } from "@/lib/altar-admin";
import { idleTeamInviteState } from "@/lib/altar-team-invite";

import { TeamInviteFormFields } from "./invite-form";
import { TeamsPageView } from "./teams-page";

const team = {
  orgId: "org_binance",
  name: "Binance",
  quotaBytes: null,
  createdAt: 100,
  memberCount: 1,
  inviteCount: 1,
  identified: 0 as const,
};

function data(overrides: Partial<TeamsPageData> = {}): TeamsPageData {
  return {
    teams: [team],
    memberships: [],
    invites: [],
    inviteTotal: 0,
    invitePage: 1,
    invitePageCount: 1,
    peopleEmails: ["pat@example.com"],
    claimedAccounts: [{ userId: "user_pat", email: "pat@example.com" }],
    mutation: { status: "ready" },
    ...overrides,
  };
}

function renderForm(
  overrides: Partial<Parameters<typeof TeamInviteFormFields>[0]> = {},
) {
  return renderToStaticMarkup(
    <TeamInviteFormFields
      teams={[team]}
      peopleEmails={["pat@example.com"]}
      disabled={false}
      pending={false}
      outcome={idleTeamInviteState}
      {...overrides}
    />,
  );
}

describe("Teams page", () => {
  it("is present only in Altar navigation", () => {
    expect(productNav("altar")).toContainEqual({ key: "teams" });
    expect(productNav("ae-sheets")).not.toContainEqual({ key: "teams" });
    expect(productNav("find-and-replace-fonts")).not.toContainEqual({
      key: "teams",
    });
    expect(productNav("all")).not.toContainEqual({ key: "teams" });
  });

  it("defaults the role to member and makes admin explicit", () => {
    const html = renderForm();
    expect(html).toContain('value="member"');
    expect(html).toContain("checked");
    expect(html).toContain('value="admin"');
    expect(html).toContain("Choose only when that access is intended");
    expect(html).not.toContain('value="viewer"');
  });

  it("disables submit while a request is pending", () => {
    const html = renderForm({ pending: true });
    expect(html).toContain("disabled");
    expect(html).toContain("Sending…");
  });

  it("renders sent, resent, already-a-member, and retryable delivery failure", () => {
    expect(renderForm({ outcome: { status: "sent" } })).toContain(
      "Team Invite sent.",
    );
    expect(renderForm({ outcome: { status: "resent" } })).toContain(
      "Existing Team Invite resent.",
    );
    expect(renderForm({ outcome: { status: "already_member" } })).toContain(
      "Already a member of this Team",
    );
    const failed = renderForm({ outcome: { status: "delivery_failed" } });
    expect(failed).toContain("Invite code created but the email failed");
    expect(failed).toContain("Retry");
  });

  it("does not invent a Membership after a successful send", () => {
    const html = renderToStaticMarkup(
      <TeamsPageView
        result={{
          status: "ready",
          data: data({
            memberships: [],
            invites: [
              {
                code: "ALTAR-NEW1-CODE",
                orgId: "org_binance",
                orgName: "Binance",
                role: "member",
                intendedEmail: "new@example.com",
                createdAt: 200,
                expiresAt: 400,
                status: "sent",
                claimedAt: null,
                claimedUserId: null,
                displayStatus: "active",
                claimedEmail: null,
                claimedIdentity: null,
              },
            ],
            inviteTotal: 1,
          }),
        }}
      />,
    );
    expect(html).toContain("ALTAR-NEW1-CODE");
    expect(html).toContain("No Memberships yet");
    expect(html).toContain("They appear only after a Team Invite is");
  });

  it("shows a Clerk user ID when no email mapping exists", () => {
    const html = renderToStaticMarkup(
      <TeamsPageView
        result={{
          status: "ready",
          data: data({
            memberships: [
              {
                userId: "user_ghost",
                orgId: "org_binance",
                orgName: "Binance",
                role: "member",
                createdAt: 100,
                email: null,
                identity: "user_ghost",
              },
            ],
          }),
        }}
      />,
    );
    expect(html).toContain("user_ghost");
    expect(html).toContain("Clerk user ID");
  });

  it("disables mutation and names the missing token", () => {
    const html = renderToStaticMarkup(
      <TeamsPageView
        result={{
          status: "ready",
          data: data({ mutation: { status: "missing_config" } }),
        }}
      />,
    );
    expect(html).toContain("Team Invite sending is unavailable");
    expect(html).toContain("ALTAR_ADMIN_TOKEN");
  });

  it("renders an explicit vault unavailable state, never a false empty list", () => {
    const html = renderToStaticMarkup(
      <TeamsPageView
        result={{ status: "unavailable", kind: "query_failed" }}
      />,
    );
    expect(html).toContain("Teams data is unavailable");
    expect(html).toContain("could not be queried");
    expect(html).not.toContain("No Teams yet");
    expect(html).not.toContain("Send Team Invite");
  });

  it("keeps the mutation URL and admin token out of the form markup", () => {
    const html = renderForm();
    expect(html).not.toContain("/admin/team-invite");
    expect(html).not.toContain("ALTAR_ADMIN_TOKEN");
    expect(html).not.toContain("sign.motionaltar.com");
  });
});
