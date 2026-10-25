# Wyniki load testu k6 — Oracle VM (RPS)

**Data:** 2026-10-25 (~19:20–20:00 UTC+1)  
**Cel:** oszacować maksymalną przepustowość (RPS) stacku RacePortal na produkcji dyplomowej.  
**Narzędzie:** Grafana k6 **v2.3.0** (linux/arm64), zainstalowane na VM (`/usr/local/bin/k6`).  
**Skrypty na VM:** `~/k6-tests/rps-ramp.js`, `~/k6-tests/rps-const.js`.

---

## 1. Środowisko testowe

| Parametr | Wartość |
|----------|---------|
| Host | Oracle Always Free `VM.Standard.A1.Flex` (Frankfurt) — `raceportal` |
| CPU / RAM | **2 OCPU**, **11 GiB** RAM (+ 2 GiB swap) |
| Stack | Docker Compose: `raceportal-api` (Spring :4000), `raceportal-web` (nginx :8081), MySQL 8.4 |
| Target | **localhost** na VM (`127.0.0.1`) — pomiar **origin** za Cloudflare Tunnel |
| Generacja ruchu | k6 **na tej samej VM** (konkuruje o CPU z API/nginx/MySQL) |

**Świadome ograniczenie:** wynik jest **dolną granicą** realnej pojemności originu. Przy ruchu z zewnątrz (osobna maszyna → Tunnel/CF → `:8081`) bottleneck może być inny (CF, sieć); przy k6 lokalnie bottleneck to współdzielone 2 OCPU.

Publiczny `https://raceportal.pl` nie był obciążany z laptopa (proxy CONNECT 403 w środowisku agenta) — testy poszły wyłącznie na origin VM.

---

## 2. Metodyka

1. **Ramping arrival-rate** na `GET /api/health` (50 → 2000 RPS) — wstępny sufit.  
2. **Constant arrival-rate** 30 s przy ustalonym RPS — potwierdzenie saturacji (`dropped_iterations`, p95).  
3. Osobno: **nginx** (`GET /`), **API z DB** (`GET /api/events?page=0&size=10`).  
4. Po serii „jakościowej” (niski RPS) — znalezienie progu komfortu dla listy wydarzeń.

Kryteria interpretacji:

| Strefa | Znaczenie |
|--------|-----------|
| **Komfort** | Cel RPS ≈ osiągnięte, błędy ~0%, p95 niski (ms), prawie zero `dropped_iterations` |
| **Saturacja** | Osiągnięte RPS << cel, rosnące dropy / latencja, ale HTTP 2xx |
| **Załamanie** | Wysoki % błędów albo latencja w sekundach przy dużych dropach |

---

## 3. Wyniki skrótowe (werdykt)

| Warstwa | Endpoint | Max sensowny RPS | Sufit „na siłę” (osiągnięte) |
|---------|----------|------------------|------------------------------|
| API lekkie | `GET /api/health` | ~**2000** (p95 ~100 ms) | ~**2200–2260** |
| Front static | `GET /` (nginx :8081) | ~**2000** (p95 ~23 ms) | ~**3250** |
| API + MySQL | `GET /api/events` | ~**150–200** (p95 ~4–22 ms) | ~250–300 → degradacja |

**Wniosek pod dyplom:** wąskie gardło produkcyjne to **endpointy z bazą** (~200 RPS komfort), nie nginx i nie sam health Springa. Na demo / typowy ruch dyplomowy (dziesiątki równoległych użytkowników) zapas jest duży.

Po testach kontenery pozostały `healthy` (`/api/health` → `ok`).

---

## 4. Tabele pomiarów

### 4.1 `GET http://127.0.0.1:4000/api/health`

| Cel RPS | Osiągnięte RPS | Błędy | p95 latencji | Dropped / s | Ocena |
|---------|----------------|-------|--------------|-------------|-------|
| ramp → 2000 (średnia sesji) | ~722* | 0% | ~4.6 ms (cała sesja) | ~0.16 | ramp OK |
| **2000** const 30 s | **~1957** | 0% | 116 ms | ~42 | komfort / lekka saturacja |
| 3000 const 30 s | **~2199** | 0% | 304 ms | ~785 | saturacja |
| 4000 const 30 s | **~2258** | 0% | 435 ms | ~1718 | sufit ~**2.2–2.3k** |

