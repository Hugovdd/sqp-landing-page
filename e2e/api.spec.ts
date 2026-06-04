import { expect, test } from "@playwright/test";

/**
 * API endpoint validation. These hit only the early-return paths that run
 * BEFORE any Mailgun/secret access, so they send no real emails and need no
 * secrets. (The success paths are intentionally not exercised here.)
 */

test("POST /api/subscribe rejects an invalid email (400)", async ({
  request,
}) => {
  const res = await request.post("/api/subscribe", {
    data: { email: "not-an-email" },
  });
  expect(res.status()).toBe(400);
  expect(await res.json()).toMatchObject({
    error: "A valid email is required.",
  });
});

test("POST /api/contact rejects bad input (400)", async ({ request }) => {
  const short = await request.post("/api/contact", {
    data: { name: "x", email: "a@b.com", message: "too short" },
  });
  expect(short.status()).toBe(400);
  expect(await short.json()).toMatchObject({
    error: "Name must be at least 2 characters.",
  });

  const badEmail = await request.post("/api/contact", {
    data: { name: "Valid Name", email: "nope", message: "a".repeat(20) },
  });
  expect(badEmail.status()).toBe(400);
  expect(await badEmail.json()).toMatchObject({
    error: "A valid email is required.",
  });

  const shortMsg = await request.post("/api/contact", {
    data: { name: "Valid Name", email: "a@b.com", message: "short" },
  });
  expect(shortMsg.status()).toBe(400);
  expect(await shortMsg.json()).toMatchObject({
    error: "Message must be at least 10 characters.",
  });
});

/**
 * Regression guard for the Turnstile fail-closed fix: when TURNSTILE_SECRET_KEY
 * is configured (it is in the local .env-backed build), valid contact fields
 * WITHOUT a cf-turnstile-response token must be rejected (400) before Mailgun
 * is ever called. If the fail-closed guard is reverted, this request would fall
 * through to Mailgun and not return 400 — failing the test.
 */
test("POST /api/contact fails closed when Turnstile token is missing", async ({
  request,
}) => {
  const res = await request.post("/api/contact", {
    data: {
      name: "Playwright Test",
      email: "e2e@example.com",
      message: "This is an automated e2e bot-protection regression check.",
    },
  });
  expect(res.status()).toBe(400);
  expect(await res.json()).toMatchObject({
    error: "Bot verification failed. Please try again.",
  });
});

test("GET /api/confirm without a hash redirects to subscription-error", async ({
  request,
}) => {
  const res = await request.get("/api/confirm?email=test%40example.com", {
    maxRedirects: 0,
  });
  expect([301, 302, 307, 308]).toContain(res.status());
  expect(res.headers()["location"]).toContain(
    "/subscription-error?reason=invalid_hash",
  );
});

test("GET /api/health returns ok", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
});
