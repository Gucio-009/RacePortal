#!/usr/bin/env bash
# Uruchamia ≥500 testów jednostkowych @raceportal/api-types i zapisuje wyniki do docs/testy/wyniki/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/docs/testy/wyniki"
mkdir -p "$OUT"
export STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
export STAMP_LOCAL="$(date '+%Y-%m-%d %H:%M:%S %Z')"
export RAW="$OUT/unit-500-raw.json"
export LOG="$OUT/unit-500.log"
export REPORT="$OUT/unit-500-wyniki.md"

cd "$ROOT/packages/api-types"
set +e
npx vitest run --reporter=default --reporter=json --outputFile.json="$RAW" >"$LOG" 2>&1
export CODE=$?
set -e

node <<'NODE'
const fs = require("fs");
const rawPath = process.env.RAW;
const reportPath = process.env.REPORT;
const stamp = process.env.STAMP;
const stampLocal = process.env.STAMP_LOCAL;
const logPath = process.env.LOG;
const code = process.env.CODE;

let data = null;
try {
  data = JSON.parse(fs.readFileSync(rawPath, "utf8"));
} catch {
  data = null;
}

const tests =
  data?.testResults?.flatMap((f) =>
    (f.assertionResults || []).map((a) => ({
      file: f.name,
      title: [...(a.ancestorTitles || []), a.title].filter(Boolean).join(" › "),
      status: a.status,
      duration: a.duration ?? 0,
      failure: (a.failureMessages || [])[0] || null,
    })),
  ) || [];

const passed = tests.filter((t) => t.status === "passed").length;
const failed = tests.filter((t) => t.status === "failed").length;
const skipped = tests.filter((t) => t.status === "skipped" || t.status === "pending").length;
const total = tests.length;
const ok = Number(code) === 0 && failed === 0;

const lines = [];
lines.push("# Wyniki 500+ testów jednostkowych — `@raceportal/api-types`");
lines.push("");
lines.push(`**Data (lokalna):** ${stampLocal}`);
lines.push(`**Data (UTC):** ${stamp}`);
lines.push(`**Werdykt:** ${ok ? "✅ PASS" : "❌ FAIL"}`);
lines.push("");
lines.push("## Podsumowanie");
lines.push("");
lines.push("| Metryka | Wartość |");
lines.push("|--------|---------|");
lines.push(`| Łącznie przypadków | **${total}** |`);
lines.push(`| PASS | **${passed}** |`);
lines.push(`| FAIL | **${failed}** |`);
lines.push(`| SKIP | ${skipped} |`);
lines.push(`| Exit code Vitest | ${code} |`);
lines.push(`| Czas (ms, suma assertion) | ${tests.reduce((s, t) => s + (t.duration || 0), 0).toFixed(0)} |`);
lines.push("");
lines.push("## Zakres");
lines.push("");
lines.push("- `carMatchesEventCategory` / aliasy / normalizacja PL (w tym **ł**)");
lines.push("- `partitionCarsForEvent`, `formatCarLabel`");
lines.push("- `EVENT_CATEGORY_GROUPS`, `ALL_EVENT_CATEGORIES`, `CAR_CLASS_OPTIONS`");
lines.push("- awatary: `AVATAR_PRESETS`, `findAvatarPreset`, `userInitials`");
lines.push("- statusy: `eventStatusLabel`, `registrationStatusLabel`, `isOpenRegistration`, `isPositiveRegistration`");
lines.push("- `formatEntryFee`, `eventImage`, `formatEventDate`, `eventDateLabel`");
lines.push("");
lines.push("## Uruchomienie");
lines.push("");
lines.push("```bash");
lines.push("npm run test:unit");
lines.push("# lub z raportem:");
lines.push("npm run test:unit:report");
lines.push("```");
lines.push("");
lines.push(`Log: \`docs/testy/wyniki/unit-500.log\``);
lines.push(`JSON: \`docs/testy/wyniki/unit-500-raw.json\``);
lines.push("");

if (failed > 0) {
  lines.push("## Nieudane przypadki");
  lines.push("");
  for (const t of tests.filter((x) => x.status === "failed")) {
    lines.push(`### ❌ ${t.title}`);
    lines.push("");
    lines.push("```");
    lines.push((t.failure || "brak komunikatu").slice(0, 2000));
    lines.push("```");
    lines.push("");
  }
}

lines.push("## Pełna lista wyników");
lines.push("");
lines.push("| # | Status | Przypadek | ms |");
lines.push("|---|--------|-----------|----|");
tests.forEach((t, i) => {
  const icon = t.status === "passed" ? "✅" : t.status === "failed" ? "❌" : "⏭";
  const title = t.title.replace(/\|/g, "\\|");
  lines.push(`| ${i + 1} | ${icon} ${t.status} | ${title} | ${(t.duration || 0).toFixed(1)} |`);
});
lines.push("");
lines.push("---");
lines.push("");
lines.push("*Wygenerowano automatycznie przez `scripts/run-unit-500.sh`.*");

fs.writeFileSync(reportPath, lines.join("\n"), "utf8");
console.log(`Wrote ${reportPath} (${total} tests, pass=${passed}, fail=${failed})`);
process.exit(ok ? 0 : 1);
NODE
