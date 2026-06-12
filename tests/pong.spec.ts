import { expect, test } from "@playwright/test";

const scrollToPong = async (page: import("@playwright/test").Page) => {
  await page.goto("/");
  const canvas = page.locator(".pong-canvas");
  await canvas.scrollIntoViewIfNeeded();
  // the entrance reveal keeps the section visibility:hidden for ~2s after
  // load — input can't land until anim.ts settles and drops the attribute.
  // without .motion (reduced motion) the attribute stays but nothing hides.
  await expect(
    page.locator("html.motion section[aria-label='Pong mini-game'][data-scroll-reveal]"),
  ).toHaveCount(0, { timeout: 10_000 });
  // the module lazy-loads on approach and sizes the backing store
  await expect
    .poll(() => canvas.evaluate((c) => (c as HTMLCanvasElement).width))
    .toBeGreaterThan(300);
  return canvas;
};

test("pong demo auto-plays once scrolled into view", async ({ page }) => {
  const errors: Error[] = [];
  page.on("pageerror", (e) => errors.push(e));

  const canvas = await scrollToPong(page);

  // two snapshots a few frames apart must differ — the CPU rally is running
  const before = await canvas.evaluate((c) => (c as HTMLCanvasElement).toDataURL());
  await page.waitForTimeout(400);
  const after = await canvas.evaluate((c) => (c as HTMLCanvasElement).toDataURL());
  expect(before).not.toEqual(after);
  expect(errors).toEqual([]);
});

test("dragging a handle hands that paddle to the player", async ({ page }) => {
  await scrollToPong(page);
  const handle = page.locator(".pong-handle--left");
  await expect(handle).not.toHaveAttribute("data-live");

  const box = await handle.boundingBox();
  if (!box) throw new Error("handle has no box");
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx, cy + 70, { steps: 6 });

  await expect(handle).toHaveAttribute("data-live", "");
  // the paddle (and its handle) tracked the drag
  await expect.poll(async () => (await handle.boundingBox())?.y ?? 0).toBeGreaterThan(box.y + 35);
  await page.mouse.up();
});

test("arrow keys steer a paddle from the keyboard", async ({ page }) => {
  await scrollToPong(page);
  const handle = page.locator(".pong-handle--right");
  const before = (await handle.boundingBox())?.y ?? 0;

  await handle.focus();
  await page.keyboard.down("ArrowDown");
  await page.waitForTimeout(350);
  await page.keyboard.up("ArrowDown");

  await expect(handle).toHaveAttribute("data-live", "");
  await expect.poll(async () => (await handle.boundingBox())?.y ?? 0).toBeGreaterThan(before + 20);
});

test.describe("reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("pong holds a still frame instead of auto-playing", async ({ page }) => {
    const canvas = await scrollToPong(page);
    const before = await canvas.evaluate((c) => (c as HTMLCanvasElement).toDataURL());
    await page.waitForTimeout(500);
    const after = await canvas.evaluate((c) => (c as HTMLCanvasElement).toDataURL());
    expect(before).toEqual(after);
  });
});
