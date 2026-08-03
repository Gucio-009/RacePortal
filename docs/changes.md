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
- Testy API: MockMvc + Testcontainers (lub Compose MySQL przez `TEST_DB_URL`)  
- Dokumentacja: `MVP.md`, `changes.md`, `TESTY.md`, `Guidelines.md`, `README.md`  

---

## 6c. Wyrównanie do Dokumentacji dyplomowej — przepływy (2026-08-02)

Skan `Dokumentacja/` (bez „stare wersje”): diagramy przepływu/sekwencji + statusy zgłoszeń.

| Obszar | Zmiana |
|--------|--------|
| Statusy zgłoszeń | `PENDING` → `ACCEPTED` / `CONFIRMED` / `CANCELED` (aliasy APPROVED/REJECTED/CANCELLED) |
| Płatne wydarzenia | pola `paid`, `entryFee`, `bankAccount`, `paymentDeadlineHours`, `freeCancelDays`, `acceptRegistrations` |
| Opłacanie | `POST /api/registrations/{id}/payment-proof` + weryfikacja org. → `CONFIRMED` |
| Anulowanie | kierowca: `POST .../cancel`; org.: `POST /api/events/{id}/cancel` (+ mail, anulacja zgłoszeń) |
| Garaż | `PATCH /api/garage/{id}`; blokada edycji/usuwania przy otwartym zgłoszeniu |
| Rejestracja | kod e-mail (`verify-email` / `resend-code`); `register-organizer` + wniosek admina |
| UI | Dashboard (anuluj/przelew), Garage (edycja), Organizer (płatne, decyzje, anuluj event), Register (OTP) |

Poza kodem MVP (świadomie): bramka płatności online, upload binarny plików, live timing / Project X.

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
| API JUnit (MockMvc) | **22 / 22 PASS** (2026-08-02 — statusy dyplomowe, płatności, anulowania, garaż PATCH, OTP) |
| Mobile unit (historyczny) | **2 / 2 PASS** |
| Playwright E2E (historyczny, Express era) | **29 / 29 PASS** — smoke po migracji: `npx playwright test tests/e2e/web.spec.ts` |

Środowisko API: Compose MySQL (`TEST_DB_URL`) lub Testcontainers, data **2026-08-02**.

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

## 14. Płatne wydarzenia: seed + oznaczenia + filtr (2026-08-02, 08:20–08:26)

**Kontekst / argument:** po wdrożeniu pól płatnych z Dokumentacji lista wyglądała jak „wszystko darmowe” — brakowało widocznych przykładów i sposobu szybkiego znalezienia płatnych startów. Bez seedu i UI kierowca nie widział różnicy między free a paid.

| Godzina | Było | Jest | Dlaczego |
|---------|------|------|----------|
| ~08:20 | Seed pomijał istniejące DB; płatne eventy tylko w kodzie create org. | `ensurePaidDemoEvents()` idempotentnie przy każdym starcie API | Demo musi działać na już zseedowanej bazie (seedFresh się nie powtarza) |
| ~08:21 | Brak stabilnego zestawu płatnych APPROVED | 5 wydarzeń: GT Racing 890 zł, Drift 650 zł, Rally 450 zł, Endurance 1200 zł, Time Attack 320 zł + konto `PL61…` | Realistyczne przykłady do demo przepływu ACCEPTED → proof → CONFIRMED |
| ~08:22 | `GET /api/events` bez filtra płatności | Query `paid=true\|false\|all` (aliasy `1/0`, `paid/free`) w `EventService` | Filtr po stronie API, żeby UI i mobile mogły używać tego samego kontraktu |
| ~08:23 | Karty wydarzeń bez wyróżnienia paid | `PaidEventBadge` (gold gradient + Banknote) + złota ramka karty | Paid ma być **od razu** widoczne bez otwierania szczegółów |
| ~08:24 | Lista `/wydarzenia` tylko q + kategoria | Select: Wszystkie / Płatne / Darmowe | Szybkie wyszukiwanie wpisowych bez scrollowania całej listy |
| ~08:25 | Home + detal bez kontekstu wpisowego | Badge na Home; detal: wpisowe + numer konta po akceptacji | Spójność oznaczeń na całej ścieżce przeglądania → zapis |

**Pliki (główne):** `DataInitializer.java`, `EventService.java`, `EventController.java`, `EventRepository.java`, `PaidEventBadge.tsx`, `EventsPage.tsx`, `HomePage.tsx`, `EventDetailPage.tsx`, `types.ts` (`formatEntryFee`).

**Weryfikacja:** `GET /api/events?paid=true` → 5 pozycji z `paid:true` i `entryFee`; UI na `:8081`.

---

## 15. Garaż vs kategoria wydarzenia: proponowane auta + seed (2026-08-02, 08:27–08:31)

**Kontekst / argument:** przy zapisie lista aut była płaska — kierowca nie widział, które auto pasuje do klasy wyścigu (np. Drift). Stare seedowe auta miały klasy `GT4`/`Cup`, a eventy `Drift`/`GT Racing`, więc dopasowanie było niemożliwe „na oko”. Brakowało też kompletnego garażu demo na `test@wp.pl`.

