# Cloudflare Pages — deploy frontendu RacePortal

Checklist i pułapki zebrane przy wdrożeniu (monorepo + Docker API + quick tunnel).

## 0. Które repozytorium GitHub

Pages musi budować z **`Gucio-009/RacePortal`**, branch **`main`** (tam jest zsynchronizowany `package-lock.json`).

Fork **`WojciechWronisz/RacePortal`** często zostaje w tyle — wtedy build pada na `npm ci` (expo / datetimepicker), mimo że na upstream `main` już działa.

- Cloudflare → Settings → Git: upewnij się, że repo = `Gucio-009/RacePortal`.
- Albo na fork: **Sync fork** / push `main` z upstream, potem Retry.

## 1. Build configuration (Settings → Builds & deployments)

Repo to **npm workspaces** (`web` + `mobile` + `packages/*`). Cloudflare i tak odpala `npm clean-install` (`npm ci`) względem korzenia workspaces — stąd błędy o pakiety Expo, nawet gdy „interesuje nas tylko web”.

### Docelowe wartości (klasyczny Pages / Git)

| Pole | Wartość | Uwagi |
|------|---------|--------|
| **Production branch** | `main` | Nie `wojtek`, chyba że świadomie. |
| **Root directory** | puste / `/` | **Nie** `/web` ani `web`. Przy Root=`web` CF i tak ciągnie root lockfile przez workspaces; ścieżki `web/dist` w Deploy się rozjeżdżają. |
| **Build command** | `npm ci && npm run build --workspace=web` | Samo `npm run build` w `/` nie zbuduje Vite. |
| **Build output directory** | `web/dist` | Katalog po udanym Vite (`index.html` + `assets/`). |
| **Deploy command** | **puste** | Klasyczny Pages sam uploaduje *Build output directory*. |
| **Node version** | `22` (opcjonalnie) | Buildy na Node 24 też przechodzą przy poprawnym lockfile. |

### Jeśli UI ma osobne pole „Deploy command” (Workers Builds)

Wtedy **nie** używaj ścieżki `web/dist` przy Root=`/web`. Ustaw:

| Pole | Wartość |
|------|---------|
| Root directory | `/` |
| Build command | `npm ci && npm run build --workspace=web` |
| Deploy command | `npx wrangler pages deploy web/dist --project-name=RacePortal --commit-dirty=true` |

`--project-name` = **dokładna** nazwa projektu w dashboardzie Cloudflare (u nas zwykle `RacePortal`). Bez tego:

```text
✘ [ERROR] Missing Pages project name. Use --project-name <name> …
Failed: error occurred while running deploy command
```

Potrzebny też **API token z uprawnieniem Cloudflare Pages — Edit** (nie wystarczy „Account Read”). Typowy błąd przy zbyt słabym tokenie:

```text
Authentication error [code: 10000]
It looks like you are authenticating Wrangler via a custom API token …
Please ensure it has the correct permissions for this operation.
```

