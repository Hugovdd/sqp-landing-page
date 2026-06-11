import { expect, test } from "@playwright/test";

/**
 * Page-load smoke: every primary static route returns 200 and renders its
 * server-side <main> content. We deliberately assert on SSR content (not the
 * navbar, which is `client:only` and empty until hydration).
 */
const ROUTES = [
  "/",
  "/blog",
  "/blog/replace-fonts-in-after-effects-fast",
  "/find-and-replace-fonts",
  "/ae-sheets",
  "/free-ae-scripts",
  "/free-ae-scripts/ae-calculator",
  "/contact",
  "/help",
  "/privacy",
  "/terms",
];

for (const path of ROUTES) {
  test(`loads ${path}`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status(), `${path} should return 200`).toBe(200);
    await expect(page.locator("main").first()).toBeVisible();
    await expect(page.locator("h1, h2").first()).toBeVisible();
    await expect(page).toHaveTitle(/.+/);
  });
}

test("home renders hero content", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main")).toContainText(/font|effects|sidequest/i);
});

test("unknown route returns 404", async ({ page }) => {
  const response = await page.goto("/this-route-does-not-exist");
  expect(response?.status()).toBe(404);
});
