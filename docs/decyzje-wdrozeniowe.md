# Decyzje wdrożeniowe — proces i uzasadnienia

**Cel:** zebrać **dlaczego** zmienialiśmy infrastrukturę / maile / PWA — nie tylko „jak jest teraz”.  
Przydatne przy dyplomie, obronie i onboardingiu zespołu.  
Szczegóły chronologii: [`changes.md`](./changes.md) (§44 i wcześniejsze). Procedury: [`oracle-deploy.md`](./oracle-deploy.md), [`know-how-uruchamianie.md`](./know-how-uruchamianie.md).

Zasada zapisu (jak w [`Guidelines.md`](./Guidelines.md)): każda istotna zmiana = **problem → opcje → decyzja → skutki**. Samo „zmieniliśmy plik X” nie wystarczy.

---

## 1. Hosting: GCP + Cloudflare Pages → Oracle Always Free (jedna VM)

| | |
|--|--|
| **Kiedy** | październik 2026 |
| **Problem** | Trial / Always Free na GCP (e2-micro) + front na Pages + osobny tunnel na `:4000` był kruchy: VM z 1 GB RAM, cold start Springa, dwa miejsca deployu (`VITE_API_URL` w buildzie Pages), mieszanie Worker ≠ Pages, korozja docs. |
| **Opcje** | (A) zostać na GCP e2-micro + Pages; (B) osobny hosting frontu + VPS API; (C) **jedna maszyna Oracle Ampere** z pełnym Compose + Tunnel na nginx `:8081`. |
| **Decyzja** | **(C)** — `VM.Standard.A1.Flex` 2 OCPU / 12 GB (Frankfurt), cały stack w `docker-compose.yml`, Cloudflare tylko jako Tunnel/DNS. |
| **Dlaczego** | Więcej RAM niż e2-micro → mniej OOM / szybszy start API. Jeden `git pull` + `compose up` aktualizuje front i API. Brak `VITE_API_URL` w prod (relative `/api` przez nginx). Always Free Ampere mieści się w limicie przy ostrożnym kształcie. |
| **Skutki** | Pliki GCP/Pages z repo usunięte; procedura = wyłącznie `oracle-deploy.md` + `know-how-uruchamianie.md`. `docker-compose.vm.yml` = opcjonalny API-only, **nie** prod. |
| **Świadomie nie** | Kubernetes, osobny CDN frontu, managed DB — za dużo na zakres dyplomu. |
| **Pułapki z okresu Pages** (nie powtarzać) | Worker ≠ Pages w UI Cloudflare; `VITE_API_URL` w buildzie czasem nie wchodził → requesty na zły origin; osobny tunnel na `:4000` vs front na `:8081`. |

---

## 2. Maile: Mailpit (dev UI) → SMTP Mailbux (prawdziwa skrzynka)

| | |
|--|--|
| **Kiedy** | październik 2026 |
| **Problem** | Na prod Mailpit łapał maile tylko wewnątrz Dockera — użytkownik **nie** dostawał maila aktywacyjnego na Gmail/Outlook. Demo „rejestracja” wyglądała jak bug produktu. |
| **Opcje** | (A) SSH + podgląd Mailpita na VM; (B) Brevo / Resend / SendGrid; (C) **skrzynka domenowa Mailbux** (`noreply@raceportal.pl`) + SMTP w Spring. |
| **Decyzja** | **(C)** — `SMTP_HOST=my.mailbux.com`, auth + STARTTLS; hasło wyłącznie w `.env` (`SMTP_PASSWORD`), nie w git. |
| **Dlaczego** | Zero dodatkowego SaaS „marketingowego” na Free z limitem użytkowników; ta sama domena co strona; health `smtp: up/down` diagnozuje od razu. Mailpit usunięty z Compose, żeby nie mylić „mail działa lokalnie w UI” z „mail dochodzi do człowieka”. |
| **Skutki** | Lokalnie też Mailbux (ten sam mechanizm co prod). Scenariusz prezentacji: pokazywać realną skrzynkę albo mieć `smtp: up` przed live. |
| **Świadomie nie** | Kolejka mailowa / worker — overkill; soft-fail w `MailService` zostaje (błąd SMTP nie wywala requestu HTTP). |

---

## 3. Front: osobny Pages → ten sam origin co API

| | |
|--|--|
| **Problem** | Pages budował SPA z `VITE_API_URL`; zmienne CF czasem nie wchodziły do Vite → requesty na `www…/api` → 405 / HTML zamiast JSON. CORS i dwa deploje. |
| **Decyzja** | Nginx na VM serwuje `web/dist` i proxy `/api` → Spring. Tunnel celuje w `:8081`. |
| **Dlaczego** | Klasyczny układ „jeden origin” = mniej klas błędów z dyplomowego dema. |
| **Skutek** | Jeden origin `raceportal.pl` — relative `/api`. |

---

## 4. Web na telefonie: zwykły responsive → PWA + bottom nav

| | |
|--|--|
| **Kiedy** | 2026-10-21 |
| **Problem** | Expo wizytówka jest OK, ale większość ruchu i tak wejdzie przez przeglądarkę / link. Top-nav z wieloma linkami na wąskim ekranie się łamał; brak „Add to Home Screen”. |
| **Opcje** | (A) tylko poprawić CSS; (B) forsować Expo Go / store; (C) **PWA weba** (manifest, SW, ikony) + mobile shell (bottom tabs, safe-area). |
| **Decyzja** | **(C)** — `web/public/manifest.webmanifest`, `sw.js`, `MobileBottomNav`, kompaktowy header. |
| **Dlaczego** | Szybki efekt „jak apka” bez App Store; nie konkuruje z Expo (Expo = discovery, web PWA = pełny produkt). |
| **Skutki** | Store natywny nadal poza MVP. Offline-first / push — na później (`pomysly-rozwoju.md`). |

---

## 5. Jak dopisywać kolejne decyzje

1. Nowy podrozdział tutaj **albo** wpis w [`changes.md`](./changes.md) z pełnym **Dlaczego** (nie tylko „naprawiono”).  
2. Jeśli zmiana stacku — też wiersz w [`pomysly-technologiczne.md`](./pomysly-technologiczne.md) (dziś vs alt).  
3. Jeśli zmienia się „co jest vs MVP” — [`MVP.md`](./MVP.md).  
4. Przy usuwaniu starych runbooków (GCP/Pages) **zostaw uzasadnienie tu** (problem → decyzja) — wystarczy do rozdziału „ewolucja architektury”; nie trzymaj mylących instrukcji „jak wdrożyć Pages”.

---

## 6. Aktywacja konta: kod 6-cyfrowy → link w mailu

| | |
|--|--|
| **Kiedy** | 2026-10-21 |
| **Problem** | Wpisywanie kodu na telefonie + zgubienie ekranu weryfikacji. |
| **Decyzja** | Token w linku `/verify-email/{token}` (`PUBLIC_BASE_URL`), TTL 60 min; ten sam wzorzec przy zmianie e-maila (query `?token=` nadal obsługiwane). |
| **Dlaczego** | Jedno kliknięcie z skrzynki; mniej błędów UX na demie. |

---

*Ostatnia aktualizacja: 2026-10-21 — Oracle, Mailbux, PWA, link aktywacyjny; porządek docs.*
