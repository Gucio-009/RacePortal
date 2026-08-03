# Wyniki testów automatycznych — RacePortal

**Data uruchomienia:** 2026-08-03 (~16:40 lokalnie)  
**Branch:** `wojtek`  
**Pełny raport CR:** [`../review-2026-08-03.md`](../review-2026-08-03.md)

## Preflight

- API health: `db: up` (po ewentualnym `docker compose restart api` jeśli Maven zrzucił schemat)
- Web Compose: `:8081`
- Expo web: `:8082` (osobno)

## 1. API (JUnit / MockMvc)

**Status: PASS — 22 / 22**

| Klasa | TC |
|-------|-----|
| `ApiIntegrationTest` | 16 |
| `JwtServiceTest` + `GlobalExceptionHandlerTest` | 6 |

Uruchomienie: `npm run test:api`

**Uwaga:** kontener Maven może wyczyścić tabele w DB Compose — po teście zrestartuj `api`.

## 2. Mobile unit (Vitest)

**Status: PASS — 2 / 2**

```bash
npm run test:mobile-unit
```

## 3. Web E2E (Playwright · web-desktop)

**Status: PASS — 12 / 12**

TC-WEB-01…12 (publiczne, auth, RBAC). Mapa: tab „Mapa” na `/wydarzenia`.

## 4. Mobile E2E (Playwright · mobile-expo)

**Status: PASS — 5 / 5**

Gość → logowanie → lista/detal → wylogowanie (tryb gościa).

## Werdykt

**API 22/22 · mobile unit 2/2 · web E2E 12/12 · mobile E2E 5/5 — PASS**
