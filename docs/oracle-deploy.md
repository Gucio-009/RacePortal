# RacePortal na Oracle Cloud Always Free

Aktualne wdrożenie (październik 2026). **Strona, API i MySQL stoją na jednej maszynie.** Cloudflare nie hostuje frontu. Tunel tylko podaje `https://raceportal.pl` do nginx na VM.

**Dlaczego nie GCP + Pages?** Krótko: za mało RAM na e2-micro, dwa deploje i `VITE_API_URL` psuły demo. Pełne uzasadnienie (opcje, skutki, co zostało jako historia): [`decyzje-wdrozeniowe.md`](./decyzje-wdrozeniowe.md).

```text
https://raceportal.pl
https://www.raceportal.pl
        →  Cloudflare Tunnel (cloudflared na VM)
        →  http://127.0.0.1:8081   (kontener web, nginx)
              ├── /        statyczny front (Vite)
              └── /api/    proxy → kontener api:4000 (Spring + MySQL)
```

`VITE_API_URL` zostaje puste. Front woła względne `/api` na tej samej domenie.

Codzienne włączanie i wyłączanie: [`know-how-uruchamianie.md`](./know-how-uruchamianie.md).

Starszy wariant (API na GCP, front na Pages) nie jest używany. Pliki GCP usunięte / przemianowane — na VM idzie zwykły [`docker-compose.yml`](../docker-compose.yml) (web + api + mysql + backup). Opcjonalny [`docker-compose.vm.yml`](../docker-compose.vm.yml) (API-only) **nie** jest stackiem produkcyjnym.

---

## Maszyna (stan z konsoli)

| Parametr | Wartość |
|----------|---------|
| Nazwa | `raceportal` |
| Region | Germany Central (Frankfurt), home region |
| Domena dostępności | AD-2 (w AD-1 zabrakło pojemności Ampere) |
| Kształt | `VM.Standard.A1.Flex`, **2 OCPU, 12 GB** |
| Obraz | Canonical Ubuntu 24.04 |
| Sieć | VCN `raceportal`, podsieć `public subnet-raceportal` |
| Publiczny IPv4 | tak, efemeryczny (po **Stop** adres się zmienia) |
| Użytkownik SSH | `ubuntu` |
| Katalog na VM | `~/RacePortal`, branch **`main`** |
| Security List | tylko TCP **22** |

Limit Always Free dla Ampere to 2 OCPU i 12 GB na cały miesiąc. Wyższy suwak, drugi taki kształt albo dysk ponad darmowe 200 GB wychodzą poza pulę, a karta jest podpięta pod konto. Dysk systemowy zostaw domyślny (~47 GB). **Shielded instance** i **burstable** zostaw wyłączone.

---

## 1. Sieć, zanim powstanie maszyna

Przełącznik publicznego IPv4 w kreatorze instancji nie włącza się, dopóki podsieć nie istnieje.

1. Networking → Virtual cloud networks → **Actions** → **Start VCN Wizard**.
2. **Create VCN with Internet Connectivity**, nazwa `raceportal`.
3. W kreatorze instancji: **Select existing virtual cloud network** → `raceportal`, podsieć ze słowem **public**.
4. **Automatically assign public IPv4 address** = włączone. IPv6 zostaw wyłączone.
5. **Generate a key pair** i pobierz klucz prywatny (`.key`, nie `.pub`). Drugi raz go nie oddadzą.

Gdy create zwróci `Out of capacity` w AD-1, powtórz z **AD-2**, potem **AD-3**. Regionu nie zmieniaj.

W Security List podsieci publicznej dodaj wyłącznie ingress TCP **22** z `0.0.0.0/0`, jeśli kreator go nie dodał. Portów 80, 443, 4000, 8081, 3307 i 8025 nie otwieraj. Ruch HTTPS idzie tunelem, który sam wychodzi z maszyny.

SSH z Windows (katalog z kluczem):

```cmd
icacls ssh-key-2026-10-20.key /inheritance:r
icacls ssh-key-2026-10-20.key /grant:r "%USERNAME%:R"
ssh -i .\ssh-key-2026-10-20.key ubuntu@PUBLICZNE_IP
```

Bez `icacls` OpenSSH odrzuca klucz z Pobranych (`UNPROTECTED PRIVATE KEY FILE`). Plik `.pub` nie służy do logowania.

---

## 2. Docker i stack

