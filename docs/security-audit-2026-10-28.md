# RacePortal — audyt bezpieczeństwa (2026-10-28)

**Typ:** defensywny przegląd kodu + weryfikacja runtime na produkcji (Oracle VM / Cloudflare Tunnel).  
**Bez:** PoC exploitów, publikowania sekretów, kroków ataku.  
**Środowisko:** `https://raceportal.pl`, `https://bo.raceportal.pl` · branch `main`.  
**Powiązane:** [`cybersecurity-pentest.md`](./cybersecurity-pentest.md) (wcześniejsze remedacje), [`oracle-deploy.md`](./oracle-deploy.md), [`bo.md`](./bo.md).

> Canvas w Cursor (`security-pentest-audit.canvas.tsx`) to lokalny widok IDE — **nie renderuje się na GitHubie**. Ten plik jest kanoniczną wersją do repo / dyplomu.

---

## Werdykt

Na żywej produkcji potwierdzono **3 Critical** (domyślny `JWT_SECRET`, aktywny seed ADMIN, hardcode w `docker-compose.yml`). Wcześniejsze remedacje z `cybersecurity-pentest.md` (HSTS, httpOnly cookies, SafeHttpUrls, rate limit logowania, timing-safe login, CSP bez localhost) **nadal są w kodzie**, ale nie kasują krytycznej misconfig na VM.

| Severity | Liczba (ten audyt) |
|----------|--------------------|
| Critical | 3 |
| High | 3 |
| Medium | 4 |
| Low | 1 |
| Info | 1 |

---

## Natychmiastowa akcja (prod)

1. Wygeneruj nowy sekret: `openssl rand -base64 48`.
2. W `docker-compose.yml` zamień literały na interpolację env (`JWT_SECRET: ${JWT_SECRET}`, `SEED_ENABLED: ${SEED_ENABLED:-false}`, …).
3. W `.env` na VM: silny `JWT_SECRET`, `SEED_ENABLED=false`, `ALLOW_INSECURE_DEFAULTS=false`, `COOKIE_SECURE=true`, `COOKIE_DOMAIN=.raceportal.pl`.
4. `sudo docker compose up -d --force-recreate api` (lub pełny `--build`).
5. Zmień hasło konta ADMIN (seed nie może działać).
6. Smoke: login seed → **401**; login Twoim hasłem → BO OK; stare sesje po rotacji JWT nieważne.

---

## Model zagrożeń (skrót)

| Aktor | Cel |
|-------|-----|
| Anonim / bot | Stuffing na seed admin, fałszowanie JWT przy znanym secret, spam maps/bug-reports, wyciek upload URL |
| USER / ORGANIZER | Upload abuse; XSS na apex → sesja BO (`Domain=.raceportal.pl`) |
| Misconfig operatora | Compose hardcode, porty `0.0.0.0` za NSG, CORS wildcards, SEED na prod |

---

## Findings

### Tabela

| ID | Severity | Status | Tytuł | OWASP |
|----|----------|--------|-------|-------|
| PROD-01 | Critical | Open | JWT_SECRET nadal domyślny na produkcji | A02 Cryptographic Failures |
| PROD-02 | Critical | Open | Konta seed aktywne — admin seed działa na prod | A07 Identification & Authentication |
| CFG-01 | Critical | Open | Compose produkcyjny hardkoduje sekrety i seed | A05 Security Misconfiguration |
| AUTH-01 | High | Partial | Token JWT nadal w JSON body (obok httpOnly cookie) | A07 Authentication |
| CORS-01 | High | Open | CORS z credentials obejmuje `*.trycloudflare.com` i `*.pages.dev` | A05 Misconfiguration |
| UPLOAD-01 | High | Open | `GET /api/uploads/{uuid}` publiczny (dowody przelewów) | A01 Broken Access Control |
| CSRF-01 | Medium | Partial | CSRF wyłączony przy sesji cookie | A01 Broken Access Control |
| BO-01 | Medium | Partial | Współdzielona sesja apex ↔ BO (Domain cookie) | A01 / A07 |
| MAPS-01 | Medium | Open | Publiczny proxy OSRM bez rate limitu | API4 Unrestricted Resource Consumption |
| INFRA-01 | Medium | Partial | MySQL `:3307` i API `:4000` publish `0.0.0.0` | A05 Misconfiguration |
| CSP-01 | Low | Partial | `style-src 'unsafe-inline'` w CSP | A05 Misconfiguration |
| INFO-01 | Info | Open | Publiczne `/api/stats` ujawnia liczbę kont | A01 Information Disclosure |

---

### PROD-01 — JWT_SECRET nadal domyślny na produkcji

