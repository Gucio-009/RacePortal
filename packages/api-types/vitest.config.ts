/**
 * Konfiguracja Vitest dla pakietu @raceportal/api-types.
 *
 * Środowisko: Node (brak DOM — testujemy czyste funkcje TS).
 * Reporter JSON ląduje w docs/testy/wyniki/unit-500-raw.json, skąd
 * scripts/run-unit-500.sh generuje czytelny raport Markdown.
 *
 * Pomysł (alt): reporter junit.xml pod CI (GitHub Actions) zamiast JSON+skrypt.
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    reporters: ["default", "json"],
    outputFile: {
      json: "../../docs/testy/wyniki/unit-500-raw.json",
    },
  },
});
