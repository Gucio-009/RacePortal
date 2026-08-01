# RACEPORTAL — zmiany

## Cel

Przenieść design z Figma Make **Advanced UI/UX for RACEPORTAL** na lokalny projekt, uruchomić go w Dockerze, dokończyć placeholdery UI, a następnie dodać backend (API + DB + maile) zgodny z zakresem MVP.

Źródło (wersja finalna):  
https://www.figma.com/make/8I7geuRdBdohCQhIfdBQyQ/Advanced-UI-UX-for-RACEPORTAL

Katalog projektu: `/Users/wojciechwronisz/Desktop/projekty/raceportal`

---

## 1. Znalezienie projektu

- Na koncie Figma był team **RACEPORTAL** (`team::1630596312258795420`).
- Lokalnie nie było repozytorium o tej nazwie.
- Najpierw przez pomyłkę użyto pliku **Advanced UI/UX for RACEPORTAL (Copy)** (`MPGhlUNvuzAvsM66tsA21W`).
- Potem użytkownik wskazał oryginał **Advanced UI/UX for RACEPORTAL** (`8I7geuRdBdohCQhIfdBQyQ`) — to jest baza UI wdrożona lokalnie.

---

## 2. Utworzenie projektu lokalnego

- Katalog: `~/Desktop/projekty/raceportal`
- Inicjalizacja git + przeniesienie workspace Cursor (`move_agent_to_root`)

---

## 3. Pobranie kodu z Figma Make

Przez Figma MCP pobrano źródła Make (Vite/React, strony Home/Login/Register/Dashboard, shadcn UI, Orbitron, `#FFD700`).

Po przełączeniu z Copy na oryginał usunięto pliki wyłącznie z wersji Copy, potem część funkcji (admin, organizator, mapa, garaż) została **przywrócona i podpięta pod realne API**.

---

## 4. Scaffold Vite + Docker frontend

Dodano m.in. `index.html`, `src/main.tsx`, `tsconfig.json`, `Dockerfile`, `nginx.conf`, `.dockerignore`.

Port hosta **8081** (8080 zajęty przez inny projekt).

---

## 5. Dokończenie placeholderów UI

Martwe linki i przyciski z Figma podpięto do tras (`/wydarzenia`, `/archiwum`, `/galeria`, `/mapa`, `/garaz`, `/admin`, `/organizer`, `/terms`, `/privacy`, itd.).

Początkowo dane i auth były lokalne (mock / localStorage) — **zastąpione backendem** (sekcja 6).

---

## 6. Backend + pełny stack Docker (aktualny stan)

Stack działa end-to-end (stan na **2026-08-01**): `web` + `api` + `db` + Mailpit + `backup` + testy automatyczne (patrz sekcja 10).

### Usługi (`docker-compose.yml`)

| Serwis | Port | Rola |
|--------|------|------|
| `web` | **8081→80** | Frontend (nginx) + proxy `/api` → api |
| `api` | **4000** | Express + Prisma + JWT |
| `db` | **5433→5432** | PostgreSQL 16 |
| `mailhog` | **8025** UI / **1025** SMTP | Mailpit (maile systemowe) |
| `backup` | — | codzienny dump (`scripts/backup.sh`) |

### Backend (`backend/`)

- Express 5, Prisma, Zod, bcrypt, helmet, rate limiting, nodemailer  
- Modele: User (role USER / ORGANIZER / ADMIN), Car, Event, Registration, OrganizerApplication  
- Auto-archiwizacja minionych wydarzeń `APPROVED` → `ARCHIVED`  
- Seed odświeża wydarzenia z datami przyszłymi (sezon VIII–XI 2026) + 1 pending + 1 archived  

### API (skrót)

| Prefiks | Zakres |
|---------|--------|
| `/api/health` | health + DB |
| `/api/auth` | register, login, me, forgot-password |
| `/api/events` | lista (filtry, paginacja, cache), szczegóły, CRUD |
| `/api/garage` | CRUD aut kierowcy |
| `/api/registrations` | zgłoszenia + statusy + maile |
| `/api/admin` | stats, users/roles, pending events, wnioski org. |
| `/api/organizer` | wniosek o rolę, lista wydarzeń org. |
| `/api/maps` | trasa: Google Directions lub **OSRM** fallback |

### Frontend pod API

- Auth: JWT w `localStorage` (`raceportal_token`)  
- Strony: Home, wydarzenia, szczegóły (+ trasa GPS), archiwum, galeria, mapa, dashboard, garaż, admin, organizer, zostań organizatorem, legal  

### Konta seed (logowanie)

Wejdź na http://127.0.0.1:8081/login

| Rola | Email | Hasło |
|------|-------|-------|
| Admin | `admin@raceportal.pl` | `admin123` |
| Organizator | `org@raceportal.pl` | `org123` |
| Kierowca | `test@wp.pl` | `test123` |

### Trasy aplikacji

| Ścieżka | Strona | Auth |
|---------|--------|------|
| `/` | Home | — |
| `/login` | Logowanie | — |
| `/register` | Rejestracja | — |
| `/forgot-password` | Reset hasła (mail → Mailpit) | — |
| `/dashboard` | Profil kierowcy | tak |
| `/garaz` | Garaż | tak |
| `/wydarzenia` | Kalendarz | — |
| `/wydarzenia/:id` | Szczegóły + zapis + trasa | — |
| `/archiwum` / `/wyniki` | Archiwum | — |
| `/galeria` | Galeria | — |
| `/mapa` | Mapa Leaflet | — |
| `/admin` | Panel admina | ADMIN |
| `/organizer` | Panel organizatora | ORGANIZER / ADMIN |
| `/zostan-organizatorem` | Wniosek o rolę | zalecane login |
| `/terms`, `/privacy` | Regulamin / RODO | — |