| | |
|--|--|
| **Severity** | Critical |
| **Status** | Open |
| **OWASP** | A02 Cryptographic Failures |
| **Dowód** | Kontener `api`: domyślny sekret (długość 31, wartość z repo). W `docker-compose.yml` `JWT_SECRET` jest **zahardkodowany** (nie `${JWT_SECRET}`), więc `.env` go nie nadpisuje. |
| **Impact** | Znając sekret z repo można fałszować access tokeny dla dowolnego userId/roli — pełne przejęcie kont, w tym ADMIN i backoffice. |
| **Remedacja** | `openssl rand -base64 48` → `.env`; compose: `JWT_SECRET: ${JWT_SECRET}`; recreate `api`; wymuś re-login. |

### PROD-02 — Konta seed aktywne na prod

| | |
|--|--|
| **Severity** | Critical |
| **Status** | Open |
| **OWASP** | A07 Identification & Authentication |
| **Dowód** | `SEED_ENABLED=true`, `ALLOW_INSECURE_DEFAULTS=true` w kontenerze. `POST /api/auth/login` z hasłem seed → HTTP **200**, rola **ADMIN**, cookies `Domain=.raceportal.pl`. |
| **Impact** | Publiczny BO + znane hasło z dokumentacji = natychmiastowy dostęp ADMIN (użytkownicy, wnioski, wydarzenia, CSV). |
| **Remedacja** | `SEED_ENABLED=false`, `ALLOW_INSECURE_DEFAULTS=false`; zmień hasło admina; recreate `api`. Smoke: seed login = **401**. |

### CFG-01 — Compose hardkoduje sekrety i seed

| | |
|--|--|
| **Severity** | Critical |
| **Status** | Open |
| **OWASP** | A05 Security Misconfiguration |
| **Dowód** | `docker-compose.yml`: literały `JWT_SECRET`, `SEED_ENABLED`, `ALLOW_INSECURE_DEFAULTS`, `DATABASE_PASSWORD`. Oracle używa tego pliku (nie `docker-compose.vm.yml`). |
| **Impact** | Operator myśli, że ustawił `.env`; runtime bierze wartości z compose. |
| **Remedacja** | Wszystkie sekrety przez `${VAR}`; domyślnie `SEED_ENABLED=false` na ścieżce prod; override / osobny compose prod. |

### AUTH-01 — JWT w JSON body obok httpOnly cookie

| | |
|--|--|
| **Severity** | High |
| **Status** | Partial |
| **OWASP** | A07 Authentication |
| **Dowód** | Login 200: `Set-Cookie` `rp_at` / `rp_rt` (`HttpOnly; Secure; SameSite=Lax; Domain=.raceportal.pl`) **oraz** body `{ token, refreshToken, user }`. |
| **Impact** | XSS / malware / rozszerzenie czyta body → kradzież sesji mimo httpOnly. |
| **Remedacja** | Web: nie zwracaj tokenów w body (tylko cookies + user). Mobile: osobny kanał. |

### CORS-01 — Wildcards w CORS z credentials

| | |
|--|--|
| **Severity** | High |
| **Status** | Open |
| **OWASP** | A05 Misconfiguration |
| **Dowód** | `CORS_ORIGIN` zawiera `https://*.trycloudflare.com`, `https://*.pages.dev` + apex/bo; `allowCredentials=true`. |
| **Impact** | Szersza powierzchnia originów; `SameSite=Lax` ogranicza klasyczny CSRF, ale wildcards są zbędne na prod. |
| **Remedacja** | Prod CORS tylko `https://raceportal.pl`, `https://www.raceportal.pl`, `https://bo.raceportal.pl`. |

### UPLOAD-01 — Publiczne GET uploadów

| | |
|--|--|
| **Severity** | High |
| **Status** | Open |
| **OWASP** | A01 Broken Access Control |
| **Dowód** | `SecurityConfig`: `permitAll` na `GET /api/uploads/**`. Upload wymaga auth, odczyt nie. |
| **Impact** | Ujawnienie dowodów płatności / zdjęć każdemu ze linkiem (UUID w UI/mailach). |
| **Remedacja** | Auth przy GET albo signed URL z TTL; `Content-Disposition: attachment` dla PDF. |

### CSRF-01 — CSRF wyłączony przy cookie session

| | |
|--|--|
| **Severity** | Medium |
| **Status** | Partial |
| **OWASP** | A01 Broken Access Control |
| **Dowód** | `SecurityConfig`: `csrf.disable()`. Prod: `SameSite=Lax`. |
| **Impact** | Cross-site POST ograniczony przez Lax; ryzyko rośnie przy zmianie SameSite lub XSS na subdomenie. |
| **Remedacja** | CSRF token / Origin check na mutacje; `Strict` dla BO. |

### BO-01 — Współdzielona sesja apex ↔ BO

| | |
|--|--|
| **Severity** | Medium |
| **Status** | Partial |
| **OWASP** | A01 / A07 |
| **Dowód** | `COOKIE_DOMAIN=.raceportal.pl`. XSS na apex = sesja na `bo.raceportal.pl`. |
| **Impact** | Świadomy trade-off UX; XSS apex = pełny backoffice. |
| **Remedacja** | Twardsza CSP; step-up re-auth na BO; osobny cookie name dla BO. |

