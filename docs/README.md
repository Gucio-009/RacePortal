# RacePortal — dokumentacja

Indeks dokumentów projektu (branch `wojtek`).

## Struktura katalogów w repo

| Katalog | Zawartość |
|---------|-----------|
| `web/` | Aplikacja webowa (Vite/React) + Docker image frontendu |
| `backend/` | API (Express/Prisma) |
| `mobile/` | Aplikacja mobilna (Expo) |
| `docs/` | Dokumentacja projektu i dyplomu |
| `tests/e2e/` | Testy E2E Playwright (web + mobile Expo) |
| `scripts/` | Skrypty (backup, uruchomienie testów) |

## Dokumenty w `docs/`

| Plik | Opis |
|------|------|
| [`MVP.md`](./MVP.md) | Plan vs stan MVP (MPC) |
| [`changes.md`](./changes.md) | Chronologia prac |
| [`Guidelines.md`](./Guidelines.md) | Wytyczne dla agentów / deweloperów |
| [`ATTRIBUTIONS.md`](./ATTRIBUTIONS.md) | Licencje i atrybucje |
| [`testy/TESTY.md`](./testy/TESTY.md) | Metodyka i przypadki testów automatycznych |
| [`testy/wyniki/podsumowanie.md`](./testy/wyniki/podsumowanie.md) | Ostatnie wyniki testów |

Root repozytorium zawiera tylko [`README.md`](../README.md) (szybki start) oraz konfigurację monorepo / Docker Compose.
