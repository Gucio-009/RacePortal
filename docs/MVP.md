# RACEPORTAL — MVP (MPC): plan vs stan

Dokument porównuje **co miało być** (zakres MPC) z **tym, co jest** w kodzie.  
Przy każdej większej zmianie aktualizuj sekcje 3–6 poniżej.

Źródło priorytetów: prezentacja / pitch projektu.  
Historia prac: [`changes.md`](./changes.md)  
Katalog: `/Users/wojciechwronisz/Desktop/projekty/raceportal`

**Ostatnia synchronizacja:** 2026-08-03 09:20 (uwagi przeglądu: filtry+3 widoki, kategorie, admin, formularze, galeria deferred)

---

## 1. Jak czytać ten dokument

| Kolumna / sekcja | Znaczenie |
|------------------|-----------|
| **Miało być** | Wymaganie z zakresu MVP (MPC) |
| **Jest** | Faktyczny stan w repo / Dockerze |
| **Zrobione** | Domknięte względem MVP |
| **Do zrobienia** | Braki względem MVP / odbioru |
| **Ponad MVP** | Zrobione ekstra (nie wymagane w MPC) |

Legenda statusu: **OK** · **Częściowo** · **Brak** · **Ponad**

---

## 2. Co miało być — zakres MVP (MPC)

### 2.1. Funkcje w zakresie

| # | Funkcja | Opis (miało być) |
|---|---------|------------------|
| 1 | Kalendarz / lista wydarzeń | Przegląd nadchodzących wydarzeń wyścigowych |
| 2 | Filtry i wyszukiwarka | Filtrowanie oraz wyszukiwanie wydarzeń |
| 3 | Szczegóły wydarzeń | Widok szczegółowy pojedynczego wydarzenia |
| 4 | Panel administratora | Zarządzanie systemem, moderacja, administracja |
| 5 | Konto kierowcy | Profil i dane kierowcy |
| 6 | Garaż z autami kierowcy | Zarządzanie pojazdami przypisanymi do kierowcy |
| 7 | System zgłoszeń | Zgłoszenia udziału / wnioski w systemie |
| 8 | Konto organizatora | Profil i uprawnienia organizatora |
| 9 | Narzędzia organizacji wydarzenia | Tworzenie i zarządzanie wydarzeniem przez organizatora |
| 10 | Baza danych wydarzeń | Trwałe przechowywanie i odczyt wydarzeń |
| 11 | Powiadomienia mailowe | Wysyłka maili systemowych (potwierdzenia, statusy) |
| 12 | Mapa wydarzeń | Prezentacja wydarzeń na mapie |
| 13 | API Google Maps (trasa) | Trasa z lokalizacji użytkownika do wydarzenia |
| 14 | Archiwum wydarzeń | Zakończone / historyczne wydarzenia |
| 15 | Aplikacja mobilna | Dostęp mobilny (mobile-first / aplikacja) |

### 2.2. Poza zakresem MVP (świadomie nie robić)

- Integracja z kalendarzem Google / Apple  
- Push / dodatkowe kanały powiadomień (poza mailami)  
- Integracja z social media  
- System pomiarów czasów  

### 2.3. Warunki odbioru (miało być)

1. Funkcje **1–11** dostępne i przetestowane (manualne + podstawowe e2e) — **e2e automatyczne: PASS (51)**; patrz [`docs/testy/TESTY.md`](./testy/TESTY.md)  
2. UX mobile-first — web responsive + Expo `mobile/`  
3. Spójność z pitch / prezentacją  

### 2.4. Jakość (miało być)

| Obszar | Wymaganie |
|--------|-----------|
| Niezawodność | Codzienne backupy + restore, health checks, alerty, Docker |
| Wydajność | Paginacja / indeksy / cache; P95 ≤ 500–700 ms (≤50 rekordów); test 10k rekordów / 50 RPS |
| Bezpieczeństwo | OWASP ASVS L1, RBAC, walidacja, rate limit, HTTPS, CSP / HSTS / X-Frame-Options |
| Prywatność | Minimalizacja danych, RODO, polityka prywatności, info przy dodawaniu wydarzeń |
| Przenośność | Docker: tryb deweloperski i produkcyjny |

---

## 3. Co jest — stan obecny (porównanie funkcja po funkcji)

Stack: **web** (nginx `:8081`) + **api** (Spring Boot `:4000`) + **MySQL** (`:3307`) + **Mailpit** (`:8025`) + **backup**.

Logowanie: http://127.0.0.1:8081/login  
| Admin | `admin@raceportal.pl` / `admin123` |  
| Organizator | `org@raceportal.pl` / `org123` |  
| Kierowca | `test@wp.pl` / `test123` |

