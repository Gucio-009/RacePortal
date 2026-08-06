#!/bin/sh
#
# backup.sh — periodyczny dump MySQL RacePortal (gzip do /backups).
#
# Po co: uruchamiany w pętli przez serwis `backup` w docker-compose (co ~24h).
# Zrzuca bazę MYSQL_DATABASE (domyślnie raceportal) przez mysqldump, kompresuje,
# trzyma ostatnie 14 plików (usuwa starsze). Chroni dane seed/dev przed awarią volume.
#
# Zmienne (z Compose): MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE.
# Volume: raceportal_backups → /backups w kontenerze.
#
# Pomysł (alt): backup do S3/R2 + retention policy zamiast lokalnego volume.
#
set -e
STAMP=$(date +%Y%m%d_%H%M%S)
OUT=/backups/raceportal_${STAMP}.sql.gz
HOST="${MYSQL_HOST:-mysql}"
USER="${MYSQL_USER:-raceportal}"
PASS="${MYSQL_PASSWORD:-raceportal}"
DB="${MYSQL_DATABASE:-raceportal}"
echo "Backup -> $OUT"
mysqldump -h "$HOST" -u "$USER" -p"$PASS" "$DB" | gzip > "$OUT"
ls -1t /backups/raceportal_*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm -f
echo "Done"
