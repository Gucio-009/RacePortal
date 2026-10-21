# RacePortal — know-how: lokalnie i na wirtualce Oracle

Jedno miejsce: **jak odpalić**, **jak wyłączyć**, **co się psuje gdy VM śpi**, oraz skrót rzeczy, o które wywalaliśmy się przy Cloudflare / Pages / tunelu.

Szczegóły Pages: [`cloudflare-pages.md`](./cloudflare-pages.md)  
FAQ seed / konta: [`FAQ-przeglad.md`](./FAQ-przeglad.md)

---

## Architektura „produkcja dyplomowa” (stan po wdrożeniu)

```text
https://www.raceportal.pl     →  Cloudflare Pages (frontend, statyczny)
https://api.raceportal.pl     →  Cloudflare Tunnel → VM Oracle → Docker :4000 (Spring)
                                      └── MySQL + Mailpit (wewnętrznie) + backup
```

| Część | Gdzie | Gdy VM wyłączona |
|-------|--------|------------------|
| Front | Cloudflare Pages | Działa (HTML/JS), ale **bez danych / logowania** |
| API + baza | Oracle Cloud VM + Docker | **Martwe** — `api.raceportal.pl` nie odpowiada |
| Tunnel `cloudflared` | systemd na VM | Wstaje **sam** po starcie VM |
| Kontenery | `restart: unless-stopped` | Wstają **same** po starcie Dockera/VM |

**Git:** kod ląduje na `Gucio-009/RacePortal` `main`. Pages często buduje z forka `WojciechWronisz/RacePortal` — przed deployem rób **Sync fork**. Na VM: `git pull` z tego remote, z którego klonowałeś (zalecane: `Gucio-009`).

---

## A) Odpalanie lokalne (Docker na Macu)

### Start

```bash
cd /ścieżka/do/RacePortal
# Docker Desktop włączony
docker compose up --build -d
```

Czekaj aż API będzie healthy (pierwszy build dłuższy).

### Adresy

| Co | URL |
|----|-----|
| Aplikacja | http://127.0.0.1:8081/ |
| Login | http://127.0.0.1:8081/login |
| API health | http://127.0.0.1:4000/api/health → `"db":"up"` |
| Mailpit (maile) | http://127.0.0.1:8025/ |
| MySQL | host `3307` (TCP, nie HTTP) |

Lokalnie nginx na `:8081` proxy’uje `/api` → API — **nie** trzeba `VITE_API_URL`.

### Konta seed

| Rola | Email | Hasło |
|------|-------|-------|
| Admin | `admin@raceportal.pl` | `admin123` |
| Organizator | `org@raceportal.pl` | `org123` |
| Kierowca | `test@wp.pl` | `test123` |

### Stop lokalnie

```bash
docker compose down          # zatrzymaj kontenery (dane w volume zostają)
docker compose down -v       # UWAGA: usuwa volumes (baza lokalna ginie)
```

### Opcjonalnie: demo lokalnego API w internecie (bez VM)

```bash
# API musi działać na :4000
cloudflared tunnel --url http://localhost:4000
```

URL `https://….trycloudflare.com` → tymczasowo w Pages `VITE_API_URL` + **Retry deployment**.  
Quick tunnel **nie** jest 24/7 — po restarcie URL się zmienia.

---

## B) Wirtualka Oracle — codzienna obsługa (włącz / wyłącz)

| | |
|--|--|
| Publiczne API (HTTPS) | `https://api.raceportal.pl` |
| Front | `https://www.raceportal.pl` |
| Repo na VM | `~/RacePortal` |
| Env | `~/RacePortal/deploy/vm/.env.vm` (**nie commitować**) |
| Compose | `docker-compose.vm.yml` |

Zatrzymanie VM w OCI **nie kasuje dysku**; dane MySQL zostają w volume Docker.

### B1. Włączenie VM (przed prezentacją / pracą)