| # | Miało być | Jest (stan) | Werdykt |
|---|-----------|-------------|---------|
| 1 | Kalendarz wydarzeń | Lista z API, paginacja, UI `/wydarzenia` | **OK** |
| 2 | Filtry / wyszukiwarka | `q`, kategoria, miasto, **`paid` (płatne/darmowe)** | **OK** |
| 3 | Szczegóły wydarzenia | `/wydarzenia/:id` + zapis + trasa + badge płatne + **proponowane auta** | **OK** |
| 4 | Panel admina | `/admin` — userzy, pending events, wnioski org. | **OK** |
| 5 | Konto kierowcy | JWT, `/dashboard`, `/konto` | **OK** |
| 6 | Garaż | CRUD `/garaz` + API; kategorie = klasy wydarzeń; seed 1 auto/kategorię na `test@wp.pl` | **OK** |
| 7 | Zgłoszenia | API registrations + statusy + maile | **OK** |
| 8 | Konto organizatora | Rola ORGANIZER + wniosek `/zostan-organizatorem` | **OK** |
| 9 | Narzędzia org. | `/organizer` — create UX: selecty (kat./tor/miasto/woj./czas), miniatury zdjęć, chipy wpisowego, auto-fill lokalizacji | **OK** |
| 10 | Baza wydarzeń | MySQL + Spring Data JPA | **OK** |
| 11 | Maile | SMTP → Mailpit (rejestracja, zgłoszenia, statusy, reset) | **OK** |
| 12 | Mapa | Leaflet `/mapa` | **OK** |
| 13 | Google Maps trasa | OSRM domyślnie; Google tylko z `GOOGLE_MAPS_API_KEY` | **Częściowo** |
| 14 | Archiwum | `/archiwum`, ARCHIVED + auto-archiwum przeszłych | **OK** |
| 15 | Aplikacja mobilna | Expo w `mobile/` (login, lista, detal, zapis) + web responsive | **Częściowo** |

---

## 4. Co zostało zrobione (względem MVP)

### Funkcje 1–11 (warunek odbioru)

- [x] 1 Kalendarz / lista  
- [x] 2 Filtry i wyszukiwarka  
- [x] 3 Szczegóły  
- [x] 4 Panel admina  
- [x] 5 Konto kierowcy  
- [x] 6 Garaż  
- [x] 7 System zgłoszeń  
- [x] 8 Konto organizatora  
- [x] 9 Narzędzia organizatora  
- [x] 10 Baza danych  
- [x] 11 Powiadomienia mailowe  

### Funkcje 12–15

- [x] 12 Mapa wydarzeń (Leaflet)  
- [~] 13 Trasa (OSRM; Google opcjonalnie)  
- [x] 14 Archiwum  
- [~] 15 Mobile — Expo MVP (`mobile/`: auth, events, rejestracja); brak store/PWA/garaż/mapa w app  

### Jakość — zrobione

- [x] Docker Compose (web + api + **MySQL** + mail + backup)  
- [x] Health checks (`/api/health` + Docker)  
- [x] Backupy codzienne (kontener `backup` → `mysqldump`)  
- [x] Paginacja, indeksy JPA, cache list wydarzeń (Caffeine)  
- [x] RBAC (USER / ORGANIZER / ADMIN) + JWT  
- [x] Bean Validation, nagłówki CSP + X-Frame-Options (nginx)  
- [x] Polityka prywatności + nota RODO przy tworzeniu wydarzenia  
- [x] Smoke / testy manualne ścieżek ról  
- [x] Testy automatyczne API: JUnit MockMvc **20/20 PASS** + Playwright E2E — `docs/testy/TESTY.md`  

---

## 5. Co zostało do zrobienia (luka vs MVP)

| Priorytet | Pozycja | Brak / luką |
|-----------|---------|-------------|
| Wysoki (jakość) | Wydajność | Brak testu 10k rekordów / 50 RPS i pomiaru P95 |
| Średni | HTTPS / HSTS | Brak terminacji TLS (do reverse proxy w prod) |
| Średni | #13 Google Maps | Brak klucza `GOOGLE_MAPS_API_KEY` w domyślnym env — jest OSRM |
| Średni | Alerty | Brak automatycznego alertowania przy błędach krytycznych |
| Średni | Backup restore | Skrypt dump jest; restore nie jest udokumentowany / przetestowany formalnie |
| Niski (odbiór formalnie 12–15) | #15 Aplikacja mobilna | Expo uproszczone OK; brak: PWA, publikacja w store, garaż/mapa/admin w mobile |
| Niski | Perf / load | Brak formalnego testu 10k/50 RPS (osobny etap) |
| Niski | Social OAuth | Przyciski Google/Facebook to UI demo, nie produkcyjny OAuth (i social jest **poza** MVP) |

---

## 6. Co zostało zrobione **ponad** MVP

Rzeczy zrobione, choć nie wymagane wprost w zakresie funkcji 1–11 / odbiorze MPC:

