import { expect, test } from "@playwright/test";

test("rapid theme toggling does not stack view-transition wave animations", async ({ page }) => {
  const errors: Error[] = [];
  page.on("pageerror", (e) => errors.push(e));
  await page.goto("/");

  const supported = await page.evaluate(() => typeof document.startViewTransition === "function");
  test.skip(!supported, "no View Transitions API in this browser");

  const toggle = page.locator(".theme-toggle").first();
  await expect(toggle).toBeVisible();
  const box = await toggle.boundingBox();
  if (!box) throw new Error("theme toggle has no box");

  // each toggle animates a 1100ms clip-path wave on ::view-transition-new(root).
  // re-toggling must end the running one — dozens of concurrent full-viewport
  // clip-path animations are enough to take the renderer down.
  const waves = () =>
    page.evaluate(
      () =>
        document
          .getAnimations()
          .filter(
            (a) =>
              (a.effect as KeyframeEffect | null)?.pseudoElement === "::view-transition-new(root)",
          ).length,
    );

  let peak = 0;
  for (let i = 0; i < 40; i++) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(15);
    peak = Math.max(peak, await waves());
  }

  expect(peak).toBeLessThanOrEqual(2);
  expect(errors).toEqual([]);
});
