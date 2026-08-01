# Testy automatyczne — RacePortal (dokumentacja do projektu dyplomowego)

**Projekt:** RacePortal  
**Branch:** `wojtek`  
**Cel dokumentu:** opis strategii, przypadków testowych, narzędzi oraz sposobu uruchomienia i interpretacji wyników testów automatycznych aplikacji webowej i mobilnej.

---

## 1. Cel i zakres testów

Testy automatyczne mają:

1. potwierdzić poprawność **API backendu** (integracja z bazą i regułami RBAC),  
2. zweryfikować kluczowe ścieżki **aplikacji webowej** (UI + backend),  
3. zweryfikować **uproszczoną aplikację mobilną** (Expo) — ekran logowania, lista wydarzeń, szczegóły,  
4. dostarczyć **powtarzalne dowody** (logi, raporty HTML/JSON/JUnit) do dokumentacji dyplomowej.

### Zakres funkcjonalny pokryty testami

| Obszar MVP | API | Web E2E | Mobile |
|------------|-----|---------|--------|
| 1. Lista wydarzeń | tak | tak | tak |
| 2. Filtry / wyszukiwanie | tak | tak | — |
| 3. Szczegóły wydarzenia | tak | tak | tak |
| 4. Panel admina | tak (RBAC) | tak | — |
| 5. Konto kierowcy / auth | tak | tak | tak |
| 6. Garaż | tak | tak | — |
| 7. Zgłoszenia | tak | częściowo | częściowo (UI przycisk) |
| 8–9. Organizator | tak | tak | — |
| 10. Baza danych | pośrednio (API) | pośrednio | pośrednio |
| 11. Maile | poza automatami (Mailpit ręcznie) | — | — |
| 12. Mapa | — | tak | — |
| 13. Trasa | tak | — | — |
| 14. Archiwum | tak | tak | — |
| 15. Mobile | — | — | tak (Expo web + unit) |

---

## 2. Strategia testowania (piramida)

```
        /\
       /E2E\      Playwright — web (:8081) + mobile preview (:8082)
      /------\
     / Integr.\   Vitest — HTTP API (:4000) przeciw działającemu stackowi Docker
    /----------\
   /   Unit     \ Vitest — logika klienta mobile (token / API_URL)
  /--------------\
```

| Poziom | Narzędzie | Lokalizacja | Co sprawdza |
|--------|-----------|-------------|-------------|
| Unit | Vitest | `mobile/tests/` | storage tokenu, URL API |
| Integration | Vitest | `backend/tests/` | kontrakty REST, auth, RBAC, events, garage, maps |
| E2E | Playwright | `e2e/` | UI użytkownika w przeglądarce (desktop + viewport mobile) |

**Środowisko testowe:** lokalny Docker Compose (Postgres + API + nginx web + Mailpit) oraz opcjonalnie Expo web preview.

---

## 3. Wymagania wstępne

1. Docker Desktop uruchomiony  
2. Stack aplikacji:

```bash
docker compose up --build -d
```

3. (Dla testów mobile E2E) Expo web:

```bash
cd mobile && npx expo start --web --port 8082
```

4. Node.js 20+ oraz zależności:

```bash
npm install
npm --prefix backend install
npm --prefix mobile install
npx playwright install chromium
```

### Konta seed używane w testach

| Rola | Email | Hasło |
|------|-------|-------|
| Kierowca | `test@wp.pl` | `test123` |
| Organizator | `org@raceportal.pl` | `org123` |
| Admin | `admin@raceportal.pl` | `admin123` |

---

## 4. Katalog przypadków testowych

### 4.1. API (`backend/tests/api.integration.test.ts`)

| ID | Opis | Oczekiwany rezultat |
|----|------|---------------------|
| TC-API-01 | Health check | `status=ok`, `db=up` |
| TC-API-02 | Login USER | JWT + `role=USER` |
| TC-API-03 | Login ADMIN | `role=ADMIN` |
| TC-API-04 | Login ORGANIZER | `role=ORGANIZER` |
| TC-API-05 | Złe hasło | HTTP 401 |
| TC-API-06 | `/me` bez tokena | HTTP 401 |
| TC-API-07 | `/me` z tokenem | profil użytkownika |
| TC-API-08 | Rejestracja | HTTP 201 + JWT |
| TC-API-09 | Lista wydarzeń | paginacja, `total≥1` |
| TC-API-10 | Wyszukiwanie `q` | dopasowane rekordy |
| TC-API-11 | Szczegóły po id | pełny obiekt eventu |
| TC-API-12 | Archiwum | rekordy historyczne |
| TC-API-13 | Kategorie | niepusta tablica |
| TC-API-14 | Garaż | lista aut seed |
| TC-API-15 | Zgłoszenie | 200/201 |
| TC-API-16 | Moje zgłoszenia | tablica |
| TC-API-17 | Admin stats RBAC | USER→403, ADMIN→200 |
| TC-API-18 | Organizer events | 200 |
| TC-API-19 | Pending events | 200 (admin) |
| TC-API-20 | Maps route | provider + polyline |

### 4.2. Web E2E (`e2e/web.spec.ts`)

