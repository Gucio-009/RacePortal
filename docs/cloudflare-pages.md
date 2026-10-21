# Cloudflare Pages — deploy frontendu RacePortal

Pełna ściąga z wdrożenia (2026-10-20): monorepo npm workspaces, Workers Builds vs klasyczny Pages, tokeny, quick tunnel API, CORS, custom domain `raceportal.pl`.

**Codzienna obsługa + VM:** [`know-how-uruchamianie.md`](./know-how-uruchamianie.md). Produkcja API: `https://api.raceportal.pl` (Tunnel → Oracle VM). Build command z jawnym env:

```text
npm ci && VITE_API_URL=https://api.raceportal.pl npm run build --workspace=web
```

---

## TL;DR — działająca konfiguracja (klasyczny Pages)

| Pole | Wartość |
|------|---------|
| Produkt Cloudflare | **Pages** → Connect to Git (nie Worker z Deploy command) |
| GitHub | **`Gucio-009/RacePortal`**, branch **`main`** |
| Root directory | puste (korzeń repo) |
| Build command | `npm ci && npm run build --workspace=web` |
| Build output directory | `web/dist` (bez wiodącego `/`) |
| Deploy command | **brak / puste** |
| Variable | `VITE_API_URL` = publiczny origin API (tunnel lub hosting), bez `/` na końcu |

API lokalnie: Docker `:4000` + `cloudflared tunnel --url http://localhost:4000`.  
CORS w Compose musi zawierać origin frontu (`*.pages.dev`, `raceportal.pl`, …).

---

## 0. Worker ≠ Pages (najczęstsza pomyłka UI)

W **Workers & Pages** widać dwa typy aplikacji:

| Typ | Ikona / objawy | Deploy |
|-----|----------------|--------|
| **Worker** | „No active routes”, pole **Deploy command**, dropdown **API token** | `wrangler deploy` / `wrangler pages deploy` + token |
| **Pages** | URL `….pages.dev`, **Build output directory** | CF sam uploaduje `web/dist` |

Worker o nazwie `raceportal` **nie jest** projektem Pages. Stąd:

```text
The Pages project "raceportal" does not exist.
```

**Rozwiązanie:** Create application → **Pages** → Connect to Git (osobny projekt, np. `raceportal` / `raceportal-web`). Stary Worker można zostawić lub usunąć.

---

## 1. Które repozytorium GitHub

Buduj z **`Gucio-009/RacePortal`** + **`main`** (zsynchronizowany root `package-lock.json`).

Fork **`WojciechWronisz/RacePortal`** często zostaje w tyle → ten sam błąd `npm ci` (expo / datetimepicker), mimo że upstream już działa.

- Settings → Git: repo = `Gucio-009/RacePortal`
- Albo na fork: **Sync fork**, potem Retry

---

## 2. Monorepo i `npm ci`

Root `package.json` ma **workspaces**: `web`, `mobile`, `packages/*`.

Cloudflare zawsze odpala `npm clean-install` (`npm ci`) w kontekście workspaces. Nawet przy Root = `web` npm czyta **rootowy** `package-lock.json`.

### Objaw

```text
npm ci can only install … package.json and package-lock.json … are in sync
Missing: @react-native-community/datetimepicker@…
Invalid: lock file's expo-constants@… does not satisfy …
```

### Naprawa

1. Na `main` w `Gucio-009` musi być aktualny lockfile (`npm install` w korzeniu, commit).
2. Root directory = `/` (nie `web`).
3. Build: `npm ci && npm run build --workspace=web`.
4. Po zmianach: **Clear cache** + Retry.

Lokalnie weryfikacja: `npm ci && npm run build --workspace=web`.

---

## 3. Klasyczny Pages — Build configuration

| Pole | Wartość | Uwagi |
|------|---------|--------|
| Production branch | `main` | |
| Root directory | puste | Nie `/web` |
| Build command | `npm ci && npm run build --workspace=web` | |
| Build output directory | `web/dist` | **Nie** `/web/dist` (wiodący slash psuje ścieżkę) |
| Deploy command | puste | Pages sam wrzuca output |
| Framework preset | None / Vite | |

W logu musi być `vite build` → `✓ built` → Success — **bez** `Executing user deploy command: wrangler …`.

---

## 4. Workers Builds (unikać na demo; jeśli już jesteś w tym UI)

Objawy: pola Build + **Deploy command** + **API token**, brak „Build output directory”.

### Token Builds (dropdown) vs `CLOUDFLARE_API_TOKEN`