Na maszynie:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2 git
git clone https://github.com/Gucio-009/RacePortal.git
cd RacePortal
git checkout main
sudo docker compose up --build -d
```

Konto `ubuntu` nie jest w grupie `docker`, dopóki nie wylogujesz się po `usermod`. Dlatego komendy idą przez `sudo`. Build Javy trwa kilka minut.

Sprawdzenie na VM:

```bash
curl -I http://127.0.0.1:8081
curl -sS http://127.0.0.1:4000/api/health
```

Oczekiwane: `HTTP/1.1 200` oraz health ze `"db":"up"`.

Kontenery: `web` (nginx, host `8081`), `api` (`4000`), `mysql` (`3307` tylko na interfejsie hosta, z internetu zablokowane listą), `backup`.

---

## 3. Tunel Cloudflare

Domena `raceportal.pl` jest w tym samym koncie Cloudflare. Paczka jest **arm64** (kształt Ampere).

```bash
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared.deb
cloudflared tunnel login
cloudflared tunnel create raceportal
cloudflared tunnel route dns --overwrite-dns raceportal raceportal.pl
cloudflared tunnel route dns --overwrite-dns raceportal www.raceportal.pl
```

`login` wypisuje adres. Otwórz go na swoim komputerze i wybierz strefę `raceportal.pl`.

UUID z `create` wstaw do konfiguracji (plik klucza powstaje w `~/.cloudflared/<UUID>.json`):

```bash
sudo mkdir -p /etc/cloudflared
sudo cp ~/.cloudflared/UUID.json /etc/cloudflared/UUID.json
sudo tee /etc/cloudflared/config.yml > /dev/null <<EOF
tunnel: UUID
credentials-file: /etc/cloudflared/UUID.json
ingress:
  - hostname: raceportal.pl
    service: http://127.0.0.1:8081
  - hostname: www.raceportal.pl
    service: http://127.0.0.1:8081
  - service: http_status:404
EOF
sudo cloudflared --config /etc/cloudflared/config.yml service install
sudo systemctl restart cloudflared
```

Działający tunel (październik 2026): `824ebee9-6492-4406-86ba-e300a5e65b7e`. W DNS oba rekordy to **CNAME** na `824ebee9-6492-4406-86ba-e300a5e65b7e.cfargotunnel.com`, chmurka pomarańczowa. Starszy identyfikator `7accbfb4-…` został skasowany, bo na maszynie nie było jego pliku klucza. Wskazanie DNS na skasowany tunel nie dochodzi do VM.

`sudo systemctl status cloudflared` ma pokazać `active (running)`. Z zewnątrz: `https://raceportal.pl` i `https://raceportal.pl/api/health`.

---

## 4. Aktualizacja kodu

```bash
cd ~/RacePortal
git fetch origin
git checkout main
git pull origin main
sudo docker compose up --build -d
```

Volume MySQL zostaje. Tunel jest poza repozytorium i nie wymaga ponownej instalacji.

---

## 5. Sekrety

W `docker-compose.yml` blok `environment` serwisu `api` **nadpisuje** `backend/.env.example`. Samo edytowanie example nic nie zmienia. Domyślnie jest seed i sekret z repozytorium (`admin@raceportal.pl` / `admin123`, `JWT_SECRET=raceportal-dev-secret-change-me`).

Żeby odciąć demo: zaloguj się, zmień hasło admina, potem w tym bloku ustaw własny `JWT_SECRET` (`openssl rand -base64 48`), `SEED_ENABLED: "false"` i `ALLOW_INSECURE_DEFAULTS: "false"`, i zrób `sudo docker compose up -d --force-recreate api`. Przy `ALLOW_INSECURE_DEFAULTS=false` seed musi być wyłączony, inaczej API nie wstanie. Wyłączenie seeda **przed** pierwszym startem zostawia pustą bazę bez administratora.

Maile (link aktywacyjny, reset hasła, status zgłoszenia) idą SMTP. Nadawca: `noreply@raceportal.pl`, serwer `my.mailbux.com:587` (STARTTLS). Na VM, w `~/RacePortal/.env` (nie w gicie):

```bash
SMTP_PASSWORD=haslo-skrzynki-albo-app-password
PUBLIC_BASE_URL=https://raceportal.pl
# Po zmianie: sudo docker compose up -d --force-recreate api
# Sprawdź: curl -sS https://raceportal.pl/api/health | jq .publicBaseUrl
# (musi być https://raceportal.pl — nie localhost)
```

Potem `sudo docker compose up -d --force-recreate api`. Bez `SMTP_PASSWORD` API wstanie, ale `smtp` w health będzie `down`. Compose domyślnie ustawia `PUBLIC_BASE_URL=https://raceportal.pl`; nadpisz w `.env` tylko gdy potrzeba. Weryfikacja: `curl -sS https://raceportal.pl/api/health` → pole `publicBaseUrl` (nie `localhost`).

---

## 6. Pamięć i zatrzymanie

```bash
free -h
sudo docker stats --no-stream
```

**Stop** w konsoli Oracle zatrzymuje naliczanie OCPU. **Terminate** kasuje maszynę i dysk. Po Stop publiczny adres IP się zmienia. Tunel od tego nie zależy. Danych w volume nie ruszaj przez `docker compose down -v`.
