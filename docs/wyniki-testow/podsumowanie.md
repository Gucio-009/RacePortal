# Wyniki testów automatycznych — RacePortal

**Data uruchomienia (UTC):** 2026-08-01T11:15:00Z  
**Branch:** `wojtek`  
**Środowisko:** Docker (API `:4000`, Web `:8081`), Expo web (`:8082`), Playwright Chromium

---

## Preflight

| Usługa | Status |
|--------|--------|
| API `/api/health` | OK (`db=up`) |
| Web `http://127.0.0.1:8081/` | HTTP 200 |
| Mobile Expo `http://127.0.0.1:8082/` | HTTP 200 |

---

## 1. Testy API (Vitest / integration)

**Status: PASS** — **20 / 20**

| Zakres | ID | Wynik |
|--------|-----|-------|
| Health | TC-API-01 | PASS |
| Auth (login 3 ról, 401, me, register) | TC-API-02 … 08 | PASS |
| Events (lista, filtr, detal, archiwum, kategorie) | TC-API-09 … 13 | PASS |
| Garage + registrations | TC-API-14 … 16 | PASS |
| RBAC admin/organizer | TC-API-17 … 19 | PASS |
| Maps route | TC-API-20 | PASS |

Log: `docs/wyniki-testow/api-vitest.log`

---

## 2. Testy jednostkowe mobile (Vitest)

**Status: PASS** — **2 / 2**

| ID | Opis | Wynik |
|----|------|-------|
| TC-MOB-U01 | Token w localStorage (web) | PASS |
| TC-MOB-U02 | API_URL zawiera port 4000 | PASS |

Log: `docs/wyniki-testow/mobile-unit.log`

---

## 3. E2E Playwright (Web + Mobile Expo)

**Status: PASS** — **29 / 29** (czas ~26 s)

### Projekty

| Projekt | Viewport / target | Wynik |
|---------|-------------------|--------|
| `web-desktop` | Desktop Chrome → `:8081` | 12/12 PASS |
| `web-mobile-viewport` | Pixel 7 → `:8081` | 12/12 PASS |
| `mobile-expo` | Pixel 7 → Expo `:8082` | 5/5 PASS |

### Web (TC-WEB-01 … 12)

Publiczne: home, kalendarz, filtr, szczegóły, mapa, archiwum — PASS  
Auth: login, błędne hasło, garaż — PASS  
RBAC: admin, organizator, blokada `/admin` dla USER — PASS  

### Mobile Expo (TC-MOB-01 … 05)

Login screen, login+lista, złe hasło, szczegóły+ZAPISZ SIĘ, wylogowanie — PASS  

Artefakty:

- HTML: `docs/wyniki-testow/playwright-report/`
- JSON: `docs/wyniki-testow/playwright-results.json`
- JUnit: `docs/wyniki-testow/playwright-junit.xml`
- Log: `docs/wyniki-testow/playwright.log`

---

## Werdykt

**Wszystkie zestawy: PASS**

| Zestaw | Passed | Failed |
|--------|--------|--------|
| API integration | 20 | 0 |
| Mobile unit | 2 | 0 |
| Playwright E2E | 29 | 0 |
| **Razem** | **51** | **0** |

---

## Jak powtórzyć

```bash
docker compose up -d
cd mobile && npx expo start --web --port 8082   # osobny terminal
npm --prefix backend test
npm --prefix mobile test
npx playwright test
```

Pełna dokumentacja metodyki: [`docs/TESTY.md`](../TESTY.md)
