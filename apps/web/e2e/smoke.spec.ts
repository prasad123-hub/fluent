import { expect, test } from "@playwright/test";

/**
 * Smoke flow against a running app (pnpm dev) with seeded data.
 * Env: E2E_EMAIL, E2E_PASSWORD (owner credentials). Run: pnpm --filter @fluent/web e2e
 */
const email = process.env.E2E_EMAIL ?? process.env.OWNER_EMAIL ?? "owner@example.com";
const password = process.env.E2E_PASSWORD ?? "";

test.skip(!password, "E2E_PASSWORD not set");

test("login → dashboard → practice launcher → sessions table", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click("button[type=submit]");
  await page.waitForURL("**/dashboard");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /Good (morning|afternoon|evening)/,
  );

  await page.goto("/practice");
  await expect(page.getByRole("heading", { name: "Practice" })).toBeVisible();
  await expect(page.getByText("Start practice")).toBeVisible();

  await page.goto("/dashboard/sessions");
  await expect(page.getByRole("heading", { name: "Sessions" })).toBeVisible();
});

test("unauthenticated API calls are rejected", async ({ request }) => {
  const res = await request.get("/api/sessions");
  expect(res.status()).toBe(401);
});

test("login rejects wrong password", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", "definitely-wrong-password");
  await page.click("button[type=submit]");
  await expect(page.getByRole("alert")).toContainText(/don't match|Too many/);
});
