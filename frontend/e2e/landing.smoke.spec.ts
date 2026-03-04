import { expect, test } from "@playwright/test";

test("landing smoke renders and points to CRM login", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Industrial SaaS Starter" })).toBeVisible();

  const loginLink = page.getByRole("link", { name: "Войти" }).first();
  await expect(loginLink).toBeVisible();
  await expect(loginLink).toHaveAttribute("href", "http://localhost:5174/login");
});