| Godzina | Było | Jest | Dlaczego |
|---------|------|------|----------|
| ~08:27 | `className` dowolny tekst; seed 2 auta GT4/Cup | Kategorie jak eventy: Drift, GT Racing, Rally, Endurance, Time Attack, Racing, Track Day, MPWS | Jedna semantyka auto↔wydarzenie; mniej pomyłek przy zgłoszeniu |
| ~08:28 | Brak logiki „pasuje / nie pasuje” | `web/src/app/lib/carMatch.ts` — match + aliasy (np. GT4/Cup → GT Racing) | Legacy klasy ze starego seedu nadal działają; nie trzeba kasować starych aut |
| ~08:28 | Select aut: jedna lista | Grupy: **Proponowane / zalecane** + Pozostałe; licznik „Dopasowane do {kategoria}: N / M” | Od razu widać ile aut nadaje się do danego wyścigu |
| ~08:29 | Brak auto-wyboru | Domyślnie pierwsze zalecane auto; reset przy zmianie eventu | Mniej klików; mniej zgłoszeń z „złym” autem przypadkiem |
| ~08:29 | Garaż: pole „Klasa” jako Input | Select kategorii + etykieta „Kategoria / klasa” | Spójność z kategoriami wydarzeń przy dodawaniu auta |
| ~08:30 | Seed garażu tylko w `seedFresh` (raz) | `ensureDemoGarageCars()` przy każdym starcie — 8 aut (1/kategorię) na `test@wp.pl` | Istniejąca DB też dostaje komplet; demo bez ręcznego CRUD |
| ~08:30 | Upsert eventów po nazwie; brak upsertu aut | `CarRepository.findFirstByUser_IdAndMakeIgnoreCaseAndModelIgnoreCase` | Idempotentny seed bez duplikatów przy restartach |

**Pliki (główne):** `DataInitializer.java`, `CarRepository.java`, `carMatch.ts`, `EventDetailPage.tsx`, `GaragePage.tsx`.

**Weryfikacja:** login `test@wp.pl` → `/garaz` (8+ aut z kategoriami); detal Drift → „Proponowane” = Nissan Silvia S15; licznik dopasowanych > 0.

---

## 16. Zasada dokumentowania zmian (od 2026-08-02, 08:31)

Na prośbę właściciela projektu wpisy w `docs/changes.md` **zawsze**:

1. mają **datę + godzinę** (nie sam dzień) — zakres godzin jeśli praca trwała dłużej,  
2. opisują **historię z argumentami**: *było → jest → dlaczego*,  
3. są synchronizowane z `docs/MVP.md` (sekcje 3–6 + data synchronizacji).

Szczegóły także w [`Guidelines.md`](./Guidelines.md).

---

## 17. Kategoria wydarzenia: select + „Inne” (2026-08-02, 09:15)

**Kontekst / argument:** przy tworzeniu wydarzenia kategoria była wolnym `Input` — łatwo o literówki (`drift` vs `Drift`) i niespójne filtry. Organizator potrzebuje szybkiego wyboru ze znanych klas + wyjścia awaryjnego na niestandardową nazwę.

| Godzina | Było | Jest | Dlaczego |
|---------|------|------|----------|
| 09:15 | Pole tekstowe „Kategoria” | `Select` z listą (stałe `CAR_CATEGORIES` ∪ `/api/events/meta/categories`) + opcja **Inne…** z dodatkowym inputem | Spójne kategorie z listą/filtrami; „Inne” nie blokuje nietypowych klas |

**Pliki:** `OrganizerPanelPage.tsx`.

**Weryfikacja:** `/organizer` → Nowe wydarzenie → wybór Drift / GT Racing… albo Inne + własna nazwa.

---

## 18. Formularz wydarzenia „wyklikaj zamiast wpisywać” (2026-08-02, 09:17–09:20)

**Kontekst / argument:** tworzenie wydarzenia wymagało dużo ręcznego wpisywania (tor, miasto, województwo, lat/lng, URL zdjęcia, godziny, kwoty). To spowalniało organizatora i generowało literówki. Cel: ścieżka happy-path prawie bez klawiatury — tylko nazwa + opis do wpisania.

| Godzina | Było | Jest | Dlaczego |
|---------|------|------|----------|
| 09:17 | Kategoria select + reszta Input | Selekty: kategoria, godzina, tor, miasto, województwo (+ Inne…) | Spójne wartości, mniej błędów |
| 09:18 | Tor / miasto / woj. osobno | Wybór toru **auto-uzupełnia** miasto, województwo i współrzędne | Jedno kliknięcie zamiast 4 pól |
| 09:18 | URL zdjęcia na ślepo | Siatka 8 miniaturek do kliknięcia (+ własny URL) | Wizualny wybór bez kopiowania linków |
| 09:19 | Lat/lng zawsze widoczne | Schowane w „Współrzędne mapy (opcjonalnie)” | Nie straszą przy basic create |
| 09:19 | Wpisowe / terminy jako free number | Chipy kwot + select terminów anulacji/wpłaty; przycisk konta demo | Szybkie ustawienie płatności |

