# RacePortal

Centralny katalog wydarzeń motorsportowych w Polsce.

Branch roboczy: **`wojtek`** · repo: [Gucio-009/RacePortal](https://github.com/Gucio-009/RacePortal)

## Struktura repozytorium

| Katalog | Opis |
|---------|------|
| [`web/`](./web/) | Aplikacja webowa (Vite + React) |
| [`backend/`](./backend/) | API (Spring Boot + MySQL + JWT) |
| [`mobile/`](./mobile/) | Aplikacja mobilna (Expo) |
| [`docs/`](./docs/) | Dokumentacja projektu i dyplomu |
| [`tests/e2e/`](./tests/e2e/) | Testy E2E Playwright |
| [`scripts/`](./scripts/) | Backup DB + uruchamianie testów |

Pełny indeks dokumentów: [`docs/README.md`](./docs/README.md)  
**FAQ przeglądu (seed / MySQL / Expo / `.env`):** [`docs/FAQ-przeglad.md`](./docs/FAQ-przeglad.md)

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

Plik [`backend/.env.example`](./backend/.env.example) jest w repo (Compose `env_file`). Nie wymaga kopiowania do `.env` przy `docker compose up`.

Opcjonalnie Google Sign-In: ustaw ten sam Client ID w `GOOGLE_OAUTH_CLIENT_ID` i `VITE_GOOGLE_CLIENT_ID` (patrz `backend/.env.example`, `web/.env.example`), potem `docker compose up --build -d`. Bez kluczy przycisk Google się nie pojawia — logowanie e-mail/hasło działa jak wcześniej.

```bash
docker compose up --build -d
```

**Uwagi o „zdrowiu” usług** (szczegóły i typowe pomyłki → [`docs/FAQ-przeglad.md`](./docs/FAQ-przeglad.md)):

| Usługa | Port | Jak sprawdzić |
|--------|------|----------------|
| Web | 8081 | http://127.0.0.1:8081/ |
| API | 4000 | http://127.0.0.1:4000/api/health (`db: up`) |
| MySQL | **3307** | TCP (nie HTTP). `docker compose ps` → `healthy` |
| Mailpit | 8025 | http://127.0.0.1:8025/ |
| Expo web | 8082 | **poza Compose** — `cd mobile && npx expo start --web --port 8082` |

Seed: klasa `DataInitializer` przy starcie API — pełny opis w FAQ §1.

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

Pełna instrukcja (**macOS** = iOS Simulator / **Windows** = Android Emulator lub Expo web):  
[`mobile/README.md`](./mobile/README.md) · historia: [`docs/mobile.md`](./docs/mobile.md)

```bash
docker compose up -d
cd mobile && npm install && npm start
# Mac: klawisz i   |   Windows: klawisz a   |   web: npx expo start --web --port 8082
```

**Uwaga SDK 57:** Expo Go ze sklepu często jest za stare → błąd *incompatible*. Na Macu użyj Simulatora (`i`), na Windowsie emulatora Androida (`a`).

---

## Testy automatyczne

Ostatni przebieg API (Spring): **20 / 20 PASS** — szczegóły w [`docs/testy/`](./docs/testy/TESTY.md).

```bash
docker compose up -d
cd mobile && npx expo start --web --port 8082   # terminal 2

npm run test:api
npm run test:mobile-unit
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
