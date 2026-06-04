import { expect, test } from "@playwright/test";

/**
 * Critical UI flows: navigation, contact form validation + success, and the
 * LemonSqueezy buy overlay. The contact success path mocks /api/contact so no
 * real email is sent; the buy-overlay test depends on LemonSqueezy's external
 * lemon.js (network).
 */

test("navbar link routes to the blog", async ({ page }) => {
  await page.goto("/");
  // Navbar is client:only and renders both a desktop and a (hidden) mobile
  // "Blog" link — target the visible one and wait for hydration.
  const blogLink = page.locator('a[href="/blog"]:visible').first();
  await expect(blogLink).toBeVisible();
  await blogLink.click();
  await expect(page).toHaveURL(/\/blog\/?$/);
  await expect(page.locator("main").first()).toBeVisible();
});

test("contact form blocks submission of an empty form", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: /Send Message|Sending/ }).click();
  // Inputs use native HTML5 constraints (required/minLength), which prevent
  // submission before the JS handler runs — so the form must stay put and the
  // name field must be natively invalid, with no success UI shown.
  const nameValid = await page
    .locator("#name")
    .evaluate((el: HTMLInputElement) => el.validity.valid);
  expect(nameValid).toBe(false);
  await expect(page.getByText(/Message sent/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Send Message/ })).toBeVisible();
});

test("contact form shows success UI on a successful submit (mocked)", async ({
  page,
}) => {
  await page.route("**/api/contact", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "Message sent successfully." }),
    }),
  );

  await page.goto("/contact");
  await page.getByPlaceholder("Your name").fill("Playwright Tester");
  await page.getByPlaceholder("you@example.com").fill("tester@example.com");
  await page
    .getByPlaceholder("How can we help?")
    .fill("This is an automated end-to-end test message, over ten characters.");

  // Assert the mocked POST actually fired, so a green proves the fetch path ran
  // (not that success UI appeared some other way).
  const request = page.waitForRequest("**/api/contact");
  await page.getByRole("button", { name: /Send Message|Sending/ }).click();
  expect((await request).method()).toBe("POST");

  await expect(page.getByText(/Message sent/i)).toBeVisible();
});

test("buy button mounts the LemonSqueezy checkout overlay", async ({ page }) => {
  await page.goto("/find-and-replace-fonts");
  // lemon.js loads async and registers createLemonSqueezy on window onload.
  await page.waitForFunction(
    () => typeof (window as never as { createLemonSqueezy?: unknown }).createLemonSqueezy === "function",
    null,
    { timeout: 20_000 },
  );
  await page
    .getByRole("link", { name: /Buy for \$20/ })
    .first()
    .click();
  await expect(
    page.locator('iframe[src*="lemonsqueezy.com/buy"]'),
  ).toBeAttached({ timeout: 15_000 });
});
