/**
 * playwright.config.ts — konfiguracja E2E RacePortal (Playwright Test).
 *
 * Pokrywa:
 *   - web-desktop / web-mobile-viewport → tests/e2e/web.spec.ts (baseURL web :8081)
 *   - mobile-expo → tests/e2e/mobile.spec.ts (Expo web preview :8082)
 *
 * Raporty lądują w docs/testy/wyniki/ (html + json + junit) — spójnie z run-tests.sh.
 * Workers=1, fullyParallel=false: unika wyścigów o wspólne konto seed / stan UI.
 *
 * Nadpisania URL: WEB_BASE_URL, MOBILE_BASE_URL (np. staging).
 *
 * Pomysł (alt): webServer: { command: 'npm run dev' } auto-start zamiast wymagać Compose;
 * albo osobne projekty per przeglądarka (Firefox/WebKit) w CI matrix.
 */
import { defineConfig, devices } from "@playwright/test";

const WEB = process.env.WEB_BASE_URL || "http://127.0.0.1:8081";
const MOBILE = process.env.MOBILE_BASE_URL || "http://127.0.0.1:8082";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "docs/testy/wyniki/playwright-report" }],
    ["json", { outputFile: "docs/testy/wyniki/playwright-results.json" }],
    ["junit", { outputFile: "docs/testy/wyniki/playwright-junit.xml" }],
  ],
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "web-desktop",
      testMatch: /web\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: WEB },
    },
    {
      name: "web-mobile-viewport",
      testMatch: /web\.spec\.ts/,
      use: { ...devices["Pixel 7"], baseURL: WEB },
    },
    {
      name: "mobile-expo",
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices["Pixel 7"], baseURL: MOBILE },
    },
  ],
});
