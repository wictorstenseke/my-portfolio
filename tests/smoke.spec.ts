import { expect, test } from "@playwright/test";

test("page loads with hero visible and no runtime errors", async ({ page }) => {
  const errors: Error[] = [];
  page.on("pageerror", (e) => errors.push(e));

  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("UX Designer");
  await expect(page.getByAltText("Wictor Stenseke")).toBeVisible();
  await expect(page.getByRole("link", { name: "LinkedIn" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("theme toggle flips theme, persists it, and toggles back", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).not.toHaveAttribute("data-theme", "dark");

  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("theme"))).toBe("dark");

  // second toggle goes through the same path while the sweep may still be
  // settling — the historically fragile case
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(html).not.toHaveAttribute("data-theme", "dark");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("theme"))).toBe("light");
});

test.describe("mobile action sheet", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("logo tap opens sheet, Escape closes and restores focus", async ({ page }) => {
    await page.goto("/");
    const firstLogo = page.locator(".logo").first();
    await firstLogo.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("button", { name: "Close" })).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(firstLogo).toBeFocused();
  });

  test("backdrop tap closes sheet", async ({ page }) => {
    await page.goto("/");
    await page.locator(".logo").first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // tap the top of the backdrop, well clear of the sheet itself
    await page.locator(".sheet-backdrop").click({ position: { x: 20, y: 20 } });
    await expect(dialog).not.toBeVisible();
  });
});

test.describe("reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("page is fully visible without entrance animations", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveClass(/motion/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".hero-sub")).toBeVisible();
    await expect(page.locator(".footer")).toBeVisible();
  });
});
