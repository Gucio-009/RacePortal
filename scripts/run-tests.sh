#!/usr/bin/env bash
# Uruchamia pełny zestaw testów RacePortal i zapisuje wyniki pod docs/testy/wyniki/
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

# Preflight
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
