# RacePortal — scenariusz prezentacji obrony (~15 min)

**Cel:** 15-minutowa obrona: problem → rozwiązanie → stack → live demo (kierowca + organizator) → domknięcie.  
**Środowisko:** `https://raceportal.pl` (Oracle VM włączona) **albo** lokalnie `docker compose up -d` → web `:8081`, API `:4000` (`.env` z `SMTP_PASSWORD`).  
**URL produkcyjny:** `https://raceportal.pl` · health: `/api/health`

**Konta seed**

| Rola | Email | Hasło |
|------|-------|-------|
| Kierowca | `test@wp.pl` | `test123` |
| Organizator | `org@raceportal.pl` | `org123` |
| Admin | `admin@raceportal.pl` | `admin123` |

---

## Timing 15 minut (mówione + demo)

| Blok | Czas | Co |
|------|------|-----|
| **Część 1 — slajdy** | **~5,5 min** | tytuł, problem, konkurencja, USP, stack, zespół |
| 1. Tytuł + hook | 1 min | chaos FB/forów → RacePortal jako katalog PL |
| 2. Problem & konkurencja | 1,5 min | brak jednego miejsca, weryfikacja auta, org ręcznie; USP: garaż + `carMatch` |
| 3. Stack & architektura | 1,5 min | React → Spring Boot REST → MySQL; Docker; Oracle + Tunnel; JWT/RBAC |
| 4. Zespół & workflow | 1 min | role: BE / FE / DB support / testing+security |
| **Część 2 — live demo** | **~8 min** | gość → kierowca → organizator → (opcjonalnie admin/PWA) |
| Scena 1: gość | 1,5 min | landing + `/wydarzenia` Lista/Mapa/Kalendarz + filtry |
| Scena 2: kierowca | 3,5 min | garaż → filtr pod auto → detal/trasa → zgłoszenie |
| Scena 3: organizator | 2,5 min | tworzenie eventu (wymagania) → panel zgłoszeń |
| Scena 4: domknięcie + Q&A | 0,5–1 min | podsumowanie USP + roadmap (wyniki live) + pytania |
| **Bufor / Plan B** | w razie lagów | pomiń admin; pokaż krótkie nagranie; nie rób rejestracji od zera |

**Unikać na żywo:** długa rejestracja bez SMTP, wykład JWT, obiecywanie App Store/PSP, „mobile Expo = pełny web”, Google Maps jako jedyna mapa (domyślnie Leaflet + OSRM).

---

## Co mówimy — narracja (skrypt)

### 1. Slajd tytułowy (~1 min)

> „Gdzie dzisiaj szukacie informacji o amatorskich lub profesjonalnych imprezach motorsportowych w Polsce? Przeszukujecie dziesiątki grup na Facebooku, pojedyncze witryny torów, forum rajdowe czy tablice lokalnych Automobilklubów?”  
> „Ten chaos informacyjny i rozproszenie danych to realny problem zarówno dla zawodników, jak i organizatorów. Odpowiedzią jest **RacePortal** — centralny, intuicyjny katalog i system zarządzania wydarzeniami motorsportowymi w Polsce.”

### 2. Problem & konkurencja (~1,5 min)

**Problem:** brak jednego miejsca; trudna weryfikacja wymagań auta (klatka, OC, PZM…); ręczna obsługa zgłoszeń u organizatorów.  
**Konkurencja:** fanpage’e FB (brak filtrów, algorytm); fora / statyczne kalendarze (nieaktualne, bez garażu i mapy).  
**USP:** zintegrowany **Garaż** + inteligentne dopasowanie eventów do auta (`carMatch` / filtr „pod moje auto”); panel organizatora od zgłoszenia po listę startową i statusy.

### 3. Stack (~1,5 min)

