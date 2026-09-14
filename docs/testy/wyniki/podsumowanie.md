# Wyniki testów automatycznych — RacePortal

**Data uruchomienia:** 2026-09-14 (~18:50 lokalnie)  
**Branch:** `wojtek`  
**Kontekst:** weryfikacja po §42 (formularze / clear-on-edit / ThemeContext) + aktualizacja docs.

## Preflight

| Check | Wynik |
|-------|--------|
| Docker Desktop | **DOWN** w tej sesji — brak `test:api` / Compose E2E |
| Web Vite build | **PASS** |
| Mobile Vitest | **PASS — 3 / 3** |
| api-types Vitest | **PASS — 599 / 599** |

## 1. API (JUnit / MockMvc)

**Status: NIE URUCHOMIONO** (brak Dockera / sieci Compose).

```bash
# gdy Docker działa:
docker compose up -d mysql
npm run test:api
```

Ostatni znany PASS w historii: **24/24** (po stabilizacji testów anulowania / płatnego flow — §41).

## 2. Mobile unit (Vitest)

**Status: PASS — 3 / 3**

```bash
npm --prefix mobile run test
```

## 2b. Shared api-types (Vitest)

**Status: PASS — 599 / 599**

```bash
npm --prefix packages/api-types test
```

## 3. Web build

**Status: PASS**

```bash
npm --prefix web run build
```

## 4. Web / Mobile E2E (Playwright)

**Status: NIE URUCHOMIONO** (wymaga Compose `:8081` + opcjonalnie Expo `:8082`).

## Werdykt sesji

| Warstwa | Status |
|---------|--------|
| Web build | PASS |
| Mobile unit | PASS |
| api-types | PASS (599) |
| API / E2E | **Zablokowane** — Docker niedostępny |

Po włączeniu Dockera: `docker compose up -d && npm run test:api && npm run test:e2e` (oraz mobile E2E wg `TESTY.md`).

Zgodność ze Specyfikacją Formularzy: **nie pełna** — szczegóły [`../spec-conformity.md`](../spec-conformity.md).
