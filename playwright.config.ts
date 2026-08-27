import { defineConfig, devices } from "@playwright/test";

// Load E2E credentials/config from .env.test (gitignored).
try {
  process.loadEnvFile(".env.test");
} catch {
  // .env.test is optional locally if credentials are provided another way
}

// The dev server must always run on the FIXED port 5173 (backend CORS /
// trusted-origin constraints), so we never let React Router pick a random
// port. If something is already listening on 5173 we reuse it instead of
// spawning a second server that would fail to bind.
const PORT = 5173;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // Keep E2E tests completely separate from vitest unit tests
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "setup",
      testMatch: /global-setup\.ts/,
    },
    {
      name: "chromium",
      dependencies: ["setup"],
      // `channel: "chrome"` uses the locally installed Google Chrome. Switch
      // to plain `devices["Desktop Chrome"]` once `npx playwright install
      // chromium` has succeeded on this machine / in CI.
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],

  webServer: {
    command: "pnpm exec react-router dev",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
