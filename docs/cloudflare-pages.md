# Cloudflare Pages — deploy frontendu RacePortal

Repozytorium jest monorepo. Frontend Vite/React siedzi w **`web/`** (stąd błąd `ENOENT …/package.json`, gdy Root directory = `/`).

## Build configuration (Settings → Builds & deployments → Edit)

Repo ma npm **workspaces** (root `package.json` obejmuje też `mobile`). Nawet przy Root = `web` `npm ci` czyta rootowy `package-lock.json` — dlatego błędy o `expo-constants` / `datetimepicker` przy budowaniu Pages.

| Pole | Wartość |
|------|---------|
| **Root directory** | `/` (puste / korzeń repo) |
| **Build command** | `npm ci && npm run build --workspace=web` |
| **Build output directory** | `web/dist` |
| **Node version** (opcjonalnie) | `22` |

`packages/api-types` jest w repo (Vite alias z `web/`). Alternatywa Root = `web` też działa **po** zsynchronizowanym root lockfile, z komendą `npm ci && npm run build` i output `dist`.

## Zmienne środowiskowe (Settings → Environment variables)

| Nazwa | Opis |
|-------|------|
| `VITE_API_URL` | **Wymagane na Pages.** Pełny URL API, np. `https://twoje-api.example.com` (bez końcowego `/`). Puste = relative `/api` (działa tylko z nginx/proxy jak w Dockerze). |
| `VITE_GOOGLE_CLIENT_ID` | Opcjonalnie — Google Sign-In |

Po zmianie env: **Retry deployment**.

## CORS po stronie API

Jeśli front jest na `*.pages.dev` / własnej domenie CF, dodaj ten origin do `CORS_ORIGIN` w backendzie (wzorce jak `https://*.pages.dev`, `https://*.trycloudflare.com`).

## SPA

Plik `web/public/_redirects` (`/* → /index.html 200`) trafia do `dist/` przy buildzie — deep linki (`/organizer`, `/wydarzenia/:id`) działają na Pages.
