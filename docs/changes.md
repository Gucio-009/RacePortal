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

Stack zgodny z dokumentacją dyplomową (React + Spring Boot + MySQL + Docker + Maven), stan na **2026-08-01**: `web` + `api` + `mysql` + Mailpit + `backup`.

### Usługi (`docker-compose.yml`)

| Serwis | Port | Rola |
|--------|------|------|
| `web` | **8081→80** | Frontend (nginx) + proxy `/api` → api |
| `api` | **4000** | Spring Boot 3 (Java 21) + JWT |
| `mysql` | **3307→3306** | MySQL 8 |
| `mailhog` | **8025** UI / **1025** SMTP | Mailpit (maile systemowe) |
| `backup` | — | codzienny `mysqldump` (`scripts/backup.sh`) |

### Backend (`backend/`)

- Spring Boot 3.3, Spring Security JWT, JPA/Hibernate, Bean Validation, JavaMail  
- Encje MVP: User (role USER / ORGANIZER / ADMIN), Car, Event, Registration, OrganizerApplication  
- Błędy API: `{ "error": "...", "details"?: ... }`  
- Auto-archiwizacja minionych wydarzeń `APPROVED` → `ARCHIVED`  
- Seed: 3 konta + wydarzenia demo (approved / pending / archived)  

### API (skrót)

| Prefiks | Zakres |
|---------|--------|
| `/api/health` | health + DB |
| `/api/auth` | register, login, me, patch me, password, forgot-password |
| `/api/events` | lista (filtry, paginacja), szczegóły, create/patch |
| `/api/garage` | lista / create / delete aut kierowcy |
| `/api/registrations` | zgłoszenia + statusy + maile |
| `/api/admin` | stats, users/roles, pending events, wnioski org. |
| `/api/organizer` | wniosek o rolę, lista wydarzeń org. |
| `/api/maps` | trasa: OSRM (Google key opcjonalnie) |

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

### Zgodność z Dokumentacją (Downloads)

- DZW/SWS: stack **React.js + Spring Boot (REST) + MySQL + Docker + Maven**, JWT, role ADMIN / ORGANIZER / USER (kierowca)  
- ERD w docs jest bardziej znormalizowany (roles, organizers, categories, locations, regions) — w MVP zachowano prostszy model JPA + **ten sam kontrakt JSON `/api/*`**, żeby web/Expo działały bez zmian  

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

---

## 6b. Migracja Express/Postgres → Spring/MySQL (2026-08-01)

- Usunięto Node/Express/Prisma z `backend/`  
- Dodano Maven/`pom.xml` + `./mvnw`, Dockerfile multi-stage (Temurin 21), profile `docker`  
- Compose: `postgres` → `mysql:8.4` (host **3307**), backup → `mysqldump`  
- Testy API: MockMvc + Testcontainers (lub Compose MySQL przez `TEST_DB_URL`) — **20/20 PASS** (`docs/testy/wyniki/`)  
- Dokumentacja: `MVP.md`, `changes.md`, `TESTY.md`, `Guidelines.md`, `README.md`  

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

Pełny zestaw testów dla **API**, **web** i **mobile** (po migracji API = Spring Boot).

### Narzędzia

| Warstwa | Narzędzie | Pliki |
|---------|-----------|--------|
| API (integracja + unit) | JUnit 5 + MockMvc + Testcontainers | `backend/src/test/java/pl/raceportal/` |
| Mobile (unit) | Vitest | `mobile/tests/unit.client.test.ts` |
| Web + Mobile E2E | Playwright (Chromium) | `tests/e2e/web.spec.ts`, `tests/e2e/mobile.spec.ts` |
| Orkiestracja | skrypt + npm scripts | `scripts/test-api.sh`, `scripts/run-tests.sh`, `package.json` |

### Wynik ostatniego przebiegu (API Spring)

| Zestaw | Wynik |
|--------|-------|
| API JUnit (MockMvc) | **20 / 20 PASS** |
| Mobile unit (historyczny) | **2 / 2 PASS** |
| Playwright E2E (historyczny, Express era) | **29 / 29 PASS** — smoke po migracji: `npx playwright test tests/e2e/web.spec.ts` |

Środowisko API: Docker MySQL + Spring `:4000`, data **2026-08-01**.

### Dokumentacja i artefakty

