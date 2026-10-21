# RacePortal — know-how: lokalnie i na maszynie Oracle

Jedno miejsce: **jak odpalić**, **jak wyłączyć**, **co się psuje gdy VM śpi**.

Pierwsze postawienie: [`oracle-deploy.md`](./oracle-deploy.md)  
FAQ seed / konta: [`FAQ-przeglad.md`](./FAQ-przeglad.md)

Ściąga ze starszej próby (front na Cloudflare Pages, API osobno) została w [`cloudflare-pages.md`](./cloudflare-pages.md). Tego układu już nie używamy.

---

## Architektura (stan po wdrożeniu)

```text
https://raceportal.pl
https://www.raceportal.pl
        →  Cloudflare Tunnel na VM
        →  nginx :8081 (kontener web)
              ├── /       front
              └── /api/   Spring :4000 + MySQL
```

| Część | Gdzie | Gdy VM wyłączona |
|-------|--------|------------------|
| Front i API | Oracle `raceportal`, Docker Compose | **Martwe** — domena nie odpowiada |
| Baza | volume Dockera na dysku VM | Zostaje |
| Tunnel `cloudflared` | systemd na VM | Wstaje sam po **Start** |
| Kontenery | `restart: unless-stopped` | Wstają same po starcie Dockera |

Git na VM: `~/RacePortal`, branch `main`, remote `Gucio-009/RacePortal`.

---

## A) Odpalanie lokalne (Docker)

### Start

```bash
cd /ścieżka/do/RacePortal
docker compose up --build -d
```

### Adresy

| Co | URL |
|----|-----|
| Aplikacja | http://127.0.0.1:8081/ |
| Login | http://127.0.0.1:8081/login |
| API health | http://127.0.0.1:4000/api/health |
| MySQL | host `3307` (TCP, nie HTTP) |

Lokalnie nginx na `:8081` proxy’uje `/api`. `VITE_API_URL` nie jest potrzebne.

### Konta seed

| Rola | Email | Hasło |
|------|-------|-------|
| Admin | `admin@raceportal.pl` | `admin123` |
| Organizator | `org@raceportal.pl` | `org123` |
| Kierowca | `test@wp.pl` | `test123` |

### Stop lokalnie

```bash
docker compose down          # kontenery stop, dane w volume zostają
docker compose down -v       # kasuje volumes razem z bazą
```

---

## B) Maszyna Oracle — włącz / wyłącz

| | |
|--|--|
| Instancja | `raceportal` |
| Region | Frankfurt, AD-2 |
| Kształt | `VM.Standard.A1.Flex`, 2 OCPU, 12 GB |
| Strona | `https://raceportal.pl` i `https://www.raceportal.pl` |
| Repo | `~/RacePortal` |
| SSH | `ubuntu@PUBLICZNE_IP`, klucz `.key` |

Publiczny adres IP zmienia się po **Stop**. Tunel łączy się z Cloudflare sam, więc DNS nie trzeba poprawiać po każdym starcie.

### B1. Włączenie

Konsola Oracle → Compute → Instances → `raceportal` → **Start**.

Poczekaj, aż status będzie Running, skopiuj nowy publiczny IP i sprawdź z zewnątrz:

```bash
curl -sS https://raceportal.pl/api/health
```

Oczekiwane: `"db":"up"`. Potem otwórz `https://raceportal.pl`.

Gdy health nie wstaje:

```bash
ssh -i .\ssh-key-2026-10-20.key ubuntu@PUBLICZNE_IP
sudo systemctl status cloudflared --no-pager
cd ~/RacePortal
sudo docker compose ps
sudo docker compose logs api --tail 50
curl -sS http://127.0.0.1:4000/api/health
curl -I http://127.0.0.1:8081
```

`cloudflared` ma być `active (running)`. Kontener `api` ma być healthy. `logs` oglądasz, Ctrl+C ich nie zabija.

### B2. Wyłączenie

Konsola → **Stop**. Nie **Terminate** (to kasuje maszynę i dysk).

Skutek: domena przestaje odpowiadać. Dane MySQL zostają na dysku. Nie rób `docker compose down -v`.

### B3. Co wstaje samo po Start

| Usługa | Jak |
|--------|-----|
| Docker | przy starcie systemu |
| `web`, `api`, `mysql`, `backup` | `restart: unless-stopped` |
| Cloudflare Tunnel | `cloudflared.service` |

Po zwykłym restarcie nie trzeba `git pull` ani stawiać tunelu od nowa. Pierwszy start Springa po dłuższym Stop potrafi potrwać kilka minut.

### B4. Aktualizacja kodu

```bash
cd ~/RacePortal
git fetch origin
git checkout main
git pull origin main
sudo docker compose up --build -d
```

### B5. Pamięć

```bash
free -h
sudo docker stats --no-stream
```

### B6. Maile

Kody weryfikacyjne, reset hasła i statusy zgłoszeń idą na adres użytkownika przez SMTP Mailbux (`kontakt@raceportal.pl`). Na VM w `~/RacePortal/.env` musi być `SMTP_PASSWORD` (hasło skrzynki albo App Password). `GET /api/health` pokazuje `smtp: up`, gdy serwer przyjmie logowanie.

---

## C) Checklista przed demo

1. Oracle → **Start** instancji `raceportal`.
2. `curl -sS https://raceportal.pl/api/health` → `db:up`.
3. `https://raceportal.pl` → login `admin@raceportal.pl` / `admin123` (dopóki seed jest włączony i hasło nie zostało zmienione).
4. Po demo → **Stop**.

---

## D) Typowe błędy

| Objaw | Co zrobić |
|-------|-----------|
| `Out of capacity` przy tworzeniu VM | Inna domena dostępności (AD-2, potem AD-3), ten sam kształt 2 OCPU / 12 GB |
| Publiczny IPv4 się nie włącza | Najpierw kreator VCN, potem istniejąca podsieć **public** |
| `UNPROTECTED PRIVATE KEY FILE` | `icacls` na pliku `.key`; nie loguj się plikiem `.pub` |
| `permission denied` na docker.sock | `sudo docker compose …` |
| Domena nie otwiera strony, `www` tak | Stary CNAME na skasowany tunel. Cel ma być `824ebee9-6492-4406-86ba-e300a5e65b7e.cfargotunnel.com` |
| `cloudflared` pada przy starcie | Brak pliku `UUID.json` w `/etc/cloudflared`. Tunel bez klucza na dysku trzeba utworzyć od nowa |
| Login demo nie działa | Seed wyłączony albo hasło już zmienione. Przy pierwszym pustym starcie bez seeda nie ma admina |
| API nie wstaje po „utwardzeniu” | `SEED_ENABLED=true` i `ALLOW_INSECURE_DEFAULTS=false` naraz są zabronione |

---

## E) Pliki

| Plik | Po co |
|------|--------|
| `docker-compose.yml` | Stack na VM i lokalnie (web + api + mysql + backup); maile przez SMTP Mailbux |
| `docker-compose.gcp.yml` | Stary wariant samego API. Na Oracle go nie uruchamiamy |
| `docs/oracle-deploy.md` | Pierwsze postawienie maszyny i tunelu |
| `docs/gcp-deploy.md` | Skrót: tamten opis jest nieaktualny |
