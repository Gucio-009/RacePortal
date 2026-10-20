# RacePortal na GCP Always Free (do lutego i dłużej)

Cel: **API + MySQL** na darmowej VM `e2-micro`, front zostaje na **Cloudflare Pages** (`raceportal.pl`).

Trial GCP ($300 / 90 dni) **nie starczy do lutego** (start ~październik → koniec ~styczeń). Używamy **Always Free**.

```text
[ Pages / raceportal.pl ]  --VITE_API_URL-->  [ GCE e2-micro :4000 ]
                                                  mysql + api (+ backup)
```

Pliki w repo:

| Plik | Rola |
|------|------|
| `docker-compose.gcp.yml` | mysql + mailpit + api + backup |
| `deploy/gcp/.env.gcp.example` | szablon sekretów → `.env.gcp` na VM |
| `deploy/gcp/mysql-lowmem.cnf` | mały `innodb_buffer_pool` pod 1 GB RAM |
| `deploy/gcp/setup-swap.sh` | 2 GB swap |
| `scripts/gcp-smoke.sh` | health + CORS smoke |

---

## 0. Wymagania

- Konto Google Cloud (karta może być wymagana do weryfikacji — Always Free nadal $0 przy limicie).
- `gcloud` CLI lokalnie **albo** tylko konsola web.
- Repo na VM: clone `Gucio-009/RacePortal` (branch `main`).

---

## 1. Projekt GCP + billing

1. [console.cloud.google.com](https://console.cloud.google.com) → utwórz projekt (np. `raceportal-free`).
2. Włącz billing (Always Free i tak nie powinien naliczać VM e2-micro w dozwolonym regionie — pilnuj alertów budżetu $0 / $1).
3. Włącz API: **Compute Engine API**.

```bash
gcloud config set project TWOJ_PROJECT_ID
gcloud services enable compute.googleapis.com
```

---

## 2. Firewall — port API

```bash
gcloud compute firewall-rules create raceportal-api-4000 \
  --allow=tcp:4000 \
  --target-tags=raceportal-api \
  --description="RacePortal Spring API"
```

(Opcjonalnie później: Caddy/nginx na 443 zamiast gołego 4000.)

---

## 3. VM Always Free

| Parametr | Wartość |
|----------|---------|
| Nazwa | `raceportal-api` |
| Region / strefa | **us-central1** (lub `us-west1` / `us-east1`) |
| Maszyna | **e2-micro** |
| Boot disk | **Debian 12** lub **Ubuntu 22.04**, typ **Standard persistent disk (HDD)**, **30 GB** |
| Firewall | tag sieciowy `raceportal-api` (jak wyżej) |
| External IP | Ephemeral OK (albo Reserve static — static IP bywa w free tier 1×) |

```bash
gcloud compute instances create raceportal-api \
  --zone=us-central1-a \
  --machine-type=e2-micro \
  --image-family=debian-12 \
  --image-project=debian-cloud \
  --boot-disk-size=30GB \
  --boot-disk-type=pd-standard \
  --tags=raceportal-api
```

SSH:

```bash
gcloud compute ssh raceportal-api --zone=us-central1-a
```

---

## 4. Docker + swap na VM

```bash
# Docker (Debian/Ubuntu)
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
# wyloguj/zaloguj SSH, żeby grupa docker zadziałała

git clone https://github.com/Gucio-009/RacePortal.git
cd RacePortal
git checkout main

sudo bash deploy/gcp/setup-swap.sh
free -h   # Swap ~2G
```

---

## 5. Env i start stacku

```bash
cp deploy/gcp/.env.gcp.example deploy/gcp/.env.gcp
nano deploy/gcp/.env.gcp   # ustaw silne MYSQL_* i JWT_SECRET
```

`CORS_ORIGIN` musi zawierać m.in.:

```text
https://www.raceportal.pl,https://raceportal.pl,https://*.pages.dev
```

Start (pierwszy build API może trwać **długo** na e2-micro — cierpliwie):

```bash
docker compose -f docker-compose.gcp.yml --env-file deploy/gcp/.env.gcp up -d --build
docker compose -f docker-compose.gcp.yml ps
docker compose -f docker-compose.gcp.yml logs -f api
```

Gdy healthy:

```bash
curl -sS http://127.0.0.1:4000/api/health
# z zewnątrz (EXTERNAL_IP z konsoli GCP):
curl -sS http://EXTERNAL_IP:4000/api/health
```

Po pierwszym udanym seedzie możesz w `.env.gcp` ustawić `SEED_ENABLED=false` i `docker compose … up -d` (opcjonalnie).

---

## 6. Cloudflare Pages — `VITE_API_URL`

1. Pages → Settings → Environment variables → **Production**
2. `VITE_API_URL` = `http://EXTERNAL_IP:4000`  
   (bez `/` na końcu; później lepiej `https://api.…` z Caddy)
3. **Save** → Deployments → **Retry deployment**
4. Network przy logowaniu: request na `EXTERNAL_IP:4000/api/auth/login`, nie na `raceportal.pl/api/...`

Konto seed (jeśli `SEED_ENABLED=true`): `test@wp.pl` / hasło z FAQ / DataInitializer.

---

## 7. HTTPS (opcjonalnie, zalecane)

Goły `http://IP:4000` działa, ale przeglądarki / mixed content bywają kapryśne, gdy front jest na `https://`.

Opcje:

1. Subdomena `api.raceportal.pl` → A record na EXTERNAL_IP + Caddy z Let’s Encrypt na VM (port 443, reverse proxy → `127.0.0.1:4000`).
2. Albo Cloudflare Tunnel Named (nie quick) z VM do `api.raceportal.pl`.

Po HTTPS zaktualizuj `VITE_API_URL` i CORS, Retry Pages.

---

## 8. Backup / utrzymanie do lutego

- Serwis `backup` w compose — dump co ~24h do volume `raceportal_backups_gcp`.
- Co jakiś czas: `docker compose -f docker-compose.gcp.yml ps` + `curl …/api/health`.
- Nie zmieniaj maszyny na e2-small / SSD bez potrzeby — wyjdzie poza Always Free.
- Alerty budżetu w GCP: limit np. $1 / miesiąc.

Przywracanie dumpa (szkic):

```bash
gunzip -c /var/lib/docker/volumes/…/_data/raceportal_YYYYMMDD.sql.gz \
  | docker compose -f docker-compose.gcp.yml exec -T mysql \
    mysql -uroot -p"$MYSQL_ROOT_PASSWORD" raceportal
```

(dokładna ścieżka volume: `docker volume inspect …`)

---

## 9. Smoke z lokalnego Maca

```bash
./scripts/gcp-smoke.sh http://EXTERNAL_IP:4000 https://www.raceportal.pl
```

Oczekiwane: health `db:up`, OPTIONS login → 200 + `access-control-allow-origin`.

---

## 10. Typowe problemy

| Objaw | Co zrobić |
|-------|-----------|
| OOM / api restartuje | `free -h` — swap; zmniejsz load; `docker stats` |
| Build api „wisi” | e2-micro jest wolne; poczekaj lub zbuduj obraz lokalnie i `docker load` |
| CORS / login fail z Pages | `CORS_ORIGIN` + recreate api; `VITE_API_URL` + **Retry** Pages |
| Naliczanie kosztów | Sprawdź typ dysku (HDD), region Always Free, brak Cloud SQL |
| Mixed content (https front → http API) | Wprowadź HTTPS na API (§7) |

Powiązane: [`cloudflare-pages.md`](./cloudflare-pages.md), [`FAQ-przeglad.md`](./FAQ-przeglad.md).