| Plik | Zawartość |
|------|-----------|
| [`docs/testy/TESTY.md`](./testy/TESTY.md) | Metodyka, piramida, przypadki TC-*, uruchomienie, mapowanie do rozdziału dyplomu |
| [`docs/testy/wyniki/podsumowanie.md`](./testy/wyniki/podsumowanie.md) | Werdykt + tabele wyników |
| `docs/testy/wyniki/*.log` | Logi Surefire / Playwright / Vitest mobile |
| `docs/testy/wyniki/playwright-junit.xml` | JUnit (CI / załącznik) |
| `docs/testy/wyniki/playwright-results.json` | Surowy raport JSON |
| `docs/testy/wyniki/playwright-report/` | Raport HTML Playwright |

### Uruchomienie

```bash
docker compose up -d
cd mobile && npx expo start --web --port 8082   # osobny terminal — E2E mobile

npm run test:api               # JUnit / MockMvc (./mvnw lub Docker Maven)
npm run test:mobile-unit       # unit mobile
npx playwright test            # E2E web + mobile
# albo: npm run test:report    # skrypt zbierający logi do docs/testy/wyniki/
```

### Pokrycie względem MVP

- Funkcje 1–11: pokryte głównie testami API + E2E web (auth, wydarzenia, garaż, RBAC admin/org).  
- #12 mapa, #14 archiwum: E2E web.  
- #15 mobile: unit + E2E Expo web (login, lista, detal, zapis, wylogowanie).  
- #11 maile: poza automatami (weryfikacja Mailpit ręcznie).  
- Brak formalnego testu obciążenia 10k/50 RPS (pozostaje w lukach MVP).

---

## Powiązane dokumenty

- [`MVP.md`](./MVP.md) — porównanie: miało być / jest / zrobione / do zrobienia / ponad MVP  
- [`testy/TESTY.md`](./testy/TESTY.md) — testy automatyczne (dyplom)  
- [`testy/wyniki/podsumowanie.md`](./testy/wyniki/podsumowanie.md) — ostatnie wyniki PASS  
- [`ATTRIBUTIONS.md`](./ATTRIBUTIONS.md) — shadcn/ui, Unsplash, mapa, OSRM  
- [`Guidelines.md`](./Guidelines.md) — wytyczne + obowiązek aktualizacji docs  
- [`README.md`](./README.md) — indeks dokumentacji  
- [`../mobile/README.md`](../mobile/README.md) — Expo mobile  

---

## 11. Porządek katalogów w repo (2026-08-01)

Root był przeładowany plikami `.md`, frontendem i testami. Uporządkowano monorepo:

| Było (root) | Jest |
|-------------|------|
| `src/`, Vite, Dockerfile web | `web/` |
| `MVP.md`, `changes.md`, `ATTRIBUTIONS.md`, `guidelines/` | `docs/` |
| `docs/TESTY.md`, `docs/wyniki-testow/` | `docs/testy/` (+ `wyniki/`) |
| `e2e/` | `tests/e2e/` |
| `pnpm-workspace.yaml` (nieużywane) | usunięte |

Docker: serwis `web` buduje z `./web`. Root `package.json` trzyma tylko orkiestrację testów (Playwright); zależności Vite są w `web/package.json`.

---

## 12. Menu konta: Moje konto / Ustawienia / Wyloguj (2026-08-01)

W headerze po kliknięciu avatara / nazwy użytkownika:

- **Moje konto** → `/dashboard` (profil, starty, garaż)  
- **Ustawienia** → `/ustawienia` (powiadomienia, akcent Gold/Redline/Ice, tryb pit-stop, flair zespołu, confetti)  
- **Wyloguj** → czyści JWT + toast + confetti  

Preferencje ustawień w `localStorage` (`raceportal_settings`).

---

## 13. Dane konta: email / hasło + pewniejsze menu (2026-08-01)

- Menu avatara bez Radix Portal (działa niezawodnie w preview): **Moje konto**, **Dane konta**, **Ustawienia**, **Wyloguj**  
- Nowa strona `/konto` — zmiana username, email, awatara i hasła  
- API: `PATCH /api/auth/me` (email), `POST /api/auth/me/password` (obecne + nowe hasło) + maile potwierdzające  

---

*Ostatnia aktualizacja: 2026-08-01 — dane konta + wylogowanie z menu.*
