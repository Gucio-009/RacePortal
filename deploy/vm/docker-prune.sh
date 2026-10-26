#!/usr/bin/env bash
# docker-prune.sh — czyści stare rebuildy Dockera na Oracle VM.
# Nie rusza volumes (MySQL, uploads, backups).
#
# Ręcznie:  sudo bash deploy/vm/docker-prune.sh
# Cron:     sudo bash deploy/vm/install-docker-prune-cron.sh
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Uruchom jako root: sudo bash $0" >&2
  exit 1
fi

echo "=== docker prune $(date -Is) ==="
echo "-- przed --"
df -h / | awk 'NR==1 || /\/$/'
docker system df

# Zatrzymane kontenery, nieużywane sieci, obrazy niepodpięte do bieżących kontenerów,
# cache BuildKit — to właśnie rośnie po każdym `docker compose up --build`.
docker container prune -f
docker network prune -f
docker image prune -af
docker builder prune -af

echo "-- po --"
df -h / | awk 'NR==1 || /\/$/'
docker system df
echo "=== koniec ==="
