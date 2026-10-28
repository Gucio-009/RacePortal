# RacePortal — know-how: lokalnie i na maszynie Oracle

Jedno miejsce: **jak odpalić**, **jak wyłączyć**, **co się psuje gdy VM śpi**.

Pierwsze postawienie: [`oracle-deploy.md`](./oracle-deploy.md)  
FAQ seed / konta: [`FAQ-przeglad.md`](./FAQ-przeglad.md)  
**Dlaczego Oracle / Mailbux / PWA (proces decyzji):** [`decyzje-wdrozeniowe.md`](./decyzje-wdrozeniowe.md)

Starszy układ (Pages + osobne API) **nie obowiązuje** — uzasadnienie: [`decyzje-wdrozeniowe.md`](./decyzje-wdrozeniowe.md) §1–3.

---

## Architektura (stan po wdrożeniu)

```text
https://raceportal.pl
https://www.raceportal.pl
https://bo.raceportal.pl   # backoffice ADMIN (ten sam nginx :8081)
        →  Cloudflare Tunnel na VM
        →  nginx :8081 (kontener web)
              ├── /       front
              └── /api/   Spring :4000 + MySQL
```

| Część | Gdzie | Gdy VM wyłączona |
|-------|--------|------------------|
| Front i API | Oracle `raceportal`, Docker Compose | **Martwe** — domena nie odpowiada |
| Baza | volume Dockera na dysku VM | Zostaje |
| Zdjęcia | volume `raceportal_uploads` (`/app/uploads`) | Zostają. `docker compose down -v` kasuje je razem z bazą |
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

Lokalnie nginx na `:8081` proxy’uje `/api` (`location ^~ /api/`, żeby jpg/png z uploadu nie szły w statyki SPA). `VITE_API_URL` nie jest potrzebne.

API przy starcie oddaje `/app/uploads` użytkownikowi `spring` (`gosu`) i dopiero wtedy wstaje JVM. Pliki są pod `/api/uploads/`.

Maile: SMTP Mailbux (`noreply@raceportal.pl`). W katalogu projektu plik `.env` z `SMTP_PASSWORD=…`. Health: `"smtp":"up"`.

Web jest **PWA** (manifest + SW): na telefonie „Dodaj do ekranu początkowego” — bottom nav + safe-area.

### Konta seed

| Rola | Email | Hasło |
|------|-------|-------|
| Admin | `admin@raceportal.pl` | `admin123` |
| Organizator | `org@raceportal.pl` | `org123` |
| Kierowca | `test@wp.pl` | `test123` |

### Stop lokalnie

```bash
docker compose down          # kontenery stop; baza i zdjęcia w volume zostają
docker compose down -v       # kasuje volumes: baza i wgrane zdjęcia
```

---

## B) Maszyna Oracle — włącz / wyłącz

| | |
|--|--|
| Instancja | `raceportal` |
| Region | Frankfurt, AD-2 |
| Kształt | `VM.Standard.A1.Flex`, 2 OCPU, 12 GB |
| Strona | `https://raceportal.pl`, `https://www.raceportal.pl`, `https://bo.raceportal.pl` |
| Repo | `~/RacePortal` |
| SSH | `ubuntu@PUBLICZNE_IP`, klucz `.key` |

Publiczny adres IP zmienia się po **Stop**. Tunel łączy się z Cloudflare sam, więc DNS nie trzeba poprawiać po każdym starcie.

### B1. Włączenie

Konsola Oracle → Compute → Instances → `raceportal` → **Start**.

Poczekaj, aż status będzie Running, skopiuj nowy publiczny IP i sprawdź z zewnątrz:

```bash
curl -sS https://raceportal.pl/api/health
```

