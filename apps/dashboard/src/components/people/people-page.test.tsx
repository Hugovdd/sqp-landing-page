import { productNav } from "@sqp/shared/products";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { type PeoplePageData } from "@/lib/altar-admin";
import { type PeopleParams, toPersonLifecycle } from "@/lib/altar-people";

import { PeoplePageView } from "./people-page";

const params: PeopleParams = {
  search: "needle@example.com",
  states: ["invite_issued"],
  order: "newest",
  page: 1,
  selectedEmail: null,
};

function data(overrides: Partial<PeoplePageData> = {}): PeoplePageData {
  return {
    people: [],
    total: 0,
    page: 1,
    pageCount: 1,
    detail: null,
    ...overrides,
  };
}

describe("People page", () => {
  it("is present only in Altar navigation", () => {
    expect(productNav("altar")).toContainEqual({ key: "people" });
    expect(productNav("ae-sheets")).not.toContainEqual({ key: "people" });
    expect(productNav("find-and-replace-fonts")).not.toContainEqual({
      key: "people",
    });
  });

  it("renders filters and a successful empty state", () => {
    const html = renderToStaticMarkup(
      <PeoplePageView
        params={params}
        result={{ status: "ready", data: data() }}
      />,
    );
    expect(html).toContain("needle@example.com");
    expect(html).toContain("Invite issued");
    expect(html).toContain("No Waitlist Entries match these filters");
    expect(html).toContain("query succeeded");
  });

  it("renders bounded pagination links that preserve filters", () => {
    const person = toPersonLifecycle({
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
      totalCount: 120,
    });
    const html = renderToStaticMarkup(
      <PeoplePageView
        params={params}
        result={{
          status: "ready",
          data: data({ people: [person], total: 120, pageCount: 3 }),
        }}
      />,
    );
    expect(html).toContain("page=2");
    expect(html).toContain("search=needle%40example.com");
    expect(html).toContain("state=invite_issued");
  });

  it("renders an explicit 503-style query failure, never a false empty list", () => {
    const html = renderToStaticMarkup(
      <PeoplePageView
        params={params}
        result={{ status: "unavailable", kind: "query_failed" }}
      />,
    );
    expect(html).toContain("lifecycle data is unavailable");
    expect(html).toContain("could not be queried");
    expect(html).not.toContain("No Waitlist Entries match");
  });

  it("shows intended and claimed identities separately when they diverge", () => {
    const person = toPersonLifecycle({
      email: "intended@example.com",
      createdAt: 100,
      waitlistStatus: "joined",
      firstSignedInAt: null,
      inviteCount: 1,
      claimedCount: 1,
      latestInviteCode: "ALTAR-AAAA-BBBB",
      latestInviteStatus: "claimed",
      latestInviteCreatedAt: 200,
      latestInviteExpiresAt: 400,
      latestClaimedAt: 300,
      latestClaimedEmail: "claimed@example.com",
      latestClaimedUserId: "user_123",
      totalCount: 1,
    });
    const html = renderToStaticMarkup(
      <PeoplePageView
        params={{ ...params, search: "" }}
        result={{ status: "ready", data: data({ people: [person], total: 1 }) }}
      />,
    );
    expect(html).toContain("intended@example.com");
    expect(html).toContain("claimed@example.com");
    expect(html).toContain("Different from intended");
  });
});
