#!/usr/bin/env bash
# install-docker-prune-cron.sh — codziennie o 04:15 UTC czyści stare obrazy/cache.
# Uruchom raz na VM: sudo bash deploy/vm/install-docker-prune-cron.sh
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Uruchom jako root: sudo bash $0" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRUNE="${SCRIPT_DIR}/docker-prune.sh"
LOG="/var/log/raceportal-docker-prune.log"
CRON_MARKER="raceportal-docker-prune"

if [[ ! -x "$PRUNE" ]]; then
  chmod +x "$PRUNE"
fi

# Idempotentnie: usuń starą linię z markerem, dodaj świeżą.
EXISTING="$(crontab -l 2>/dev/null || true)"
FILTERED="$(printf '%s\n' "$EXISTING" | grep -v "$CRON_MARKER" || true)"
{
  printf '%s\n' "$FILTERED"
  echo "15 4 * * * $PRUNE >>$LOG 2>&1 # $CRON_MARKER"
} | grep -v '^$' | crontab -

touch "$LOG"
chmod 644 "$LOG"

echo "Zainstalowano cron (codziennie 04:15):"
crontab -l | grep "$CRON_MARKER"
echo "Log: $LOG"
echo "Jednorazowy prune teraz: sudo bash $PRUNE"
