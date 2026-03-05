import { expect, test } from "@playwright/test";

test("crm smoke renders login page", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Войти" })).toBeVisible();

  const registerLink = page.getByRole("link", { name: "Зарегистрироваться" });
  await expect(registerLink).toBeVisible();
  await expect(registerLink).toHaveAttribute("href", "/register");
});