**Konsola:** [Oracle Cloud → Compute → Instances](https://cloud.oracle.com/) → **Start**.

Poczekaj ~1–3 min (mała VM + Spring bywa wolne).

**Smoke (z Maca — bez SSH):**
```bash
curl -sS https://api.raceportal.pl/api/health
# oczekuj: "status":"ok" oraz "db":"up"
```

Albo:
```bash
./scripts/api-smoke.sh https://api.raceportal.pl https://www.raceportal.pl
```

Gdy health OK → otwórz `https://www.raceportal.pl` (hard refresh jeśli coś cache’uje).

**Jeśli health nie wstaje** — SSH i diagnostyka:
```bash
ssh USER@IP_VM

sudo systemctl status cloudflared --no-pager
cd ~/RacePortal
docker compose -f docker-compose.vm.yml --env-file deploy/vm/.env.vm ps
docker compose -f docker-compose.vm.yml --env-file deploy/vm/.env.vm logs api --tail 50
curl -sS http://127.0.0.1:4000/api/health
```

- `cloudflared` = `active (running)` (wstaje z systemd).
- Kontenery = `Up` / api `healthy`.
- `logs -f` = tylko podgląd → **Ctrl+C nie zabija API**.

### B2. Wyłączenie VM (oszczędność)

Gdy nie potrzebujesz logowania / API na produkcji:

**Konsola OCI:** Instance → **Stop**.

Skutek:

- `www.raceportal.pl` — strona się ładuje, ale listy / login / galeria padają (brak API).
- `api.raceportal.pl` — timeout / błąd.
- Dane MySQL **zostają** na dysku VM (volume Docker).

**Nie** rób na co dzień `docker compose down -v` na VM — to może skasować dane bazy.

### B3. Po restarcie VM — co startuje samo

| Usługa | Jak |
|--------|-----|
| Docker | zwykle przy bootcie |
| `mysql`, `api`, `mailpit`, `backup` | `restart: unless-stopped` |
| Cloudflare Tunnel | `systemctl enable cloudflared` |

**Nie trzeba** za każdym razem: `git pull`, `compose up`, instalować tunelu — o ile nic nie zmieniałeś w kodzie.

Pierwszy cold start API na małej VM: **kilka minut** do `Started RacePortalApplication`.

### B4. Aktualizacja kodu na VM (po merge na GitHub)

```bash
ssh USER@IP_VM
cd ~/RacePortal
git pull origin main
docker compose -f docker-compose.vm.yml --env-file deploy/vm/.env.vm up -d --build
```

Front (Pages): Sync fork (jeśli budujesz z forka) → push/`main` → Automatic deploy **albo** Retry.

Zmiana tylko UI → **nie** musisz ruszać VM.  
Zmiana API → `pull` + `up --build` na VM.

### B5. Env na VM (ważne reguły)

Plik: `deploy/vm/.env.vm`

```text
SEED_ENABLED=true
ALLOW_INSECURE_DEFAULTS=true
```

**Razem** — inaczej API padnie (`securityDefaultsValidator`: seed zabroniony przy `ALLOW_INSECURE_DEFAULTS=false`).

`CORS_ORIGIN` musi mieć m.in.:
`https://www.raceportal.pl,https://raceportal.pl,https://*.pages.dev`

`GOOGLE_OAUTH_CLIENT_ID` — opcjonalnie (puste = tylko email/hasło).

Po zmianie `.env.vm`:
```bash
docker compose -f docker-compose.vm.yml --env-file deploy/vm/.env.vm up -d api
```

### B6. Mailpit na VM

UI **nie** jest publiczne. Podgląd:

1. Na VM w compose (tymczasowo) pod `mailpit`:
   ```yaml
   ports:
     - "127.0.0.1:8025:8025"
   ```
2. `docker compose … up -d mailpit`
3. Z Maca:
   ```bash
   ssh -L 8025:127.0.0.1:8025 USER@IP_VM
   ```
4. http://localhost:8025

Lokalnie Mailpit: http://127.0.0.1:8025 (compose zwykły).

---

## C) Cloudflare Pages ↔ API (checklista)

Produkcja:

| Ustawienie | Wartość |
|------------|---------|
| Build command | `npm ci && VITE_API_URL=https://api.raceportal.pl npm run build --workspace=web` |
| Build output | `web/dist` |
| Root | puste |
| Variable `VITE_API_URL` | `https://api.raceportal.pl` |

**Dlaczego Build command z `VITE_API_URL=…`?** Samo pole Variables w CF czasem **nie** wchodziło do Vite — JS zostawał bez bazy API i bił w `https://www.raceportal.pl/api/...` → 405.

Po każdej zmianie env: **Retry deployment** (+ hard refresh).  
Weryfikacja: Network → Fetch/XHR → URL zaczyna się od `https://api.raceportal.pl/...`.

Tunnel Zero Trust:

- Connector na **Linux VM** (nie Windows).
- Public hostname: `api.raceportal.pl` → service **`http://localhost:4000`** (nie `https://`).
- `cloudflared.service` = enabled → 24/7 gdy VM RUNNING.

---

## D) Typowe błędy (ściąga z wdrożenia)

| Objaw | Przyczyna / co zrobić |
|-------|------------------------|
| `www.raceportal.pl/api/...` 405 | Brak `VITE_API_URL` w **buildzie** → Build command + Retry |
| Galeria / login „Sprawdź API” | VM STOPPED albo API jeszcze startuje |
| Mixed content | Front HTTPS + API `http://IP` → używaj `https://api.raceportal.pl` |
| `SEED_ENABLED` + validator | Oba `true` albo oba „bezpieczne” (`seed=false`, `insecure=false`) |
| `npm ci` + expo/datetimepicker | Fork bez sync / Root ≠ `/` — buduj z aktualnego `main` |
| Worker ≠ Pages | Deploy frontu = produkt **Pages** + `web/dist` |
| Curl `127.0.0.1:4000` z Maca | To nie VM — najpierw `ssh USER@IP_VM` |
| `logs -f` / Ctrl+C | Tylko odłącza logi; API dalej działa |
| OOM / wolny start | Swap (`deploy/vm/setup-swap.sh`); cierpliwość 3–6 min |
| Mailpit „nic nie ma” na IP:8025 | Nie wystawiony — SSH tunnel §B6 |

---

## E) Mini checklista „za 2 minuty przed demo”

1. OCI → Start VM.  
2. `curl -sS https://api.raceportal.pl/api/health` → `db:up`.  
3. `https://www.raceportal.pl` → login `test@wp.pl` / `test123`.  
4. Po demo → **Stop** VM.

---

## F) Powiązane pliki w repo

| Plik | Po co |
|------|--------|
| `docker-compose.yml` | Stack lokalny (web+api+mysql+mailpit+backup) |
| `docker-compose.vm.yml` | Stack na VM (bez web) |
| `deploy/vm/.env.vm.example` | Szablon sekretów VM |
| `scripts/api-smoke.sh` | Health + CORS |
| `docs/cloudflare-pages.md` | Pages / monorepo / tokeny |