| ID | Opis |
|----|------|
| TC-WEB-01 | Home / hero |
| TC-WEB-02 | Kalendarz z kartami |
| TC-WEB-03 | Filtr wyszukiwania |
| TC-WEB-04 | Szczegóły wydarzenia |
| TC-WEB-05 | Mapa Leaflet |
| TC-WEB-06 | Archiwum |
| TC-WEB-07 | Login → dashboard |
| TC-WEB-08 | Błędne hasło — komunikat |
| TC-WEB-09 | Garaż po zalogowaniu |
| TC-WEB-10 | Panel admina |
| TC-WEB-11 | Panel organizatora |
| TC-WEB-12 | USER nie wchodzi na `/admin` |

Projekty Playwright: **chromium-desktop** oraz **chromium-mobile** (Pixel 7) — te same scenariusze na dwóch viewportach.

### 4.3. Mobile E2E (`e2e/mobile.spec.ts`) — Expo web preview

| ID | Opis |
|----|------|
| TC-MOB-01 | Ekran logowania |
| TC-MOB-02 | Login → lista wydarzeń |
| TC-MOB-03 | Błędne hasło |
| TC-MOB-04 | Szczegóły + „ZAPISZ SIĘ” |
| TC-MOB-05 | Wylogowanie |

### 4.4. Mobile unit (`mobile/tests/unit.client.test.ts`)

| ID | Opis |
|----|------|
| TC-MOB-U01 | Token w `localStorage` na web |
| TC-MOB-U02 | Domyślny `API_URL` zawiera port 4000 |

---

## 5. Uruchomienie

### Pełny przebieg (zalecany do dokumentacji)

```bash
chmod +x scripts/run-tests.sh
./scripts/run-tests.sh
```

Skrypt zapisuje:

| Plik | Zawartość |
|------|-----------|
| `docs/wyniki-testow/podsumowanie.md` | werdykt + skrót logów |
| `docs/wyniki-testow/api-vitest.log` | log API |
| `docs/wyniki-testow/mobile-unit.log` | log unit mobile |
| `docs/wyniki-testow/playwright.log` | log E2E |
| `docs/wyniki-testow/playwright-report/` | raport HTML Playwright |
| `docs/wyniki-testow/playwright-results.json` | wyniki JSON |
| `docs/wyniki-testow/playwright-junit.xml` | JUnit (CI / załącznik) |

### Osobne komendy

```bash
# API
npm --prefix backend test

# Unit mobile
npm --prefix mobile test

# E2E web
npx playwright test e2e/web.spec.ts

# E2E mobile preview
npx playwright test e2e/mobile.spec.ts

# Raport HTML
npx playwright show-report docs/wyniki-testow/playwright-report
```

### Zmienne środowiskowe

| Zmienna | Domyślnie | Opis |
|---------|-----------|------|
| `API_BASE_URL` | `http://127.0.0.1:4000` | baza API |
| `WEB_BASE_URL` | `http://127.0.0.1:8081` | aplikacja web |
| `MOBILE_BASE_URL` | `http://127.0.0.1:8082` | Expo web |

---

## 6. Kryteria akceptacji przebiegu

Przebieg uznaje się za **zaliczony**, gdy:

- wszystkie testy API kończą się statusem PASS,  
- wszystkie testy unit mobile kończą się PASS,  
- wszystkie testy Playwright (web + mobile, oba projekty viewport) kończą się PASS,  
- w `podsumowanie.md` widnieje werdykt **Wszystkie zestawy: PASS**.

Niepowodzenie pojedynczego TC należy opisać w pracy dyplomowej jako defect / ograniczenie środowiska (np. brak Expo na `:8082`, rate limit, brak seedów).

---

## 7. Ograniczenia i dalsze prace

- Maile (Mailpit) — weryfikacja ręczna / przyszły test SMTP.  
- Brak pełnego zestawu testów natywnych (Detox/Maestro) — mobile E2E przez Expo web.  
- Brak pomiaru obciążenia 10k/50 RPS (osobny rozdział jakości MVP).  
- Rate limiting API może wpływać przy wielokrotnym odpalaniu — między przebiegami warto odczekać lub zrestartować API.

---

## 8. Mapowanie do rozdziału pracy dyplomowej (sugestia)

1. **Wstęp** — cel zapewnienia jakości MVP.  
2. **Metodyka** — piramida testów, wybór Vitest/Playwright.  
3. **Przypadki testowe** — tabele z sekcji 4 (załącznik).  
4. **Środowisko i CI lokalne** — Docker + skrypt `run-tests.sh`.  
5. **Wyniki** — wkleić/załączyć `podsumowanie.md` + zrzut raportu HTML.  
6. **Wnioski** — pokrycie MVP, luki, rekomendacje.

---

## 9. Powiązane dokumenty w repozytorium

| Plik | Zawartość |
|------|-----------|
| [`docs/wyniki-testow/podsumowanie.md`](./wyniki-testow/podsumowanie.md) | Ostatni przebieg — **51/51 PASS** |
| [`MVP.md`](../MVP.md) | Status odbioru e2e vs luki (perf 10k/50 RPS) |
| [`changes.md`](../changes.md) | Sekcja 10 — wprowadzenie zestawu testów |
| [`README.md`](../README.md) | Szybkie komendy uruchomienia testów |
| [`mobile/README.md`](../mobile/README.md) | Testy warstwy mobile |
| [`guidelines/Guidelines.md`](../guidelines/Guidelines.md) | Obowiązek aktualizacji docs po zmianach |

---

*Dokument testów RacePortal — aktualizacja: 2026-08-01 (synchronizacja wszystkich .md po przebiegu PASS).*
