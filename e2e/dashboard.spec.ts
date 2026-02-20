import { test, expect } from "@playwright/test";

test.describe("Dashboard page", () => {
  test("shows sign-in prompt when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect or show sign-in
    await expect(page.locator("text=Sign in")).toBeVisible({ timeout: 10000 });
  });

  test("home page loads with navigation link", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("IoT Dashboard");
    await expect(page.getByRole("link", { name: "Go to Dashboard" })).toBeVisible();
  });
});
