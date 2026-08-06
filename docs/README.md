# RacePortal — dokumentacja

Indeks dokumentów projektu (branch `wojtek`).

## Struktura katalogów w repo

| Katalog | Zawartość |
|---------|-----------|
| `web/` | Aplikacja webowa (Vite/React) + Docker image frontendu |
| `backend/` | API (Spring Boot + MySQL) |
| `mobile/` | Aplikacja mobilna (Expo) |
| `docs/` | Dokumentacja projektu i dyplomu |
| `tests/e2e/` | Testy E2E Playwright (web + mobile Expo) |
| `scripts/` | Skrypty (backup, uruchomienie testów) |

## Dokumenty w `docs/`

| Plik | Opis |
|------|------|
| [`FAQ-przeglad.md`](./FAQ-przeglad.md) | **FAQ dla recenzentów** — seed, MySQL, Expo, `.env`, konta (czytaj najpierw) |
| [`mobile.md`](./mobile.md) | **Aplikacja mobilna** — zmiany, efekty, parity, chronologia Expo |
| [`review-2026-08-03.md`](./review-2026-08-03.md) | **Code review** web+mobile + wyniki testów (2026-08-03) |
| [`MVP.md`](./MVP.md) | Plan vs stan MVP (MPC) |
| [`changes.md`](./changes.md) | Chronologia prac |
| [`pomysly-technologiczne.md`](./pomysly-technologiczne.md) | **Alt-technologie** — dziś vs pomysły (JWT→Keycloak, Next.js, Redis…) |
| [`Guidelines.md`](./Guidelines.md) | Wytyczne dla agentów / deweloperów |
| [`ATTRIBUTIONS.md`](./ATTRIBUTIONS.md) | Licencje i atrybucje |
| [`testy/TESTY.md`](./testy/TESTY.md) | Metodyka i przypadki testów automatycznych |
| [`testy/wyniki/podsumowanie.md`](./testy/wyniki/podsumowanie.md) | Ostatnie wyniki testów |
| [`testy/wyniki/unit-500-wyniki.md`](./testy/wyniki/unit-500-wyniki.md) | 599 unit `@raceportal/api-types` |

Root repozytorium zawiera tylko [`README.md`](../README.md) (szybki start) oraz konfigurację monorepo / Docker Compose.

> **Dla osób przeglądających projekt:** pytania o seed, „niedziałający” MySQL/Expo i `env_file` są zebrane w [`FAQ-przeglad.md`](./FAQ-przeglad.md) — prosimy nie zgłaszać ich ponownie bez sprawdzenia FAQ.