| Pozycja | Dlaczego „ponad” |
|---------|------------------|
| Mapa Leaflet (#12) | W zakresie funkcjonalnym MVP, ale **poza** formalnym warunkiem odbioru 1–11 — i tak wdrożona |
| Trasa OSRM (#13 fallback) | Działa bez klucza Google; Google to opcja |
| Auto-archiwizacja wydarzeń | Job przy starcie API + filtr archiwum dla minionych APPROVED |
| Mailpit zamiast tylko „mail w teorii” | Pełny podgląd maili w UI deweloperskim |
| Seed 3 ról + pending event | Ułatwia demo admin/org/kierowca od razu po `compose up` |
| Rate limiting + security headers na nginx | ASVS L1 basics ponad „gołe” CRUD |
| Volume backup + skrypt dzienny | Niezawodność wykraczająca poza samą bazę „w Dockerze” |
| Panel wniosków organizatora end-to-end | Wniosek → mail/admin approve → rola ORGANIZER |
| Galeria z API (upcoming + archive) | Uzupełnienie UX poza ścisłą listą MPC |
| Dokumentacja `changes.md` + ten plik porównawczy | Śledzenie plan vs stan |
| Expo `mobile/` (native MVP) | Realna app mobilna poza samym responsive web |
| Automatyczne testy (JUnit + Playwright + Vitest mobile) | Dokumentacja dyplomowa: `docs/testy/TESTY.md` + wyniki |
| Migracja backendu na Spring Boot + MySQL | Zgodność ze stackiem DZW (React / Spring / MySQL / Docker / Maven) |
| Seed płatnych wydarzeń + filtr `paid` + badge UI | Demo i UX przepływu płatnego (Dokumentacja); nie wymagane wprost w MPC 1–11 |
| Proponowane / zalecane auta przy zapisie (`carMatch`) | UX dopasowania klasy auta do kategorii wyścigu + licznik dostępnych |

---

## 7. Skrót jednego rzutu oka

```
MVP funkcje 1–11:     ████████████████████  11/11 OK
MVP funkcje 12–15:    ██████████████░░░░░░   12+14 OK; 13 częściowo; 15 Expo uproszczone
Odbiór (e2e + perf):  ████████████░░░░░░░░   API JUnit 20/20; E2E Playwright; brak 10k/50RPS
Jakość (Docker/RBAC): ████████████████░░░░   Spring+MySQL OK; HTTPS/alerty brak
Ponad MVP:            mapa, OSRM, Mailpit, Expo mobile, Spring Boot + auto-testy + docs
```

### Komendy

```bash
docker compose up --build -d --remove-orphans
# App:     http://127.0.0.1:8081/
# Login:   http://127.0.0.1:8081/login
# Health:  http://127.0.0.1:8081/api/health
# Maile:   http://127.0.0.1:8025/

cd mobile && npm install && npm start

# Testy automatyczne (Expo web :8082 potrzebne do E2E mobile)
npm run test:api && npm run test:mobile-unit && npx playwright test
```

### Dokumentacja powiązana

| Plik | Rola |
|------|------|
| [`changes.md`](./changes.md) | Chronologia (sekcja 10 = testy, §11 = struktura repo) |
| [`testy/TESTY.md`](./testy/TESTY.md) | Metodyka i przypadki testowe |
| [`testy/wyniki/podsumowanie.md`](./testy/wyniki/podsumowanie.md) | Ostatni werdykt API Spring **20/20 PASS** |
| [`../README.md`](../README.md) | Szybki start + testy |
| [`../mobile/README.md`](../mobile/README.md) | Expo + testy mobile |
| [`README.md`](./README.md) | Indeks dokumentacji |

---

## 8. Zasada aktualizacji (dla agentów)

Przy każdej istotnej zmianie w projekcie **zawsze** zaktualizuj w tym pliku:

1. **Sekcja 3** — „Jest” / werdykt dla dotkniętych funkcji  
2. **Sekcja 4** — przenieś pozycje do „zrobione”  
3. **Sekcja 5** — usuń zamknięte braki; dodaj nowe luki  
4. **Sekcja 6** — dopisz rzeczy zrobione poza zakresem MVP  
5. Datę **Ostatnia synchronizacja** na górze  
6. Przy zmianie testów — też `docs/testy/TESTY.md`, `docs/testy/wyniki/podsumowanie.md` i wpis w `changes.md`

Nie kasuj sekcji „Co miało być” — to baza porównania.

---



## 8. Wyrównanie do Dokumentacji (2026-08-02)

Przepływy z `Dokumentacja/Diagramy` (bez „stare wersje”) wdrożone w API+web: statusy PENDING/ACCEPTED/CONFIRMED/CANCELED, wydarzenia płatne + proof przelewu, anulowanie zgłoszenia/wydarzenia, edycja garażu z blokadą przy otwartym zgłoszeniu, weryfikacja e-mail przy rejestracji. Poza MVP kodu: bramka płatności, upload binarny, Project X.

**2026-08-02 08:20–08:31 (ponad / UX):** widoczne płatne eventy w seedzie + filtr + badge; przy zapisie grupa „Proponowane/zalecane” aut po kategorii wydarzenia oraz kompletny garaż demo. Historia i argumenty: [`changes.md`](./changes.md) §14–§15.

*MVP / MPC — RACEPORTAL. Format: miało być → jest → zrobione → do zrobienia → ponad MVP. Ostatnia synchronizacja docs: 2026-08-02 08:31.*