| Token | Do czego |
|-------|----------|
| Dropdown **API token** (Workers Builds) | Start builda (Initializing). Skasowany → fail w 1–2 s: *build token … deleted or rolled* |
| Secret `CLOUDFLARE_API_TOKEN` | To czyta **wrangler** przy deploy. Za słaby / stary → `Authentication error [code: 10000]` |
| `CF_TOKEN` | **Niepotrzebny** — wrangler go nie używa |
| `CLOUDFLARE_ACCOUNT_ID` | Opcjonalnie, pomaga wranglerowi |

CF i tak wstrzykuje Build token jako `CLOUDFLARE_API_TOKEN`. Słaby Build token = 10000 na Pages API mimo Super Admin na koncie (uprawnienia tokenu ≠ rola konta).

### Tworzenie tokenu pod wrangler Pages

1. [API Tokens](https://dash.cloudflare.com/profile/api-tokens) → **Edit Cloudflare Workers** → Use template  
   albo Custom: **Account → Cloudflare Pages → Edit**
2. **Zone Resources: All zones** (nie tylko `raceportal.pl` — ograniczenie strefy często daje 10000)
3. Account Resources: Twoje konto
4. Wklej jako Secret `CLOUDFLARE_API_TOKEN`

**User → User Details** w nowym UI bywa niewidoczne — **nie jest wymagane**.

### Deploy command (Workers Builds)

```text
npx wrangler pages deploy web/dist --project-name=raceportal --commit-dirty=true
```

| Błąd | Przyczyna |
|------|-----------|
| `Missing Pages project name` | Brak `--project-name` |
| `Expected "name" … lowercase … got "RacePortal"` | W `wrangler.toml`: `name = "raceportal"` (małe litery) |
| `Authentication error [code: 10000]` | Słaby/stary token; Zone nie All zones |
| `The Pages project "raceportal" does not exist` | Istnieje Worker o tej nazwie, nie Pages — utwórz projekt Pages |
| `application detection … root of a workspace` | Deploy = `npx wrangler deploy` zamiast `pages deploy web/dist` |
| `build token … deleted or rolled` | Dropdown API token wskazuje usunięty token — wybierz nowy / Create new → **Save** |

W repo: `wrangler.toml` (`name = "raceportal"`, `pages_build_output_dir = "web/dist"`) — pomocniczy przy wranglerze; klasyczny Pages go nie wymaga.

**Unsaved changes** na dole panelu — bez **Save** Retry używa starej konfiguracji.

---

## 5. Zmienne środowiskowe (Pages)

| Type | Name | Value |
|------|------|--------|
| Variable | `VITE_API_URL` | `https://….trycloudflare.com` lub URL API — **bez** `/` i **bez** `/api` |
| Variable | `VITE_GOOGLE_CLIENT_ID` | Opcjonalnie |
| Variable | `CLOUDFLARE_ACCOUNT_ID` | Tylko przy wranglerze (np. z logów konta) |
| Secret | `CLOUDFLARE_API_TOKEN` | Tylko przy wrangler Pages deploy |

Vite **wkleja** `VITE_*` przy **buildzie**. Po zmianie zmiennej: obowiązkowy **nowy deploy**.

Pole Value w UI często **ucina wizualnie** URL — sprawdź, czy kończy się na `.com`.

---

## 6. API na czas dema (Docker + quick tunnel)

Frontend na Pages/custom domain **nie sięgnie** `localhost:4000`.

```bash
# API musi być UP
curl -s http://127.0.0.1:4000/api/health

# Osobny tunnel na API (nie na :8081!)
cloudflared tunnel --url http://localhost:4000
```

Przykład Value: `https://regression-hormone-newbie-implied.trycloudflare.com`

- Tunnel na `:8081` = front (nginx), nie API.
- Po restarcie `cloudflared` URL się zmienia → zaktualizuj `VITE_API_URL` + redeploy.
- Bez `VITE_API_URL`: fetch idzie w `https://domena/api/...` → na Pages dostajesz HTML (`_redirects`) zamiast JSON.

Weryfikacja:

```bash
curl -sS "https://TWOJ-TUNEL.trycloudflare.com/api/health"
```

Czy API musi być „publiczne”? Na działający login z internetu — tak (choćby losowy `*.trycloudflare.com`). Sam UI bez API = OK bez zmiennej.

---

## 7. CORS (backend / Compose)

`docker-compose.yml` → `CORS_ORIGIN` (patterns), m.in.:

- `https://*.trycloudflare.com`
- `https://*.pages.dev`
- `https://raceportal.pl`
- `https://www.raceportal.pl`
- localhost (dev)

Bez originu frontu:

```text
Invalid CORS request
```

preflight OPTIONS → 403. Przeglądarka blokuje API mimo żywego tunelu.

Po zmianie:

```bash
docker compose up -d api --force-recreate
```

Test:

```bash
curl -sS -D- -o /dev/null -X OPTIONS "https://TUNEL/api/events" \
  -H "Origin: https://www.raceportal.pl" \
  -H "Access-Control-Request-Method: GET"
# oczekiwane: 200 + access-control-allow-origin: https://www.raceportal.pl
```

---

## 8. Runtime na `www.raceportal.pl`

### Objaw

```text
Unexpected Application Error!
Cannot read properties of undefined (reading 'length')
```

### Przyczyny (łącznie)

1. Brak / złe `VITE_API_URL` → request same-origin `/api/events` → HTML 200 → `res.items` = `undefined`.
2. CORS bez `raceportal.pl` / `www.raceportal.pl`.
3. Martwy tunnel / API.

### Naprawy

- `VITE_API_URL` + redeploy; tunnel żywy; CORS jak w §7.
- Kod: HomePage używa `res.items ?? []` (nie wywala całej aplikacji).
- DevTools → Network: `/api/events` musi iść na host tunelu/API, nie na `raceportal.pl`.

---

## 9. SPA

`web/public/_redirects` → `web/dist/_redirects`:

```text
/*    /index.html   200
```

Deep linki (`/organizer`, `/wydarzenia/:id`) bez tego nie działają na Pages.

---

## 10. Happy path (demo z custom domain)

1. `docker compose up -d` — API healthy `:4000`.
2. `cloudflared tunnel --url http://localhost:4000` — skopiuj URL.
3. Klasyczny **Pages** + Git `Gucio-009/RacePortal` / `main` (§3).
4. `VITE_API_URL` = URL tunelu → Save → Deploy.
5. CORS ma `https://www.raceportal.pl` (Compose + recreate `api`).
6. Otwórz domenę / `….pages.dev`, konto seed: `test@wp.pl` (FAQ).

---

## 11. Tabela diagnostyczna (log → akcja)

| Fragment / objaw | Etap | Akcja |
|------------------|------|--------|
| `ENOENT …/package.json` | Install | Root = `/`; jest root `package.json` |
| `npm ci` + datetimepicker / expo-constants | Install | Upstream `main` + lockfile; nie stary fork; Clear cache |
| `build token … deleted or rolled` | Initializing | Dropdown API token → nowy; Save |
| Brak `vite build` w logu, od razu wrangler | Build | Uzupełnij Build command |
| `Missing Pages project name` | Deploy | `--project-name=raceportal` lub klasyczny Pages bez wrangler |
| `name` … got `"RacePortal"` | Deploy | `wrangler.toml` → `raceportal` |
| Auth `10000` | Deploy | Token Pages Edit; Zone = All zones; Secret `CLOUDFLARE_API_TOKEN` |
| Pages project does not exist | Deploy | Utwórz **Pages**, nie Worker |
| workspace detection / `wrangler deploy` | Deploy | Użyj `pages deploy web/dist`, nie `wrangler deploy` |
| Output directory not found | Deploy | Output `web/dist`, Root `/` |
| Strona OK, API nie | Runtime | `VITE_API_URL` + redeploy; tunnel; CORS |
| `undefined (reading 'length')` | Runtime | Jak §8 |
| OPTIONS 403 / Invalid CORS | Runtime | Dodaj origin do `CORS_ORIGIN`, recreate API |

Kolejność pipeline: **Initializing** (Build token) → clone / `npm ci` → **Build** (Vite) → **Deploy** (Pages upload lub wrangler) → runtime w przeglądarce (VITE + CORS + tunnel).

---

## 12. Docker vs Pages

| Środowisko | `VITE_API_URL` |
|------------|----------------|
| Compose web `:8081` (nginx `/api` → API) | może być puste |
| Pages / `raceportal.pl` | **wymagane** (publiczny origin API) |

---

## 13. Pliki w repo związane z Pages

| Plik | Rola |
|------|------|
| `package.json` / `package-lock.json` (root) | workspaces + `npm ci` na CF |
| `web/` | frontend Vite |
| `web/public/_redirects` | SPA fallback |
| `wrangler.toml` | opcjonalnie Workers Builds / `pages deploy` |
| `docker-compose.yml` → `CORS_ORIGIN` | origins Pages / domena / tunnel |
| `docs/cloudflare-pages.md` | ta ściąga |
