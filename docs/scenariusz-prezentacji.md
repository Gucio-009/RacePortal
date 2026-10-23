# RacePortal — scenariusz prezentacji (demo)

**Cel:** pokazać ciekawe rzeczy produktu na żywo (~10–12 min), nie wykład o stacku.  
**Środowisko (preferowane):** `https://raceportal.pl` (Oracle VM włączona) **albo** lokalnie `docker compose up -d` → web `:8081`, API `:4000` (wymaga `.env` z `SMTP_PASSWORD` do Mailbux).  
Mobile Expo osobno (`:8082` / Simulator).

**Konta seed**

| Rola | Email | Hasło |
|------|-------|-------|
| Kierowca | `test@wp.pl` | `test123` |
| Organizator | `org@raceportal.pl` | `org123` |
| Admin | `admin@raceportal.pl` | `admin123` |

---

## Przebieg (rekomendowany timing)

1. **Hook (30 s)** — katalog motorsportu PL: znajdź start → auto → org zarządza → admin moderuje.
2. **Gość / katalog (2 min)** — `/wydarzenia`: Lista → Mapa → Kalendarz + filtry + detal.
3. **Kierowca (3 min)** — garaż, zapis, `carMatch`, zgłoszenia.
4. **Organizator (2 min)** — event (preset toru) + zgłoszenia + mail na skrzynkę kierowcy (Mailbux).
5. **Admin (1 min)** — approve eventu / wniosku org. (`/admin` → Wnioski).
6. **Telefon (1–1,5 min)** — web PWA (bottom nav) **lub** Expo wizytówka → CTA „Zapisz się na stronie”.
7. **Domknięcie (30 s)** — Compose / Oracle, health (`db` + `smtp`), jeden API; uczciwie o lukach (mobile bez zdjęcia w garażu, część pól Spec).

**Plan B:** nagranie 60–90 s (eventy → zapis → mail → PWA/mobile), konta seed na kartce.

**Unikać na żywo:** długa rejestracja+OTP bez działającego SMTP, wykład JWT, obiecywanie store/PSP, „parity mobile = web”.

---

## Co warto pokazać — cała strona i najmocniejsze rozwiązania

### Publiczne (bez logowania)

- Home / landing — branding, klimat motorsport, wejście w katalog
- `/wydarzenia` — **3 widoki w jednym miejscu:** Lista / Mapa / Kalendarz
- Wspólne filtry: wyszukiwanie, kategoria, płatne/darmowe, woj., miasto, tor, zakres dat
- **Wyczyść filtry** jednym kliknięciem
- Mapa Leaflet (markery z `/api/events/markers`, nie okrojona lista)
- Kalendarz ze „złotymi” dniami z eventami
- Karty eventów: badge płatne, kategoria, lokalizacja, hover
- Detal wydarzenia: opis, wymagania, lokalizacja, trasa (OSRM / opcjonalnie Google)
- Archiwum przeszłych eventów
- Wyniki (jeśli są dane)
- Galeria (świadomie uproszczona — pokazać krótko albo pominąć)
- Regulamin / prywatność (RODO — jedno zdanie)

### Auth / onboarding

- Login e-mail + hasło (konta seed)
- Rejestracja + aktywacja **linkiem z maila** (Mailbux) — tylko jeśli `smtp: up`
- Reset hasła
- Google Sign-In (jeśli Client ID ustawiony; inaczej nie ryzykować)
- Menu profilu: Moje konto / Dane / Ustawienia / Wyloguj

### Kierowca (najmocniejszy wątek domenowy)

- Dashboard — aktywne / nadchodzące zgłoszenia
- **Garaż** — CRUD auta, kategoria/klasa, napęd, wymagane pola, clear-on-edit
- Zdjęcie auta wymagane przy dodaniu (plik JPG/PNG/WebP albo URL), widoczne na karcie; deklaracje (klatka, OC, PZM niezależnie od prawa jazdy B)
- Zapis na event z **wyborem auta**
- **`carMatch`** — proponowane / inne auta vs kategoria eventu (nazwać na głos)
- Filtr eventów **po aucie z garażu** (`carId`) — „pokaż tylko to, na co pasuję”
- Statusy zgłoszenia (PENDING → APPROVED / …)
- Dowód płatności (plik albo URL) przy evencie płatnym
- Anulowanie zgłoszenia
- Konto: adres, Instagram, PZM, zmiana hasła, avatar

### Organizator

- Wniosek „Zostań organizatorem” (typ działalności)
- Panel: tworzenie / edycja eventu (presety, kategorie, wpisowe, lokalizacja, plakat: preset, plik albo URL)
- Lista zgłoszeń do swojego eventu + zmiana statusów
- Mail do kierowcy po zmianie statusu → **skrzynka użytkownika (Mailbux)**
- Nota RODO przy tworzeniu eventu

### Admin

- Zatwierdzanie / odrzucanie eventów (PENDING)
- Wnioski organizatorów → nadanie roli
- Zarządzanie rolami użytkowników (bez self-demote ostatniego admina)
- „Widok z góry” całego katalogu

### Telefon

- **Web PWA** — „Dodaj do ekranu początkowego”, bottom tab bar, safe-area
- **Expo wizytówka** — katalog Eventów (lista / mapa / kalendarz), detal + CTA → web
- Świadoma decyzja: mobile Expo = discovery; web (PWA) = pełna konwersja

### Ustawienia / UX „polishing”

- Motyw: tryb ciemny (Złoty tor, Redline, Ice cold) i tryb jasny (Arctic White, Desert Sand, Blush Pink)
- Responsywność (telefon / DevTools)
- Domyślnie ciemny Złoty tor + font display (Oxanium)

### Backend / infrastruktura (krótko, ale efektownie)

- Docker Compose: web + API + MySQL (+ backup); maile SMTP Mailbux
- Prod: Oracle Always Free + Cloudflare Tunnel → `:8081`
- `GET /api/health` → `db: up`, `smtp: up`
- Seed 3 ról od razu po starcie
- Jeden kontrakt API dla web i mobile
- Rate limit / nagłówki bezpieczeństwa na nginx (jednym zdaniem)

---

## Top 10 „najciekawsze” (gdy mało czasu)

1. Eventy: Lista + Mapa + Kalendarz na wspólnych filtrach
2. `carMatch` przy zapisie
3. Filtr katalogu po aucie z garażu
4. Pełny flow zgłoszenia + statusy
5. Panel organizatora (event → zgłoszenia)
6. Mail na prawdziwą skrzynkę po approve
7. Panel admina (eventy + wnioski org.)
8. Mapa markerów + trasa do toru
9. Web PWA na telefonie **lub** Expo → CTA na web
10. Health + Compose / Oracle jako „działa jak system”, nie mock

---

## Luki (nazwać uczciwie, 15 s)

- Mobile garaż bez pola zdjęcia (web: plik albo URL)
- Spec formularzy: część pól opcjonalna vs wymagana — [`spec-conformity.md`](./spec-conformity.md)
- Galeria odłożona
- Brak App Store / Play (jest PWA weba)
