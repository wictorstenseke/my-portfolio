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

test("pong demo plays from page load, without scrolling to it", async ({ page }) => {
  const errors: Error[] = [];
  page.on("pageerror", (e) => errors.push(e));

  await page.goto("/");
  // no scrolling — the rally must already be running below the fold
  const canvas = page.locator(".pong-canvas");
  await expect
    .poll(() => canvas.evaluate((c) => (c as HTMLCanvasElement).width))
    .toBeGreaterThan(300);

  // two snapshots a few frames apart must differ — the CPU rally is running
  const before = await canvas.evaluate((c) => (c as HTMLCanvasElement).toDataURL());
  await page.waitForTimeout(400);
  const after = await canvas.evaluate((c) => (c as HTMLCanvasElement).toDataURL());
  expect(before).not.toEqual(after);
  expect(errors).toEqual([]);
});

test("grabbing the paddle itself (not the handle) also takes over", async ({ page }) => {
  await scrollToPong(page);
  const canvas = page.locator(".pong-canvas");
  const handle = page.locator(".pong-handle--left");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("canvas has no box");

  // press inside the left paddle column, mid-arena
  const x = box.x + box.width * 0.05 + 6;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 60, { steps: 6 });

  await expect(handle).toHaveAttribute("data-live", "");
  await page.mouse.up();
});

test("dragging a handle hands that paddle to the player", async ({ page }) => {
  await scrollToPong(page);
  const handle = page.locator(".pong-handle--left");
  await expect(handle).not.toHaveAttribute("data-live");

  const box = await handle.boundingBox();
  const arena = await page.locator(".pong-canvas").boundingBox();
  if (!box || !arena) throw new Error("missing boxes");
  const cx = box.x + box.width / 2;
  const targetY = arena.y + arena.height / 2; // mid-arena is never clamped
  await page.mouse.move(cx, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(cx, targetY, { steps: 6 });

  await expect(handle).toHaveAttribute("data-live", "");
  // the paddle (and its riding handle) settled onto the pointer
  await expect
    .poll(async () => {
      const b = await handle.boundingBox();
      return b ? Math.abs(b.y + b.height / 2 - targetY) : 999;
    })
    .toBeLessThan(30);
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

test("cpu-vs-cpu demo keeps no score and shows no list", async ({ page }) => {
  await scrollToPong(page);
  await page.waitForTimeout(600); // let the demo rally run a moment
  await expect(page.locator(".pong-scores")).toBeEmpty();
  await expect(page.locator(".pong-scores")).toBeHidden();
});

test("stored best rallies render beneath the arena on load", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "pong-scores",
      JSON.stringify([
        { s: 12, t: 1749722400000 },
        { s: 7, t: 1749722400000 },
        { s: 3, t: 1749722400000 },
      ]),
    );
  });
  await scrollToPong(page);

  const scores = page.locator(".pong-scores");
  await expect(scores).toBeVisible();
  await expect(scores.locator("li")).toHaveCount(3);
  // sorted: the reigning best comes first
  await expect(scores.locator("li b").first()).toHaveText("12");
  await expect(scores.getByText("best rallies")).toBeVisible();
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
