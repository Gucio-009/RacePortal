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
