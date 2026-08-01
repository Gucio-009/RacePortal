# RacePortal

Centralny katalog wydarzeń motorsportowych w Polsce.

Branch roboczy: **`wojtek`** · repo: [Gucio-009/RacePortal](https://github.com/Gucio-009/RacePortal)

## Struktura repozytorium

| Katalog | Opis |
|---------|------|
| [`web/`](./web/) | Aplikacja webowa (Vite + React) |
| [`backend/`](./backend/) | API (Express + Prisma + PostgreSQL) |
| [`mobile/`](./mobile/) | Aplikacja mobilna (Expo) |
| [`docs/`](./docs/) | Dokumentacja projektu i dyplomu |
| [`tests/e2e/`](./tests/e2e/) | Testy E2E Playwright |
| [`scripts/`](./scripts/) | Backup DB + uruchamianie testów |

Pełny indeks dokumentów: [`docs/README.md`](./docs/README.md)

## Jak odpalić lokalnie (Docker)

### 1. Wymagania

- zainstalowany [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Docker Desktop włączony

### 2. Pobierz projekt

```bash
git clone -b wojtek https://github.com/Gucio-009/RacePortal.git
cd RacePortal
```

### 3. Uruchom

```bash
docker compose up --build -d
```

### 4. Otwórz w przeglądarce

| Co | Adres |
|----|--------|
| Aplikacja | http://127.0.0.1:8081/ |
| Logowanie | http://127.0.0.1:8081/login |
| API health | http://127.0.0.1:8081/api/health |
| Maile (Mailpit) | http://127.0.0.1:8025/ |

### 5. Konta testowe

| Rola | Email | Hasło |
|------|-------|-------|
| Admin | `admin@raceportal.pl` | `admin123` |
| Organizator | `org@raceportal.pl` | `org123` |
| Kierowca | `test@wp.pl` | `test123` |

### 6. Zatrzymanie

```bash
docker compose down
```

---

## Aplikacja mobilna

```bash
docker compose up -d
cd mobile && npm install && npm start
```

Expo web (także pod E2E): `npx expo start --web --port 8082`  
Szczegóły: [`mobile/README.md`](./mobile/README.md)

---

## Testy automatyczne

Ostatni przebieg: **51 / 51 PASS** — szczegóły w [`docs/testy/`](./docs/testy/TESTY.md).

```bash
docker compose up -d
cd mobile && npx expo start --web --port 8082   # terminal 2

npm --prefix backend test
npm --prefix mobile test
npx playwright test
# albo: npm run test:report
```

---

## Dokumentacja

| Plik | Zawartość |
|------|-----------|
| [`docs/MVP.md`](./docs/MVP.md) | Zakres MPC: miało być / jest / zrobione / luki |
| [`docs/changes.md`](./docs/changes.md) | Chronologia prac |
| [`docs/testy/TESTY.md`](./docs/testy/TESTY.md) | Testy automatyczne |
| [`docs/Guidelines.md`](./docs/Guidelines.md) | Wytyczne |
| [`docs/ATTRIBUTIONS.md`](./docs/ATTRIBUTIONS.md) | Licencje / atrybucje |
