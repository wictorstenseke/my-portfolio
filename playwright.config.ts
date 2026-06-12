import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:4173",
    colorScheme: "light",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // WebKit mirrors Safari/iOS — where every regression so far has lived
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    // test against the production build, not the dev server. CI has already
    // built (and deploys that same dist), so don't rebuild there
    command: process.env.CI
      ? "npm run preview -- --port 4173 --strictPort"
      : "npm run build && npm run preview -- --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