\*średnia z całego rampu (niski start), nie peak.

### 4.2 `GET http://127.0.0.1:8081/` (nginx → SPA)

| Cel RPS | Osiągnięte RPS | Błędy | p95 latencji | Dropped / s | Ocena |
|---------|----------------|-------|--------------|-------------|-------|
| **2000** | **~1993** | 0% | 23 ms | ~7 | komfort |
| 5000 | **~3252** | 0% | 221 ms | ~1728 | sufit ~**3.2–3.3k** |

### 4.3 `GET http://127.0.0.1:4000/api/events?page=0&size=10`

| Cel RPS | Osiągnięte RPS | Błędy | p95 latencji | Dropped / s | Ocena |
|---------|----------------|-------|--------------|-------------|-------|
| 50 | 50 | 0% | 4.5 ms | 0 | komfort |
| 100 | 100 | 0% | 3.8 ms | 0 | komfort |
| 150 | 150 | 0% | 3.9 ms | 0 | komfort |
| **200** | **~200** | 0% | ~22 ms | 0 | **górna granica komfortu** |
| 300 | ~300 | **~56%** | ~190 ms (przy failach) | niski | załamanie (błędy) |
| 400 | ~126 | 0%* | ~5.3 s | ~236 | kolejka / dropy |
| 500 | ~213 | 0%* | ~2.9 s | ~251 | degradacja |
| 800 | ~427 | 0%* | ~1.8 s | ~342 | degradacja |

\*„0% failed” przy wysokim RPS często oznacza, że k6 **nie zdążył** wysłać żądań (`dropped_iterations`) albo odpowiedzi były 2xx, ale z latencją nieakceptowalną — to **nie** jest sukces wydajnościowy.

Wcześniejsza seria 200–800 RPS zaraz po teście health@4k pokazała sztucznie złe p95 (system jeszcze „gorący”) — powtórka po cooldownie dała wiarygodny próg **~200 RPS**.

---

## 5. Jak powtórzyć

Na VM (po `ssh`):

```bash
# instalacja k6 (raz) — binary arm64 z GitHub Releases grafana/k6
k6 version   # oczekiwane: v2.x linux/arm64

cd ~/k6-tests

# stały RPS 30 s
URL=http://127.0.0.1:4000/api/health RATE=2000 PRE_VUS=300 MAX_VUS=800 DUR=30s \
  k6 run rps-const.js

URL=http://127.0.0.1:8081/ RATE=2000 PRE_VUS=200 MAX_VUS=600 DUR=30s \
  k6 run rps-const.js

URL='http://127.0.0.1:4000/api/events?page=0&size=10' RATE=200 PRE_VUS=100 MAX_VUS=400 DUR=20s \
  k6 run rps-const.js
```

Nie spamować produkcji przez publiczny URL bez potrzeby — localhost na VM wystarczy do charakterystyki originu.

---

## 6. Interpretacja pod pracę dyplomową

1. **Warstwa prezentacji (nginx)** wytrzymuje tysiące RPS — typowy SPA nie jest bottleneck.  
2. **API bez DB** (health) ~2k RPS — Spring na 2 OCPU jest wystarczający na MVP.  
3. **API z MySQL** (lista wydarzeń) ogranicza system do rzędu **~10² RPS** przy niskiej latencji — to realistyczna liczba do cytowania jako „pojemność funkcjonalna”.  
4. Test na współdzielonej VM zaniża wynik względem idealnego generatora zewnętrznego; przy cytowaniu warto napisać metodę pomiaru.  
5. Rate limiting auth (#4 pentest) chroni przed stuffingiem; load test powyżej dotyczył **odczytów publicznych**, nie logowania.

---

## 7. Powiązane dokumenty

| Dokument | Rola |
|----------|------|
| [`../../oracle-deploy.md`](../../oracle-deploy.md) | Spec VM / deploy |
| [`../../cybersecurity-pentest.md`](../../cybersecurity-pentest.md) | Remediacje bezpieczeństwa (nie load) |
| [`../TESTY.md`](../TESTY.md) | Metodyka testów funkcjonalnych |
| [`podsumowanie.md`](./podsumowanie.md) | Wyniki unit / E2E (inny zakres) |

---

*Zapis wyników sesji k6 z 2026-10-25; API po teście: healthy.*