Naprawa tokenu: [API Tokens](https://dash.cloudflare.com/profile/api-tokens) → Create Token → szablon **Edit Cloudflare Workers** albo Custom z `Account` → `Cloudflare Pages` → **Edit**, plus dostęp do właściwego Account ID. Potem wklej nowy token jako `CLOUDFLARE_API_TOKEN` (Variable/Secret) albo w polu API token w Build settings.

**Preferowane (bez wrangler / bez tokenu):** wyczyść **Deploy command** całkowicie i ustaw tylko **Build output directory** = `web/dist`. Integracja Git Pages sama wrzuca artefakty — omija `CLOUDFLARE_API_TOKEN` i błąd 10000.

### Czego unikać (już wybuchało)

| Ustawienie | Skutek |
|------------|--------|
| Root `/` + brak `package.json` w korzeniu (stary stan) | `ENOENT …/package.json` |
| Root `web` / `/web` + stary root lockfile | `npm ci` — Missing `datetimepicker`, Invalid `expo-constants` / `@expo/env` |
| Build: `npm install && npm run build` przy Root `/` | Buduje nic sensownego albo zły workspace |
| Output `dist` przy Root `/` | *Output directory not found* / pusty deploy |
| Deploy: `wrangler … web/dist` przy Root `/web` | Deploying fail — katalogu nie ma (jest `dist`, nie `web/dist`) |
| Fork bez sync lockfile | Ten sam `npm ci` EUSAGE, mimo poprawki na `Gucio-009` |

Po zmianie Root / Build / Output: **Clear cache** (Build cache) + Retry.

## 2. Zmienne (Variables and secrets)

| Type | Name | Value |
|------|------|--------|
| Variable | `VITE_API_URL` | Publiczny origin API, **bez** końcowego `/` i **bez** `/api` |
| Variable | `VITE_GOOGLE_CLIENT_ID` | Opcjonalnie |

Vite **wkleja** `VITE_*` w JS **w trakcie builda**. Samo „Save” zmiennej bez **Retry deployment** nic nie zmienia w już zbudowanym artefakcie.

### API na czas dema (lokalny Docker)

```bash
# Docker Compose: API na :4000 musi działać (curl localhost:4000/api/health)
cloudflared tunnel --url http://localhost:4000
```

W Value wklej URL z logów, np. `https://….trycloudflare.com`.

- Nie dawaj `http://localhost:4000` (przeglądarka użytkownika Pages nie dojdzie do Twojego Maca).
- Nie dawaj URL tunelu na `:8081` (to front, nie API).
- Quick tunnel = losowy host; po restarcie `cloudflared` **zmień** `VITE_API_URL` i zrób nowy deploy.
- Bez `VITE_API_URL` strona się zbuduje, ale login / API nie zadziałają na Pages.

Lokalna weryfikacja tunelu:

```bash
curl -sS "https://TWOJ-TUNEL.trycloudflare.com/api/health"
```

## 3. CORS (backend)

Frontend na `https://….pages.dev` wysyła `Origin: https://….pages.dev`.  
W `docker-compose.yml` (`CORS_ORIGIN`) muszą być m.in.:

- `https://*.pages.dev`
- `https://*.trycloudflare.com` (gdy front też przez quick tunnel)

Bez `*.pages.dev`: tunnel health = 200, a login z Pages = **CORS / preflight 403**.  
Po zmianie `CORS_ORIGIN`: `docker compose up -d api --force-recreate`.

## 4. SPA

`web/public/_redirects` → przy buildzie trafia do `web/dist/_redirects`:

```text
/*    /index.html   200
```

Deep linki (`/organizer`, `/wydarzenia/:id`) na Pages wymagają tego pliku.

## 5. Typowy happy path (demo)

1. `docker compose up -d` — API healthy na `:4000`.
2. `cloudflared tunnel --url http://localhost:4000` — skopiuj URL.
3. Pages: repo `Gucio-009/RacePortal`, `main`, Root `/`, build/output jak w §1, Deploy puste.
4. `VITE_API_URL` = URL tunelu → Save → **Retry deployment**.
5. Otwórz `*.pages.dev`, zaloguj (`test@wp.pl` / seed z FAQ).

## 6. Diagnostyka po logach

| Fragment logu / objaw | Co zrobić |
|----------------------|-----------|
| `ENOENT … package.json` | Root = `/` (nie pusty projekt bez root `package.json`) albo zły checkout |
| `npm ci` + datetimepicker / expo-constants | Sync lockfile / właściwe repo (`Gucio-009`); Root `/`; Clear cache |
| Build OK, **Deploying** fail / output not found | Output = `web/dist` przy Root `/`; wyczyść Deploy command albo popraw ścieżkę wrangler |
| `Missing Pages project name` | Deploy: dodaj `--project-name=RacePortal` **albo** wyczyść Deploy i użyj Build output `web/dist` |
| `wrangler` auth / API token | Token w Build settings / `CLOUDFLARE_API_TOKEN` |
| Deploy: `wrangler …` bez `--project-name` | Jak wyżej — błąd na etapie Deploying mimo sukcesu Vite |
| Strona stoi, login nie działa | `VITE_API_URL` + nowy deploy; tunnel żywy; CORS `*.pages.dev` |
| OPTIONS 403 z Origin `*.pages.dev` | Zaktualizuj `CORS_ORIGIN`, recreate `api` |

## 7. Relacja do Dockera

Lokalnie / Compose: nginx na `:8081` proxy’uje `/api` → API, więc `VITE_API_URL` może być puste.  
Na Pages **nie ma** tego proxy — bez `VITE_API_URL` requesty idą w `https://….pages.dev/api/…` i giną.
