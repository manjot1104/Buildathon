import { test, expect } from "@playwright/test";

test.describe("marketing smoke", () => {
  test("homepage loads with primary CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /stop doing extra work/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /start free/i }).first()).toBeVisible();
  });

  test("login page is reachable", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
  });
});
