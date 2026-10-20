#!/usr/bin/env bash
#
# test-api.sh — uruchamia testy API backendu (JUnit + MockMvc / Spring Boot).
#
# Po co: szybka weryfikacja warstwy REST bez ręcznego curlowania. Preferuje lokalny
# Java + ./mvnw (Testcontainers może sam podnieść MySQL). Gdy na hoście nie ma Javy
# (np. czyste środowisko Docker-only), odpala Maven w kontenerze podpiętym do sieci
# Compose, żeby trafić w serwis `mysql`.
#
# WAŻNE — baza raceportal_test:
# Testy Hibernate często używają create-drop / ddl-auto. Gdyby celowały w główną
# bazę Compose (`raceportal`), wyczyściłyby dane deweloperskie (seed). Dlatego
# tworzymy osobną DB `raceportal_test` i ustawiamy TEST_DB_URL na nią.
#
# Wymagania (ścieżka Docker): `docker compose up -d mysql` (sieć raceportal*default).
#
# Pomysł (alt): zawsze Testcontainers na hoście; albo osobny docker-compose.test.yml.
#
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
# Osobna baza testowa — create-drop NIE może czyścić głównej bazy Compose (`raceportal`).
docker exec raceportal-mysql mysql -uroot -proot -e \
  "CREATE DATABASE IF NOT EXISTS raceportal_test; GRANT ALL ON raceportal_test.* TO 'raceportal'@'%'; FLUSH PRIVILEGES;" \
  >/dev/null

exec docker run --rm \
  --network "$NETWORK" \
  -v "$ROOT/backend:/app" \
  -w /app \
  -e TEST_DB_URL='jdbc:mysql://mysql:3306/raceportal_test?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC' \
  -e TEST_DB_USER=raceportal \
  -e TEST_DB_PASSWORD=raceportal \
  maven:3.9.9-eclipse-temurin-21 \
  ./mvnw test "$@"
