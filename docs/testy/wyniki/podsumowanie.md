# Wyniki testów automatycznych — RacePortal

**Data uruchomienia (UTC):** 2026-08-01T14:35:22Z  
**Branch:** `wojtek`  
**Backend:** Spring Boot 3.3 + MySQL 8 + JUnit 5 / MockMvc

## Preflight środowiska

- API: `{"db":"up","ok":true}` (Compose)
- MySQL: `:3307` (kontener `raceportal-mysql`)
- Web: `:8081` (proxy `/api`)

## 1. Testy API (JUnit / MockMvc)

**Status: PASS**

```
Tests run: 20, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

| Klasa | Liczba TC | Zakres |
|-------|-----------|--------|
| `ApiIntegrationTest` | 14 | health, login 3 ról, 401, register/409, me, PATCH/hasło, events, org→admin approve, garage+403, registrations, admin/apps, maps, walidacja 400, RBAC 403 |
| `JwtServiceTest` | 2 | generowanie/parsowanie JWT, invalid token |
| `GlobalExceptionHandlerTest` | 4 | ApiException, 403, 401, 500 |

Log: `docs/testy/wyniki/api-surefire.log`  
Uruchomienie: `npm run test:api` → `scripts/test-api.sh` (lokalny `./mvnw` lub Maven w Dockerze + Compose MySQL)

## 2. E2E / mobile

Playwright i Vitest mobile — bez zmian ścieżek; po migracji zalecany smoke: `npx playwright test tests/e2e/web.spec.ts` przy healthy stacku.

## Werdykt

**Testy API Spring (20/20): PASS**