Trójwarstwa: **React (Vite) → Spring Boot REST API → MySQL**. Auth: Spring Security + **JWT + RBAC** (DRIVER / ORGANIZER / ADMIN). Front: mobile-first, PWA. Kontenery: **Docker Compose**. Prod: **Oracle Always Free** + Cloudflare Tunnel → `raceportal.pl`. Mapa: **Leaflet**; trasa: **OSRM** (opcjonalnie Google Maps API). Maile: SMTP **Mailbux** (`noreply@raceportal.pl`). Bezpieczeństwo: kierunek OWASP ASVS L1 (rate limit, CSP/HTTPS, walidacja).

### 4. Zespół (~1 min)

Backend — architektura API i logika biznesowa. Frontend — UI React, UX, integracja z API. Backend support — MySQL, struktury danych. Testing & Security — ASVS L1, audyty, testy wydajnościowe (k6). Workflow: jeden repo, branch `main`, deploy `git pull` + `docker compose up --build`.

### Live demo — co mówimy przy ekranie

**Scena 1 (gość):** „Otwieramy RacePortal bez logowania. Nadchodzące wydarzenia z całej Polski: lista, kalendarz i interaktywna mapa.” → mapa wokół miasta, filtr Trackday/KJS + województwo.  
**Scena 2 (kierowca):** login `test@wp.pl` → Garaż (np. BMW E36, KM, klatka, OC) → „Filtruj pod moje auto” → detal + trasa → „Zgłoś się” (wybór auta, wymagania).  
**Scena 3 (org):** login `org@raceportal.pl` → tworzenie eventu (np. wymagana klatka) → panel zgłoszeń / statusy / wpłaty.  
**Domknięcie:** „RacePortal łączy rozproszone środowisko: pewność rejestracji dla kierowcy, cyfrowe narzędzie dla organizatora. Na później m.in. wyniki na żywo. Dziękujemy — zapraszamy do pytań.”

---

## Prompt dla Gemini Canvas (skopiuj w całości)

**Ważne:** w Gemini włącz **Canvas** (albo napisz na początku: „Utwórz w Canvas”).  
Cel: **wizualna prezentacja slajdów**, nie scenariusz / nie skrypt / nie markdown.  
Styl: jak `Prezentacja RacePortal.pdf` — jasny minimalizm, navy + czerwony, split DEMO.

### Szybki start (jeśli Gemini znowu pisze tekst)

Najpierw wklej tylko to (1 wiadomość), potem dopiero długi brief:

```text
Utwórz teraz w Gemini CANVAS gotową PREZENTACJĘ (slajdy wizualne), NIE dokument tekstowy.
Zakaz: scenariusz, skrypt mówiony, „co mówić”, lista punktów w czacie, markdown outline.
Output = wyłącznie slajdy w Canvas (jak Google Slides / Keynote), które mogę od razu prezentować.
Potwierdzam: chcę Canvas slides, nie scenariusz obrony.
```

### Pełny brief (druga wiadomość, po otwarciu Canvas)