### MAPS-01 — Publiczny proxy OSRM bez rate limitu

| | |
|--|--|
| **Severity** | Medium |
| **Status** | Open |
| **OWASP** | API4 Unrestricted Resource Consumption |
| **Dowód** | `POST /api/maps/route` `permitAll`; brak `AttemptRateLimiter`. |
| **Impact** | Abuse bandwidth / DoS origin i zewnętrznego OSRM. |
| **Remedacja** | Rate limit per IP; cache tras. |

### INFRA-01 — Publish MySQL/API na `0.0.0.0`

| | |
|--|--|
| **Severity** | Medium |
| **Status** | Partial |
| **OWASP** | A05 Misconfiguration |
| **Dowód** | Compose: `3307:3306`, `4000:4000`, `8081:80`. Z internetu obecnie filtrowane (NSG), bind all-interfaces. |
| **Impact** | Przy błędzie firewall — MySQL/API z pominięciem Cloudflare. |
| **Remedacja** | Nie publikuj `3307`/`4000`; tylko sieć compose + cloudflared → `8081` na localhost. |

### CSP-01 — `style-src 'unsafe-inline'`

| | |
|--|--|
| **Severity** | Low |
| **Status** | Partial |
| **OWASP** | A05 Misconfiguration |
| **Dowód** | `web/nginx.conf` CSP: `style-src` z `'unsafe-inline'` (React `style={{}}`). |
| **Impact** | Ułatwia XSS stylowy przy innych lukach; `script-src` bez `'unsafe-inline'` OK. |
| **Remedacja** | Nonce/hash styles; najpierw report-only CSP. |

### INFO-01 — Publiczne `/api/stats`

| | |
|--|--|
| **Severity** | Info |
| **Status** | Open |
| **OWASP** | A01 Information Disclosure |
| **Dowód** | `GET /api/stats` → `registeredUsers`. Publiczne `/api/health` tylko `{status:ok}`; `/api/health/details` = ADMIN. |
| **Impact** | Niski — fingerprint skali. |
| **Remedacja** | Opcjonalnie usuń lub zaokrąglij. |

---

## Kontrolki już wdrożone (wcześniejszy pentest)

Potwierdzone w kodzie / nagłówkach w trakcie audytu — **nie** oznaczają „prod jest bezpieczny” przy PROD-01/02.

| ID | Kontrola | Notatka |
|----|----------|---------|
| M-0 | HTTPS + HSTS + Tunnel | CF + nginx HSTS `includeSubDomains` |
| M-2 | httpOnly cookies + refresh path | `rp_at` `/`; `rp_rt` `/api/auth`; Secure |
| M-3 | SafeHttpUrls | Blokada `javascript:`; upload whitelist |
| M-4 | Rate limit auth / bugs | `AttemptRateLimiter` + `CF-Connecting-IP` |
| M-5 | Timing-safe login / decoy forgot | `dummyPasswordHash` + SMTP decoy |
| M-7 | CSP bez localhost | `object-src none`; `form-action self` |
| M-10 | Health details ADMIN-only | Public health = status ok |
| M-up | Upload sniffing + normalize | Magic bytes; UUID; path guard |

Szczegóły remedacji historycznych: [`cybersecurity-pentest.md`](./cybersecurity-pentest.md).

---

## Cloudflare: apex vs `bo.raceportal.pl`

Z brzegu (nagłówki HTTP) ochrona wygląda **tak samo**: `server: cloudflare`, HSTS, CSP/XFO/XCTO, brak `cf-mitigated`, tunnel ingress na ten sam nginx `:8081`.  
Certyfikaty Universal SSL różnią się (apex vs wildcard) — normalne. Strefa jedna; bez API tokena nie weryfikowano custom WAF rules per hostname w panelu.

---

## Plan naprawy

### 1. Hotfix prod (dziś)

- Nowy `JWT_SECRET` + interpolacja w compose  
- `SEED_ENABLED=false`, `ALLOW_INSECURE_DEFAULTS=false`  
- Nowe hasło ADMIN  
- Smoke: seed login = 401  

### 2. Tydzień

- CORS tylko 3 originy  
- Nie publikuj `3307`/`4000`  
- Auth / signed URL na `GET /api/uploads/**`  
- Login body bez tokenów dla web  

### 3. Backlog

- CSRF / Origin check  
- Rate limit maps  
- CSP bez `unsafe-inline`  
- Step-up na BO  
- Redis rate limit; CF WAF custom rules  

---

## Metoda

Przegląd: `SecurityConfig`, `AuthCookies`, `UploadService`, `SafeHttpUrls`, `MapsService`, cookies BO, `nginx.conf` CSP.  
Live: env kontenera `api`, login seed, nagłówki CF apex↔bo, publish portów.  

**Nie zastępuje** formalnego ASVS L2 ani zewnętrznego pentestu z umową / ROE.

---

*Data audytu: 2026-10-28 · RacePortal*
