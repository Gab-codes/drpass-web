import { test as setup, expect } from "@playwright/test";

/**
 * Provisions the dedicated E2E user before the browser tests run.
 *
 * NOTE: dayotoru55@gmail.com was found to be an ADMIN account (login
 * redirects to /admin), so it is NOT used here. Instead we create (or reuse)
 * a plain "user"-role account directly against better-auth's
 * sign-up endpoint. If the email already exists the backend returns a
 * USER_ALREADY_EXISTS error which we treat as success.
 */
const EMAIL = process.env.E2E_TEST_USER_EMAIL;
const PASSWORD = process.env.E2E_TEST_USER_PASSWORD;
const NAME = process.env.E2E_TEST_USER_NAME ?? "E2E Test User";

setup("ensure E2E test user exists", async ({ request }) => {
  const baseURL = process.env.VITE_AUTH_API_URL ?? "http://localhost:8080/api/auth";

  const response = await request.post(`${baseURL}/sign-up/email`, {
    data: { name: NAME, email: EMAIL, password: PASSWORD },
    failOnStatusCode: false,
  });

  if (response.ok()) return;

  const body = await response.text().catch(() => "");
  // Account already provisioned by a previous run — fine.
  if (/already/i.test(body) || response.status() === 422) return;

  throw new Error(
    `Failed to ensure E2E test user (${response.status()}): ${body}`,
  );
});
