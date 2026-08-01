# RacePortal

Centralny katalog wydarzeń motorsportowych w Polsce.

Branch roboczy: **`wojtek`** · repo: [Gucio-009/RacePortal](https://github.com/Gucio-009/RacePortal)

## Jak odpalić lokalnie (Docker)

### 1. Wymagania

- zainstalowany [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Docker Desktop włączony (ikona wieloryba działa)

### 2. Pobierz projekt

```bash
git clone -b wojtek https://github.com/Gucio-009/RacePortal.git
cd RacePortal
```

### 3. Uruchom

```bash
docker compose up --build -d
```

Pierwszy build może potrwać kilka minut.

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

## Aplikacja mobilna (uproszczona)

Expo — logowanie, lista wydarzeń, szczegóły, zapis.

```bash
# najpierw Docker (API na :4000)
docker compose up -d

cd mobile
npm install
npm start
```

Podgląd web (potrzebny też do E2E): `npx expo start --web --port 8082`  
Szczegóły: [`mobile/README.md`](./mobile/README.md)

---

## Testy automatyczne (praca dyplomowa)

Ostatni przebieg (**2026-08-01**): **51 / 51 PASS** (API 20 + mobile unit 2 + Playwright E2E 29).

| Dokument | Opis |
|----------|------|
| [`docs/TESTY.md`](./docs/TESTY.md) | Metodyka, przypadki testowe, uruchomienie |
| [`docs/wyniki-testow/podsumowanie.md`](./docs/wyniki-testow/podsumowanie.md) | Werdykt i tabele wyników |
| [`changes.md`](./changes.md) | Historia zmian (sekcja 10 — testy) |
| [`MVP.md`](./MVP.md) | Plan vs stan MVP |

```bash
docker compose up -d
cd mobile && npx expo start --web --port 8082   # terminal 2 — pod E2E mobile

npm --prefix backend test      # 20 testów API
npm --prefix mobile test       # 2 testy unit mobile
npx playwright test            # 29 testów E2E (web + mobile)
# albo: npm run test:report
```

---

## Dokumentacja

| Plik | Zawartość |
|------|-----------|
| [`MVP.md`](./MVP.md) | Zakres MPC: miało być / jest / zrobione / luki / ponad MVP |
| [`changes.md`](./changes.md) | Chronologia prac |
| [`docs/TESTY.md`](./docs/TESTY.md) | Testy automatyczne |
| [`guidelines/Guidelines.md`](./guidelines/Guidelines.md) | Wytyczne dla agentów / deweloperów |
| [`ATTRIBUTIONS.md`](./ATTRIBUTIONS.md) | Licencje / atrybucje |