Oczekiwane: `{"status":"ok"}` (publicznie bez `db`/`smtp` — pentest #10). Szczegóły: `GET /api/health/details` z JWT admina. Potem otwórz `https://raceportal.pl`.

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
sudo bash deploy/vm/docker-prune.sh   # stare obrazy + cache BuildKit (volumes zostają)
```

Po każdym `--build` zostają poprzednie warstwy obrazów. Bez prune dysk Always Free szybko się zatyka.

### B5. Pamięć i dysk

```bash
free -h
sudo docker stats --no-stream
df -h /
sudo docker system df
```

Jednorazowe czyszczenie (gdy `df` pokazuje mało miejsca):

```bash
cd ~/RacePortal
sudo bash deploy/vm/docker-prune.sh
```

Codzienny cron (raz na VM):

```bash
cd ~/RacePortal
sudo bash deploy/vm/install-docker-prune-cron.sh
```

Skrypt **nie** rusza volumes (`raceportal_mysql`, uploads, backups). Nie używaj `docker system prune --volumes` ani `compose down -v`.

### B6. Maile

Kody weryfikacyjne, reset hasła i statusy zgłoszeń idą na adres użytkownika przez SMTP Mailbux (`noreply@raceportal.pl`). Na VM w `~/RacePortal/.env` musi być `SMTP_PASSWORD` (hasło skrzynki albo App Password). Stan SMTP: `GET /api/health/details` (ADMIN) → `smtp: up`.

### B7. Język PL / EN

- Web: segmentowy przełącznik **PL | EN** w nagłówku (i w Ustawieniach). Preferencja w `localStorage` (`raceportal_settings.locale`).
- Zalogowany: `PATCH /api/auth/me` z `{ "locale": "en" }` zapisuje `users.locale` — maile systemowe (aktywacja, reset, statusy) idą w wybranym języku; przy logowaniu UI przejmuje locale z konta.
- Mobile Expo: ten sam przełącznik w katalogu wydarzeń (SecureStore / localStorage).
- Domyślnie `pl`. Treści eventów / regulamin prawniczy (strony legal) zostają po polsku (EN: krótka nota). Regulaminy PDF per event — pliki org., bez tłumaczenia platformy.

### B8. Motyw (akcent)

- Sześć palet w `/ustawienia` (ciemne: Złoty tor, Redline, Ice cold; jasne: Arctic White, Desert Sand, Blush Pink).
- Gość: `raceportal_settings.accent`. Zalogowany: też `users.theme` (`PATCH /api/auth/me` `{ "theme": "gold" }` itd.); przy wylogowaniu przywracany jest snapshot gościa sprzed logowania.
- Boot bez flicker: `web/public/boot-theme.js` czyta localStorage przed Reactem.

---

## C) Checklista przed demo

1. Oracle → **Start** instancji `raceportal`.
2. `curl -sS https://raceportal.pl/api/health` → `{"status":"ok"}` (szczegóły: `/api/health/details` jako admin).
3. `https://raceportal.pl` → login `admin@raceportal.pl` / `admin123` (dopóki seed jest włączony i hasło nie zostało zmienione).
4. Po demo → **Stop**.

---

## D) Typowe błędy

| Objaw | Co zrobić |
|-------|-----------|
| Dysk pełny / `no space left on device` przy buildzie | `df -h /`, potem `sudo bash deploy/vm/docker-prune.sh`. Cron: `install-docker-prune-cron.sh`. **Nie** `prune --volumes` |
| `Out of capacity` przy tworzeniu VM | Inna domena dostępności (AD-2, potem AD-3), ten sam kształt 2 OCPU / 12 GB |
| Publiczny IPv4 się nie włącza | Najpierw kreator VCN, potem istniejąca podsieć **public** |
| `UNPROTECTED PRIVATE KEY FILE` | `icacls` na pliku `.key`; nie loguj się plikiem `.pub` |
| `permission denied` na docker.sock | `sudo docker compose …` |
| Domena nie otwiera strony, `www` tak | Stary CNAME na skasowany tunel. Cel ma być `824ebee9-6492-4406-86ba-e300a5e65b7e.cfargotunnel.com` |
| `cloudflared` pada przy starcie | Brak pliku `UUID.json` w `/etc/cloudflared`. Tunel bez klucza na dysku trzeba utworzyć od nowa |
| Login demo nie działa | Seed wyłączony albo hasło już zmienione. Przy pierwszym pustym starcie bez seeda nie ma admina |
| API nie wstaje po „utwardzeniu” | `SEED_ENABLED=true` i `ALLOW_INSECURE_DEFAULTS=false` naraz są zabronione |
| `smtp: down` / brak maila aktywacyjnego | Brak lub złe `SMTP_PASSWORD` w `.env`; sprawdź też `PUBLIC_BASE_URL` (link w mailu); restart `api` |
| Link aktywacyjny → `localhost` | Na VM brak / złe `PUBLIC_BASE_URL`; compose domyślnie `https://raceportal.pl`. Ustaw w `.env`, `docker compose up -d --force-recreate api`, sprawdź `/api/health` → `publicBaseUrl` |
| Link aktywacyjny → Chrome **403** | Często WAF/skaner na `?token=`. Nowe maile: `/verify-email/{token}`. Wyślij ponownie link; `git pull` + recreate `api`+`web` |
| PWA nie instaluje się | Tylko HTTPS (produkcja) albo localhost; SW rejestruje się w buildzie produkcyjnym |
| `robots.txt` = HTML | Brak pliku w `web/public/` albo stary obraz web — przebuduj `web` |

---

## E) Pliki

| Plik | Po co |
|------|--------|
| `docker-compose.yml` | Stack na VM i lokalnie (web + api + mysql + backup); maile SMTP Mailbux |
| `docker-compose.vm.yml` | Opcjonalny API-only — **nie** używany na żywej Oracle. Ma volume `raceportal_uploads_vm`, gdyby ktoś go odpalił |
| `deploy/vm/docker-prune.sh` | Czyści stare obrazy/cache po rebuildach; **bez** volumes |
| `deploy/vm/install-docker-prune-cron.sh` | Codzienny cron 04:15 → `docker-prune.sh` |
| `packages/i18n/` | Słowniki PL/EN (web + mobile) |
| `packages/api-types/src/tireTypes.ts` | Klucze opon (garaż + event) |
| `backend/.../i18n/MailTexts.java` | Tematy/treści maili PL/EN wg `users.locale` |
| `users.locale` / `users.theme` | Preferencje konta (`PATCH /api/auth/me`) |
| `deploy/vm/.env.vm.example` | Szablon sekretów (gdy ktoś odpala wariant VM compose) |
| `web/public/manifest.webmanifest` + `sw.js` | PWA |
| `web/public/robots.txt` + `sitemap.xml` | SEO (nie SPA fallback) |
| `docs/oracle-deploy.md` | Pierwsze postawienie maszyny i tunelu |
