# RacePortal — dokumentacja

Indeks dokumentów projektu (branch `main` / roboczy `wojtek`).

## Struktura katalogów w repo

| Katalog | Zawartość |
|---------|-----------|
| `web/` | Aplikacja webowa (Vite/React) + Docker image frontendu |
| `backend/` | API (Spring Boot + MySQL) |
| `mobile/` | Mobilka-wizytówka (Expo) — Eventy + CTA web |
| `docs/` | Dokumentacja projektu i dyplomu |
| `tests/e2e/` | Testy E2E Playwright (web + mobile Expo) |
| `scripts/` | Skrypty (backup, uruchomienie testów) |

## Dokumenty w `docs/`

| Plik | Opis |
|------|------|
| [`FAQ-przeglad.md`](./FAQ-przeglad.md) | **FAQ dla recenzentów** — seed, MySQL, Expo, `.env`, konta (czytaj najpierw) |
| [`spec-conformity.md`](./spec-conformity.md) | **Specyfikacja Formularzy vs kod** — tabela luk (Blocker/Major/Minor) |
| [`mobile.md`](./mobile.md) | **Aplikacja mobilna** — wizytówka (Eventy + CTA web), chronologia Expo |
| [`review-2026-08-03.md`](./review-2026-08-03.md) | **Code review** web+mobile + wyniki testów (2026-08-03) |
| [`MVP.md`](./MVP.md) | Plan vs stan MVP (MPC) |
| [`changes.md`](./changes.md) | Chronologia prac |
| [`pomysly-technologiczne.md`](./pomysly-technologiczne.md) | **Alt-technologie** — dziś vs pomysły (JWT→Keycloak, Next.js, Redis…) |
| [`pomysly-rozwoju.md`](./pomysly-rozwoju.md) | **Luki i pomysły produktowe** — czego brakuje / co warto dodać (nie Spec, nie stack) |
| [`scenariusz-prezentacji.md`](./scenariusz-prezentacji.md) | **Scenariusz demo** — co pokazać na prezentacji (web + mobile) |
| [`oracle-deploy.md`](./oracle-deploy.md) | **Oracle Always Free** — cała aplikacja na VM (2 OCPU / 12 GB) + tunel Cloudflare na `:8081` |
| [`know-how-uruchamianie.md`](./know-how-uruchamianie.md) | **Know-how start/stop** — lokalnie i Oracle, Mailbux, PWA, checklista demo |
| [`decyzje-wdrozeniowe.md`](./decyzje-wdrozeniowe.md) | **Dlaczego tak** — proces decyzji (GCP→Oracle, Mailpit→Mailbux, PWA); materiał pod dyplom |
| [`cloudflare-pages.md`](./cloudflare-pages.md) | Starsza próba Pages (front osobno) — **historia**, nie aktualne wdrożenie |
| [`gcp-deploy.md`](./gcp-deploy.md) | Stub: GCP usunięte; patrz `oracle-deploy.md` + decyzje |
| [`Guidelines.md`](./Guidelines.md) | Wytyczne dla agentów / deweloperów |
| [`ATTRIBUTIONS.md`](./ATTRIBUTIONS.md) | Licencje i atrybucje |
| [`testy/TESTY.md`](./testy/TESTY.md) | Metodyka i przypadki testów automatycznych |
| [`testy/wyniki/podsumowanie.md`](./testy/wyniki/podsumowanie.md) | Ostatnie wyniki testów |
| [`testy/wyniki/unit-500-wyniki.md`](./testy/wyniki/unit-500-wyniki.md) | 599 unit `@raceportal/api-types` |

Root repozytorium zawiera tylko [`README.md`](../README.md) (szybki start) oraz konfigurację monorepo / Docker Compose.

> **Dla osób przeglądających projekt:** pytania o seed, „niedziałający” MySQL/Expo i `env_file` są zebrane w [`FAQ-przeglad.md`](./FAQ-przeglad.md) — prosimy nie zgłaszać ich ponownie bez sprawdzenia FAQ.
