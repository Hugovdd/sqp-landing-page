import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config. By default Playwright builds and boots the real Cloudflare
 * `workerd` preview (`pnpm build && pnpm preview`) so that prerender=false
 * API routes execute under the Worker runtime, then tests hit localhost:4321.
 *
 * Override the target with E2E_BASE_URL (e.g. the deployed staging URL) to
 * skip the local server and run against a remote environment.
 */
const baseURL = process.env.E2E_BASE_URL || "http://localhost:4321";
const useLocalServer = !process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "html" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: useLocalServer
    ? {
        command: "pnpm build && pnpm preview",
        url: baseURL,
        timeout: 180_000,
        reuseExistingServer: !process.env.CI,
      }
    : undefined,
});
