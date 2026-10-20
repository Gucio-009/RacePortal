/**
 * Konfiguracja Vitest dla unit testów warstwy mobilnej (bez pełnego runtime Expo).
 *
 * Rola w architekturze: szybkie testy logiki API URL / storage tokenu w Node,
 * niezależne od emulatora i Expo Go — uzupełnienie E2E Playwright (Expo web).
 *
 * Technologie: Vitest, środowisko `node`.
 *
 * Pomysł (alt): Jest + `@testing-library/react-native`; Detox/Maestro na urządzeniu.
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
