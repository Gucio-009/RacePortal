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

Stack działa end-to-end (stan na **2026-07-31**): `web` + `api` + `db` + Mailpit + `backup`.

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

*Ostatnia aktualizacja: 2026-07-31 — pełny stack włączony, docs zsynchronizowane.*

## Powiązane dokumenty

- [`MVP.md`](./MVP.md) — **zawsze** porównanie: miało być / jest / zrobione / do zrobienia / ponad MVP  
- [`ATTRIBUTIONS.md`](./ATTRIBUTIONS.md) — shadcn/ui, Unsplash, mapa, OSRM  
- [`guidelines/Guidelines.md`](./guidelines/Guidelines.md) — wytyczne + obowiązek aktualizacji MVP.md
