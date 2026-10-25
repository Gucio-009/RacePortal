# RacePortal — dokumentacja

Indeks pod aktualny stack: **Oracle VM + Mailbux + PWA** (`https://raceportal.pl`).  
Branch produkcyjny: **`main`**.

## Zaczynaj tutaj

| Potrzeba | Dokument |
|----------|----------|
| Szybki start lokalnie | [`../README.md`](../README.md) |
| Seed / MySQL / Expo / konta demo | [`FAQ-przeglad.md`](./FAQ-przeglad.md) |
| Start/stop lokalnie i na VM | [`know-how-uruchamianie.md`](./know-how-uruchamianie.md) |
| Pierwsze postawienie Oracle + Tunnel | [`oracle-deploy.md`](./oracle-deploy.md) |
| **Dlaczego** Oracle / Mailbux / PWA (dyplom) | [`decyzje-wdrozeniowe.md`](./decyzje-wdrozeniowe.md) |
| Plan MVP vs stan kodu | [`MVP.md`](./MVP.md) |
| Pentest i remedacje (dyplom) | [`cybersecurity-pentest.md`](./cybersecurity-pentest.md) |

## Repo — katalogi

| Katalog | Zawartość |
|---------|-----------|
| `web/` | Vite/React + PWA + nginx |
| `backend/` | Spring Boot + MySQL + JWT |
| `mobile/` | Expo wizytówka (Eventy + CTA web) |
| `packages/api-types/` | Wspólne typy / helpers |
| `docs/` | Ta dokumentacja |
| `tests/e2e/` | Playwright |
| `scripts/` | Backup, testy |

## Dokumenty w `docs/` (wg roli)

### Uruchamianie i produkcja

| Plik | Opis |
|------|------|
| [`FAQ-przeglad.md`](./FAQ-przeglad.md) | FAQ dla recenzentów |
| [`know-how-uruchamianie.md`](./know-how-uruchamianie.md) | Codzienne włączanie / aktualizacja |
| [`oracle-deploy.md`](./oracle-deploy.md) | Pierwsze wdrożenie VM |
| [`decyzje-wdrozeniowe.md`](./decyzje-wdrozeniowe.md) | Proces decyzji (ewolucja architektury) |

### Produkt i zakres

| Plik | Opis |
|------|------|
| [`MVP.md`](./MVP.md) | Miało być / jest / luki / ponad MVP |
| [`cybersecurity-pentest.md`](./cybersecurity-pentest.md) | Znaleziska pentestu → remedacja → weryfikacja |
| [`spec-conformity.md`](./spec-conformity.md) | Specyfikacja Formularzy vs kod |
| [`scenariusz-prezentacji.md`](./scenariusz-prezentacji.md) | Scenariusz demo |
| [`pomysly-rozwoju.md`](./pomysly-rozwoju.md) | Luki i pomysły produktowe |
| [`pomysly-technologiczne.md`](./pomysly-technologiczne.md) | Stack dziś vs alt (Keycloak, Next…) |

### Chronologia i zasady

| Plik | Opis |
|------|------|
| [`changes.md`](./changes.md) | Historia prac (długa — szukaj po § / dacie) |
| [`Guidelines.md`](./Guidelines.md) | Wytyczne dla agentów / deweloperów |
| [`ATTRIBUTIONS.md`](./ATTRIBUTIONS.md) | Licencje (shadcn, Unsplash, mapy) |

### Mobile i testy

| Plik | Opis |
|------|------|
| [`mobile.md`](./mobile.md) | Historia Expo → wizytówka |
| [`../mobile/README.md`](../mobile/README.md) | Jak odpalić mobilkę (Mac/Windows) |
| [`testy/TESTY.md`](./testy/TESTY.md) | Metodyka testów |
| [`testy/wyniki/podsumowanie.md`](./testy/wyniki/podsumowanie.md) | Ostatnie wyniki |
| [`testy/wyniki/unit-500-wyniki.md`](./testy/wyniki/unit-500-wyniki.md) | Unit `@raceportal/api-types` |

> Usunięte jako zbędne / mylące (historia jest w `decyzje-wdrozeniowe.md` + `changes.md`):  
> `gcp-deploy.md`, `cloudflare-pages.md`, `review-2026-08-03.md`.