```text
KRYTYCZNE — FORMAT WYJŚCIA:
1) Pracuj WYŁĄCZNIE w Gemini CANVAS jako PREZENTACJA / SLIDES.
2) NIE pisz scenariusza, skryptu mówionego, notatek „co mówić”, runbooka ani listy w czacie.
3) NIE generuj dokumentu Markdown / PDF tekstowego „Scenariusz prezentacji”.
4) Jedyny akceptowalny output: gotowe slajdy wizualne w Canvas (tytuł, layout, ikony, zdjęcia, mało tekstu).
5) Jeśli masz pokusę napisać „Slajd 1: mówimy …” — STOP. Zamiast tego NARYSUJ slajd.
6) Speaker notes (opcjonalnie) tylko w notatkach slajdu w Canvas, max 2 zdania — nie w głównej odpowiedzi.

Zadanie: zbuduj w Canvas prezentację obrony projektu „RacePortal” (~15 min mówienia + miejsce na live demo).
Styl: jasny, czysty minimalizm jak w referencyjnym PDF (navy + czerwony akcent) — nie dark racing, nie AI purple.

═══════════════════════════════════════
STYL WIZUALNY — JAK W „Prezentacja RacePortal.pdf”
═══════════════════════════════════════
Paleta:
- Tło treści: białe #FFFFFF lub bardzo jasne #F5F5F7.
- Tekst: deep navy / charcoal (#0B1B33 … #1A1A2E), nie czysty #000.
- Akcent: żywa czerwień (#E10600 / #C62828) — TYLKO: mały label CAPS,
  checkmarki, cienka kreska 24–40px, jedno kółko ikony.
- Ikony drugorzędne: navy (nie czerwone wszystkie).
- Separatory: cienkie jasnoszare linie #E5E5E5.
- Zero gradientów, zero glow, zero fioletu, zero złota, zero neon cyberpunk.

Typografia:
- Czysty sans (Inter / Montserrat / Helvetica Neue) — NIE font „racing”.
- Tytuł: duży bold navy. Podtytuł: szary, krótszy.
- Label nad tytułem (DEMO / OBRONA): CAPS, mały, czerwony.
- Max 3 bullety na slajd DEMO; max 4–5 na slajdach treści.

Layouty (powtórz te wzorce):
A) TYTUŁ / FINAŁ: split 50/50 — lewa navy panel + biały tytuł + czerwona kreska;
   prawa: jedno mocne zdjęcie motorsport (rajdówka / flaga). Albo finał dark + flaga.
B) PROBLEM: białe tło, tytuł lewy; 3 jasne karty w rzędzie (lekki szary fill,
   zaokrąglenie małe, czerwona ikona + nagłówek + 1 linia).
C) USP / ODPOWIEDŹ: jasne tło, 3 kolumny, okrągłe ikony (navy / jedna czerwona
   na środku), tytuł + 1 linia pod spodem.
D) STACK: biały, 4 ikony w poziomie połączone cienką linią (React → Spring →
   MySQL/JWT → Docker).
E) ZESPÓŁ: 2×2 karty na jasnym tle, cienki kolorowy pasek z lewej
   (czerwony / niebieski / żółty / zielony), tytuł roli + 1 zdanie.
F) DEMO: split 50/50 — TEKST na białym (czerwony label LIVE DEMO: …,
   duży tytuł, 3 czerwone ✓ + krótkie linie) | ZDJĘCIE po drugiej stronie
   (mapa / garaż / oficjalny / motorsport). Bez ściany tekstu.
G) ROADMAP: sam środek — mały czerwony CAPS „KOLEJNY KROK”, duży tytuł,
   1 szara linia opisu. Dużo powietrza.

Zasady:
- Spójne marginesy, ta sama pozycja tytułu na slajdach B–E.
- Zdjęcia: wysokiej jakości, ale NIE cyberpunk neon-mapa jako „Google Maps”.
- Na slajdzie mapy: mów i pisz „Mapa Leaflet” / „interaktywna mapa” —
  NIE „mapa Google” (Google Maps API jest tylko opcją trasy; domyślnie OSRM).
- Unikaj F1 / marshal stocków niezwiązanych z PL amatorskim motorsportem —
  lepiej tor, lista startowa, laptop z panelem, plakat eventu.

═══════════════════════════════════════
STRUKTURA OBOWIĄZKOWA (nie zmieniaj kolejności)
═══════════════════════════════════════

CZĘŚĆ 1 — Wprowadzenie (~5,5 min, tylko slajdy)

Slajd 1 — Tytuł / Hook (1 min)
- Problem z perspektywy fana / kierowcy motorsportu w PL.
- Hook do powiedzenia:
  „Gdzie dziś szukacie imprez motorsportowych w Polsce? Facebook, strony torów, fora, automobilkluby?”
- Przedstawienie: RacePortal = centralny katalog + system zarządzania wydarzeniami motorsportowymi w Polsce.
- Produkcja na żywo: https://raceportal.pl

Slajd 2 — Problem rynkowy & konkurencja (1,5 min)
Problemy:
- Brak jednego miejsca (rozproszenie na FB / prywatnych stronach).
- Trudna weryfikacja wymagań imprezy vs auto (klatka, OC, przegląd, licencja PZM).
- Organizatorzy: ręczna obsługa zgłoszeń i list startowych.
Konkurencja:
- Fanpage’e FB (brak filtrów, algorytm ukrywa posty).
- Fora i statyczne kalendarze (nieaktualne dane, brak garażu i mapy).
USP / przewaga:
- Garaż kierowcy + inteligentne dopasowanie eventów do parametrów auta.
- System dla organizatora: od zgłoszenia, przez weryfikację, po listę startową i statusy.

Slajd 3 — Stack & architektura (1,5 min)
- Architektura 3-warstwowa: React (Vite) frontend → Spring Boot REST API → MySQL.
- Backend: Spring Security, JWT, RBAC (role: DRIVER, ORGANIZER, ADMIN).
- Frontend: React, mobile-first, PWA (Add to Home Screen, bottom nav).
- Docker Compose (web + api + mysql + backup) — przenośność i powtarzalne środowisko.
- Prod: Oracle Cloud Always Free (VM Ampere) + Cloudflare Tunnel → jedna domena raceportal.pl.
- Mapa: Leaflet; trasa do toru: OSRM (opcjonalnie Google Maps API).
- Maile transakcyjne: SMTP Mailbux (noreply@raceportal.pl) — aktywacja, reset, statusy zgłoszeń.
- Bezpieczeństwo: kierunek OWASP ASVS Level 1 (HTTPS, CSP, rate limit, walidacja wejścia).
NIE rozpisuj JWT na pół slajdu — jedno zdanie + diagram warstw.

Slajd 4 — Zespół & workflow (1 min)
Role (dostosuj imiona jeśli podam — na razie role ogólne):
- Backend: architektura, integracje, logika biznesowa API.
- Frontend: UI React, komponenty, UX, integracja z API.
- Backend support: MySQL, bezpieczne struktury danych.
- Testing & Security: OWASP ASVS L1, audyty, testy wydajnościowe.
Workflow: jedno repozytorium Git, branch main, deploy: pull + docker compose up --build.

CZĘŚĆ 2 — Live demo (~8 min) — w prezentacji zrób slajdy „DEMO: …” jako checklisty dla prezentera
(nie pełny tekst na slajdzie — duże numery scen + 3–4 punkty „pokaż”).

Scena 1 — Niezalogowany pasjonat (1,5 min)
URL: https://raceportal.pl → /wydarzenia
Pokaż: Lista / Mapa (Leaflet) / Kalendarz; filtr kategorii (Trackday / KJS) + województwo; detal.
Na slajdzie DEMO napisz „Interaktywna mapa” lub „Mapa Leaflet” — NIGDY „mapa Google”.

Scena 2 — Kierowca: garaż, inteligentny filtr, zgłoszenie (3,5 min)
Login: test@wp.pl / test123
Pokaż: Garaż (auto z parametrami: moc, klatka, OC itd.); filtr „pod moje auto” / carMatch;
detal wydarzenia + trasa; „Zgłoś się” → wybór auta → akceptacja wymagań → status zgłoszenia.

Scena 3 — Organizator: tworzenie eventu & panel (2,5 min)
Login: org@raceportal.pl / org123
Pokaż: formularz eventu z wymaganiami warunkowymi (np. wymagana klatka); panel zgłoszeń
(podgląd aut, statusy, wpłaty / dowód płatności jeśli event płatny).

Scena 4 — Domknięcie (0,5–1 min)
Tekst domknięcia:
„RacePortal łączy rozproszone środowisko motorsportowe. Kierowcom daje pewność i wygodę rejestracji,
organizatorom — cyfrowe narzędzie do moderowania zawodów. W przyszłości m.in. moduł wyników na żywo.
Dziękujemy za uwagę — zapraszamy do pytań.”

Opcjonalny slajd (tylko jeśli zostanie czas, max 30–45 s): Admin (admin@raceportal.pl / admin123)
albo PWA na telefonie — nie blokuj na tym głównego flow.

═══════════════════════════════════════
FAKTY PRODUKTU (trzymaj się ich — nie zmyślaj)
═══════════════════════════════════════
- Domena: https://raceportal.pl
- Katalog wydarzeń: trzy widoki (lista, mapa Leaflet, kalendarz) na wspólnych filtrach.
- Garaż: CRUD aut; zdjęcie (plik lub URL); deklaracje (klatka, OC, PZM…).
- carMatch: dopasowanie auta do kategorii/wymagań eventu; filtr katalogu po aucie z garażu.
- Zgłoszenia: statusy (np. PENDING → APPROVED / odrzucenie); maile na prawdziwą skrzynkę.
- Role: DRIVER / ORGANIZER / ADMIN; wniosek „zostań organizatorem”.
- Panel admina: szukaj użytkowników (nazwa/e-mail) + filtr roli; zatwierdzone eventy — szukaj (nazwa/org/tor) + kategoria.
- Mobile: web PWA = pełny produkt; Expo = wizytówka discovery + CTA na web (NIE obiecuj store).
- Świadome luki (uczciwie, 1 zdanie jeśli spytają): brak App Store; galeria uproszczona;
  Expo nie ma pełnego parity z webem; trasa domyślnie OSRM nie Google.

═══════════════════════════════════════
TREŚĆ NA SLAJDACH (krótko — reszta w live demo)
═══════════════════════════════════════
- Zero marketingowego bełkotu.
- Nie obiecywać PSP / App Store / wyników live jako gotowych (wyniki = 1 slajd „Kolejny krok”).
- Nie wykładać JWT na slajdzie — max 1 linia przy stacku.
- Ostatni slajd: Dziękujemy + Q&A (może być dark + flaga).
- Przedostatni opcjonalnie: 5 pytań komisji jako same nagłówki (bez długich odpowiedzi na slajdzie).

Motyw Canvas: LIGHT / Minimal / Blank, tło białe, akcent czerwony — nie Pitch Dark.

START TERAZ: otwórz Canvas i od razu zbuduj 10–11 slajdów wizualnych.
Nie odpowiadaj scenariuszem. Pierwszy output = slajd tytułowy w Canvas.
```

