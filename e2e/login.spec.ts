import { test, expect } from "@playwright/test";

/**
 * Credentials come from .env.test (gitignored) — see E2E_TEST_USER_EMAIL /
 * E2E_TEST_USER_PASSWORD. They are NOT hardcoded here.
 *
 * Test account: dedicated E2E user living in the local dev database only
 * (role: "user"). It is safe for repeated automated logins.
 */
const TEST_EMAIL = process.env.E2E_TEST_USER_EMAIL;
const TEST_PASSWORD = process.env.E2E_TEST_USER_PASSWORD;

test.skip(
  !TEST_EMAIL || !TEST_PASSWORD,
  "E2E_TEST_USER_EMAIL / E2E_TEST_USER_PASSWORD must be set in .env.test",
);

test.describe("Login", () => {
  test("redirects to /dashboard after a successful login", async ({
    page,
  }) => {
    await page.goto("/login", { waitUntil: "networkidle" });

    await page.getByLabel("Email").fill(TEST_EMAIL!);
    await page.getByLabel("Password").fill(TEST_PASSWORD!);
    await page.getByRole("button", { name: /sign in/i }).click();

    // Authenticated users land on the user dashboard (not /admin)
    await expect(page).toHaveURL(/\/dashboard$/);

    // The dashboard layout should actually render (session was established)
    await expect(page.getByText("User dashboard")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("shows an error state for invalid credentials", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });

    await page.getByLabel("Email").fill("wrong-user@example.com");
    await page.getByLabel("Password").fill("definitely-not-the-password");
    await page.getByRole("button", { name: /sign in/i }).click();

    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(alert).not.toBeEmpty();

    // We stay on the login screen
    await expect(page).toHaveURL(/\/login$/);
  });
});
