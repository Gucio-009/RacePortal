/**
 * Konfiguracja Vitest dla unit testów warstwy mobilnej (bez pełnego runtime Expo).
 *
 * Rola: szybkie testy logiki API / WEB URL / media URL w Node — uzupełnienie E2E Playwright.
 * Alias `@raceportal/api-types` jak w Metro (`metro.config.js`).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@raceportal/api-types": path.resolve(root, "../packages/api-types/src/index.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
