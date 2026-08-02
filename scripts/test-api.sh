#!/usr/bin/env bash
# Uruchamia testy API (JUnit + MockMvc). Preferuje lokalny Java+./mvnw + Testcontainers;
# bez Javy używa kontenera Maven podłączonego do sieci Compose (MySQL).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

if command -v java >/dev/null 2>&1 && java -version >/dev/null 2>&1; then
  exec ./mvnw test "$@"
fi

NETWORK="$(docker network ls --format '{{.Name}}' | grep -E 'raceportal.*default' | head -n1 || true)"
if [ -z "$NETWORK" ]; then
  echo "Brak sieci Docker Compose (raceportal*). Uruchom: docker compose up -d mysql" >&2
  exit 1
fi

echo "Java niedostępna na hoście — testy w kontenerze Maven (sieć: $NETWORK)"
exec docker run --rm \
  --network "$NETWORK" \
  -v "$ROOT/backend:/app" \
  -w /app \
  -e TEST_DB_URL='jdbc:mysql://mysql:3306/raceportal?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC' \
  -e TEST_DB_USER=raceportal \
  -e TEST_DB_PASSWORD=raceportal \
  maven:3.9.9-eclipse-temurin-21 \
  ./mvnw test "$@"