**Pliki:** `eventFormPresets.ts` (nowy), `OrganizerPanelPage.tsx`, `changes.md`, `MVP.md`.

**Weryfikacja:** `/organizer` → Nowe wydarzenie → wybór toru wypełnia lokalizację; zdjęcie z miniatury; płatne → chip 650 zł.

---

## 19. Pinezka lokalizacji przy tworzeniu wydarzenia (2026-08-02, 09:21)

**Kontekst / argument:** współrzędne były ukryte jako liczby lat/lng — organizator nie widział miejsca na mapie. Po wyborze toru lokalizacja szła do API, ale bez wizualnego potwierdzenia. Potrzeba: kliknięcie pinezki + auto-ustawienie po wyborze toru.

| Godzina | Było | Jest | Dlaczego |
|---------|------|------|----------|
| 09:21 | Lat/lng w zwiniętym „opcjonalnie” | Widoczna mapa Leaflet w formularzu (`LocationMapPicker`) | Lokalizacja „na oko”, nie przez liczby |
| 09:21 | Tor wypełniał tylko pola tekstowe coords | Tor **przesuwa pinezkę** (`flyTo`) na preset toru | Jedno kliknięcie toru = gotowa lokalizacja na mapie |
| 09:21 | Brak ręcznego pinu | Klik mapy + przeciąganie markera aktualizuje lat/lng | Korekta miejsca paddocku / parkingu bez kalkulatora GPS |

**Pliki:** `LocationMapPicker.tsx` (nowy), `OrganizerPanelPage.tsx`.

**Weryfikacja:** `/organizer` → Nowe wydarzenie → wybierz „Tor Poznań” → mapa leci na Poznań; klik w inne miejsce przesuwa pinezkę.

---

## 20. Toast zamykalny (X) (2026-08-02, 09:33)

**Kontekst / argument:** powiadomienie „Zalogowano…” w prawym górnym rogu zasłaniało menu profilu zbyt długo i nie dało się go zamknąć.

| Godzina | Było | Jest | Dlaczego |
|---------|------|------|----------|
| 09:33 | Toast bez przycisku zamknięcia, domyślny długi czas | `Toaster` z `closeButton` + `duration={3500}` | Można od razu kliknąć X i wejść w profil |

**Pliki:** `App.tsx`.

---

## 21. Uwagi przeglądu — P0–P4 (2026-08-03, 09:11–09:20)

**Kontekst / argument:** feedback recenzenta (Compose `.env.example`, seed, MySQL/Expo „down”, ubogie filtry, brak 3 widoków, kategorie, self-demote admina, brak edycji eventu, formularze vs Specyfikacja, galeria).

| Godzina | Było | Jest | Dlaczego |
|---------|------|------|----------|
| 09:11 | `.env.*` w gitignore blokował `.env.example` | `!.env.example` + plik w repo; docs seed/MySQL/Expo | Compose nie pada przy clone |
| 09:12 | Admin mógł odebrać sobie rolę | Blokada self-demote + ostatni ADMIN; UI disabled | Nie da się zablokować systemu |
| 09:14 | Filtry: q/kategoria/paid; osobna mapa | Lista/mapa/kalendarz + woj./miasto/tor/daty/auto z garażu | Spełnia uwagi o filtrach i 3 widokach |
| 09:16 | Płaskie kategorie Drift/GT… | Hierarchia Rajdy/Wyścigi/Drift/Inne + edycja eventu (PATCH UI) | Zgodność z listą kategorii + brakująca edycja |
| 09:17 | Formularze uproszczone vs Specyfikacja | Pola profilu, garaż V3 (napęd/KM/OC/PT…), event end/bilety/wymogi | Alignment ze Specyfikacją Formularzy |
| 09:18 | Galeria w nav jak pełny feature | Oznaczenie „później” / deferred; `/mapa` → `/wydarzenia` | Galeria odłożona; mapa w widoku wydarzeń |

**Seed (odpowiedź):** `DataInitializer` przy starcie API (`SEED_ENABLED`).  
**FAQ dla kolejnych czytających (żeby pytania się nie powtarzały):** [`FAQ-przeglad.md`](./FAQ-przeglad.md).

---

## 22. FAQ przeglądu — jedno miejsce na powtarzające się pytania (2026-08-03, 09:21)

**Kontekst / argument:** te same pytania (seed, MySQL HTTP, Expo, `.env.example`) wracały od kolejnych osób przeglądających. Potrzebny kanoniczny dokument zamiast rozproszonych wzmianek w README/Guidelines.

| Godzina | Było | Jest | Dlaczego |
|---------|------|------|----------|
| 09:21 | Odpowiedzi rozrzucone / łatwe do przeoczenia | [`docs/FAQ-przeglad.md`](./FAQ-przeglad.md) + linki z README / docs/README / Guidelines | Jedno źródło prawdy; mniej duplikatów ticketów |

---

*Ostatnia aktualizacja: 2026-08-03 09:21 — FAQ przeglądu.*
