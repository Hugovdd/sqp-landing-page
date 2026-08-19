import { productNav } from "@sqp/shared/products";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type {
  AltarEmailPreviewsResult,
  AltarEmailTemplate,
} from "@/lib/altar-admin";

import { EmailTemplatesPageView } from "./email-templates-page";

const hostile = `<img src=x onerror=alert(1)><script>alert("x")</script>`;

const readyTemplate: AltarEmailTemplate = {
  id: "waitlist-confirm",
  name: hostile,
  trigger: `Joined waitlist ${hostile}`,
  subject: `Confirm ${hostile}`,
  html: `<script>alert("html")</script><p>Welcome</p>`,
  text: `Plain ${hostile}`,
};

const failedTemplate: AltarEmailTemplate = {
  id: "invite-follow-up",
  name: "Invite follow-up",
  trigger: "Invite is about to expire",
  error: `Renderer exploded ${hostile}`,
};

function render(result: AltarEmailPreviewsResult, selectedId?: string) {
  return renderToStaticMarkup(
    <EmailTemplatesPageView result={result} selectedId={selectedId} />,
  );
}

describe("Email Templates page", () => {
  it("is present only in Altar navigation", () => {
    expect(productNav("altar")).toContainEqual({ key: "email-templates" });
    expect(productNav("ae-sheets")).not.toContainEqual({
      key: "email-templates",
    });
    expect(productNav("find-and-replace-fonts")).not.toContainEqual({
      key: "email-templates",
    });
    expect(productNav("all")).not.toContainEqual({ key: "email-templates" });
  });

  it("selects a gallery item and sandboxes HTML without executing markup", () => {
    const html = render(
      { status: "ready", templates: [readyTemplate, failedTemplate] },
      "waitlist-confirm",
    );

    expect(html).toContain("waitlist-confirm");
    expect(html).toContain("Invite follow-up");
    expect(html).toContain('aria-current="page"');
    expect(html).toContain(
      "/email-templates?product=altar&amp;template=waitlist-confirm",
    );
    expect(html).toContain('sandbox=""');
    expect(html).not.toContain("allow-scripts");
    expect(html).not.toContain("allow-same-origin");
    expect(html).not.toContain("allow-forms");
    expect(html).not.toContain("allow-top-navigation");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).toContain("Plain &lt;img src=x onerror=alert(1)&gt;");
    expect(html).not.toMatch(/<img src=x onerror=alert\(1\)>/);
    expect(html).not.toContain('<script>alert("x")</script>');
    expect(html).not.toContain('srcDoc="<script>');
  });

  it("keeps the gallery when one template fails to render", () => {
    const html = render(
      { status: "ready", templates: [readyTemplate, failedTemplate] },
      "invite-follow-up",
    );

    expect(html).toContain("Invite follow-up");
    expect(html).toContain("This template failed to render");
    expect(html).toContain(
      "Renderer exploded &lt;img src=x onerror=alert(1)&gt;",
    );
    expect(html).toContain("Confirm");
    expect(html).not.toContain("No email templates were returned");
  });

  it("renders an explicit empty state", () => {
    const html = render({ status: "empty" });
    expect(html).toContain("No email templates were returned");
    expect(html).toContain("empty template list");
    expect(html).not.toContain('sandbox=""');
  });

  it("renders an explicit malformed state", () => {
    const html = render({ status: "malformed" });
    expect(html).toContain("Email preview response is malformed");
    expect(html).not.toContain("No email templates were returned");
  });

  it("renders explicit unauthorized, unavailable, and missing-config states", () => {
    expect(render({ status: "unauthorized" })).toContain(
      "Not authorized to load email previews",
    );
    expect(render({ status: "unavailable" })).toContain(
      "Altar email previews are unavailable",
    );
    expect(render({ status: "missing_config" })).toContain(
      "Altar email previews are not configured",
    );
    expect(render({ status: "unavailable" })).not.toContain(
      "No email templates were returned",
    );
  });
});
