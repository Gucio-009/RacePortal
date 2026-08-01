#!/bin/sh
set -e
STAMP=$(date +%Y%m%d_%H%M%S)
OUT=/backups/raceportal_${STAMP}.sql.gz
echo "Backup -> $OUT"
pg_dump "$DATABASE_URL" | gzip > "$OUT"
# keep last 14 backups
ls -1t /backups/raceportal_*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm -f
echo "Done"
