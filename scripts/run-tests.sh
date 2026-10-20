#!/usr/bin/env bash
#
# run-tests.sh — pełny zestaw testów RacePortal + zbiorcze podsumowanie Markdown.
#
# Po co: jeden entrypoint QA — API (JUnit), unit mobile (Vitest), E2E (Playwright
# web + Expo preview). Zapisuje logi i docs/testy/wyniki/podsumowanie.md z werdyktem.
#
# Zakłada działające serwisy (preflight curl na :4000 API, :8081 web, :8082 mobile).
# Bloki fail nie przerywają od razu — zbieramy statusy, exit na końcu.
#
# Pomysł (alt): orchestracja przez npm-run-all / turbo pipeline w CI zamiast jednego basha.
#
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/docs/testy/wyniki"
mkdir -p "$OUT"
STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
SUMMARY="$OUT/podsumowanie.md"

echo "# Wyniki testów automatycznych — RacePortal" > "$SUMMARY"
echo "" >> "$SUMMARY"
echo "**Data uruchomienia (UTC):** $STAMP" >> "$SUMMARY"
echo "" >> "$SUMMARY"

fail=0

section () {
  echo "" | tee -a "$SUMMARY"
  echo "## $1" | tee -a "$SUMMARY"
  echo "" | tee -a "$SUMMARY"
}

# Uruchamia komendę, dopisuje PASS/FAIL + ogon loga do podsumowania.
run_block () {
  local name="$1"
  local logfile="$2"
  shift 2
  section "$name"
  echo '```' >> "$SUMMARY"
  if "$@" >"$logfile" 2>&1; then
    echo "Status: **PASS**" | tee -a "$SUMMARY"
    tail -n 40 "$logfile" | tee -a "$SUMMARY"
  else
    echo "Status: **FAIL**" | tee -a "$SUMMARY"
    tail -n 80 "$logfile" | tee -a "$SUMMARY"
    fail=1
  fi
  echo '```' >> "$SUMMARY"
  echo "" >> "$SUMMARY"
  echo "Log: \`$logfile\`" >> "$SUMMARY"
}

# Preflight — czy stack Compose/dev jest w ogóle dostępny
section "Preflight środowiska"
{
  echo "- API: $(curl -s http://127.0.0.1:4000/api/health || echo DOWN)"
  echo "- Web: HTTP $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8081/ || echo 000)"
  echo "- Mobile Expo web: HTTP $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8082/ || echo 000)"
} | tee -a "$SUMMARY"

run_block "1. Testy API (JUnit / MockMvc + MySQL)" "$OUT/api-surefire.log" \
  bash -lc "'$ROOT/scripts/test-api.sh'"

run_block "2. Testy jednostkowe mobile (Vitest)" "$OUT/mobile-unit.log" \
  bash -lc "cd '$ROOT/mobile' && npx vitest run"

run_block "3. E2E Web + Mobile preview (Playwright)" "$OUT/playwright.log" \
  bash -lc "cd '$ROOT' && npx playwright test"

echo "" >> "$SUMMARY"
echo "## Werdykt" >> "$SUMMARY"
if [ "$fail" -eq 0 ]; then
  echo "**Wszystkie zestawy: PASS**" >> "$SUMMARY"
else
  echo "**Co najmniej jeden zestaw: FAIL — zobacz logi.**" >> "$SUMMARY"
fi

echo "Zapisano podsumowanie: $SUMMARY"
exit "$fail"
