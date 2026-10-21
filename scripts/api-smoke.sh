#!/usr/bin/env bash
#
# api-smoke.sh — szybki check API na VM (health + CORS preflight login).
#
# Użycie:
#   ./scripts/api-smoke.sh http://EXTERNAL_IP:4000 https://www.raceportal.pl
#   ./scripts/api-smoke.sh https://api.raceportal.pl https://www.raceportal.pl
#
set -euo pipefail

API_BASE="${1:-}"
ORIGIN="${2:-https://www.raceportal.pl}"

if [[ -z "$API_BASE" ]]; then
  echo "Usage: $0 <API_BASE_URL> [ORIGIN]" >&2
  echo "  API_BASE_URL  np. http://34.x.x.x:4000  (bez końcowego /)" >&2
  exit 1
fi

API_BASE="${API_BASE%/}"
echo "== health =="
HEALTH=$(curl -sS -m 20 "${API_BASE}/api/health")
echo "$HEALTH"
echo "$HEALTH" | grep -q '"db":"up"' || {
  echo "FAIL: db not up" >&2
  exit 1
}

echo "== CORS OPTIONS /api/auth/login (Origin: ${ORIGIN}) =="
HDRS=$(curl -sS -m 20 -D- -o /dev/null -X OPTIONS \
  "${API_BASE}/api/auth/login" \
  -H "Origin: ${ORIGIN}" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type")
echo "$HDRS" | head -n 20
echo "$HDRS" | grep -qi "access-control-allow-origin: ${ORIGIN}" || {
  echo "FAIL: missing ACAO for ${ORIGIN}" >&2
  exit 1
}

echo "== OK =="
echo "Następnie na Cloudflare Pages ustaw VITE_API_URL=${API_BASE} (Production) i Retry deployment."