---

## Checklisty live (prezenter)

### Przed wejściem na salę

1. Oracle → **Start** instancji `raceportal` (jeśli śpi).
2. `curl -sS https://raceportal.pl/api/health` → `{"status":"ok"}`.
3. Zaloguj się raz kontami seed (kierowca + org) — sesja / cookies OK.
4. Karta z hasłami seed na biurku; Plan B: nagranie 60–90 s.

### Top 10 „najciekawsze” (gdy mało czasu)

1. Eventy: Lista + Mapa + Kalendarz na wspólnych filtrach  
2. `carMatch` przy zapisie  
3. Filtr katalogu po aucie z garażu  
4. Pełny flow zgłoszenia + statusy  
5. Panel organizatora (event → zgłoszenia)  
6. Mail na prawdziwą skrzynkę po zmianie statusu  
7. Panel admina (zatwierdzone: szukaj + kategoria; użytkownicy: szukaj + rola; wnioski) — tylko jeśli czas  
8. Mapa markerów + trasa do toru  
9. Web PWA na telefonie **lub** Expo → CTA na web  
10. Health + Compose / Oracle = „działa jak system”, nie mock  

### Luki (nazwać uczciwie, ≤15 s)

- Brak App Store / Play (jest PWA weba)  
- Expo = discovery, nie parity z webem  
- Galeria świadomie uproszczona  
- Część pól Spec opcjonalna vs wymagana — [`spec-conformity.md`](./spec-conformity.md)  

---

## Plan B

Nagranie 60–90 s (eventy → zapis → mail → PWA), konta seed na kartce.  
Nie zaczynaj od rejestracji + maila, jeśli `smtp` niepewny — użyj seed kont.
