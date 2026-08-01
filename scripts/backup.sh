#!/bin/sh
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