### Uwaga o tymczasowym wyłączeniu backendu

Backend był chwilowo zakomentowany w `docker-compose.yml` (działał tylko `web`). **Ponownie włączony i przebudowany** — bez API logowanie nie działa.

---

## 7. Uruchomienie

```bash
cd ~/Desktop/projekty/raceportal
docker compose up --build -d --remove-orphans
docker compose down
```

| Środowisko | Adres | Status |
|------------|--------|--------|
| Aplikacja | http://127.0.0.1:8081/ | aktywne |
| Logowanie | http://127.0.0.1:8081/login | aktywne |
| API health | http://127.0.0.1:8081/api/health | ok |
| Maile (Mailpit) | http://127.0.0.1:8025/ | aktywne |
| Vite dev (opcjonalnie) | `npm run dev` + API | development |

---

## 8. Ostatnie poprawki (2026-07-31)

- Seed: przyszłe daty wydarzeń (wcześniej lista była pusta przez filtr `date >= dziś`)  
- Archiwum: `ARCHIVED` + minione `APPROVED`; job auto-archiwum  
- Galeria: upcoming + archive  
- RODO: aktualna polityka prywatności + nota przy tworzeniu wydarzenia  
- Mailpit zamiast MailHog (wsparcie arm64)  
- Orphan stary kontener `raceportal` na porcie 8081 — usunięty  

---

## 9. Aplikacja mobilna Expo (2026-08-01)

Uproszczona app w `mobile/`: login, lista wydarzeń, szczegóły, zapis na start.

- Stack: Expo 57 + React Navigation, dark/gold UI  
- CORS: `CORS_ORIGIN` rozszerzone o Expo web (`:8082`); tokeny w `localStorage` na web  
- Docs: [`mobile/README.md`](./mobile/README.md)

---

## 10. Testy automatyczne (2026-08-01) — dokumentacja dyplomowa

Dodano pełny zestaw testów automatycznych dla **API**, **web** i **mobile** wraz z artefaktami do załączenia do pracy dyplomowej.

### Narzędzia

| Warstwa | Narzędzie | Pliki |
|---------|-----------|--------|
| API (integracja) | Vitest + Supertest | `backend/tests/api.integration.test.ts` |
| Mobile (unit) | Vitest | `mobile/tests/unit.client.test.ts` |
| Web + Mobile E2E | Playwright (Chromium) | `e2e/web.spec.ts`, `e2e/mobile.spec.ts` |
| Orkiestracja | skrypt + npm scripts | `scripts/run-tests.sh`, root `package.json` (`test:*`) |

### Wynik ostatniego przebiegu

| Zestaw | Wynik |
|--------|-------|
| API integration | **20 / 20 PASS** |
| Mobile unit | **2 / 2 PASS** |
| Playwright E2E (web-desktop + web-mobile-viewport + mobile-expo) | **29 / 29 PASS** |
| **Razem** | **51 / 51 PASS** |

Środowisko: Docker (API `:4000`, Web `:8081`), Expo web `:8082`, data przebiegu **2026-08-01**.

### Dokumentacja i artefakty

| Plik | Zawartość |
|------|-----------|
| [`docs/TESTY.md`](./docs/TESTY.md) | Metodyka, piramida, przypadki TC-*, uruchomienie, mapowanie do rozdziału dyplomu |
| [`docs/wyniki-testow/podsumowanie.md`](./docs/wyniki-testow/podsumowanie.md) | Werdykt + tabele wyników |
| `docs/wyniki-testow/*.log` | Logi Vitest / Playwright |
| `docs/wyniki-testow/playwright-junit.xml` | JUnit (CI / załącznik) |
| `docs/wyniki-testow/playwright-results.json` | Surowy raport JSON |
| `docs/wyniki-testow/playwright-report/` | Raport HTML Playwright |

### Uruchomienie

```bash
docker compose up -d
cd mobile && npx expo start --web --port 8082   # osobny terminal — E2E mobile

npm --prefix backend test      # API
npm --prefix mobile test       # unit mobile
npx playwright test            # E2E web + mobile
# albo: npm run test:report    # skrypt zbierający logi do docs/wyniki-testow/
```

### Pokrycie względem MVP

- Funkcje 1–11: pokryte głównie testami API + E2E web (auth, wydarzenia, garaż, RBAC admin/org).  
- #12 mapa, #14 archiwum: E2E web.  
- #15 mobile: unit + E2E Expo web (login, lista, detal, zapis, wylogowanie).  
- #11 maile: poza automatami (weryfikacja Mailpit ręcznie).  
- Brak formalnego testu obciążenia 10k/50 RPS (pozostaje w lukach MVP).

---

## Powiązane dokumenty

- [`MVP.md`](./MVP.md) — **zawsze** porównanie: miało być / jest / zrobione / do zrobienia / ponad MVP  
- [`docs/TESTY.md`](./docs/TESTY.md) — testy automatyczne (dyplom)  
- [`docs/wyniki-testow/podsumowanie.md`](./docs/wyniki-testow/podsumowanie.md) — ostatnie wyniki PASS  
- [`ATTRIBUTIONS.md`](./ATTRIBUTIONS.md) — shadcn/ui, Unsplash, mapa, OSRM  
- [`guidelines/Guidelines.md`](./guidelines/Guidelines.md) — wytyczne + obowiązek aktualizacji MVP.md / changes.md  
- [`mobile/README.md`](./mobile/README.md) — Expo mobile  

---

*Ostatnia aktualizacja: 2026-08-01 — testy automatyczne 51/51 PASS, docs zsynchronizowane.*
