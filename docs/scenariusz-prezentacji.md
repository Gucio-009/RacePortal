# RacePortal — scenariusz prezentacji (demo)

**Cel:** pokazać ciekawe rzeczy produktu na żywo (~10–12 min), nie wykład o stacku.  
**Środowisko:** `docker compose up -d` → web `:8081`, API `:4000`, Mailpit `:8025`; mobile Expo osobno (`:8082` / Simulator).

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
4. **Organizator (2 min)** — event + zgłoszenia + Mailpit.
5. **Admin (1 min)** — approve eventu / wniosku org.
6. **Mobile wizytówka (1–1,5 min)** — katalog → CTA „Zapisz się na stronie”.
7. **Domknięcie (30 s)** — Compose, health, jeden API; uczciwie o lukach (upload = URL).

**Plan B:** nagranie 60–90 s (eventy → zapis → mail → mobile CTA), konta seed na kartce.

**Unikać na żywo:** długa rejestracja+OTP, wykład JWT, obiecywanie store/PSP, „parity mobile = web”.

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
- Rejestracja + weryfikacja kodem (mail w Mailpit) — tylko jeśli SMTP działa
- Reset hasła
- Google Sign-In (jeśli Client ID ustawiony; inaczej nie ryzykować)
- Menu profilu: Moje konto / Dane / Ustawienia / Wyloguj

### Kierowca (najmocniejszy wątek domenowy)

- Dashboard — aktywne / nadchodzące zgłoszenia
- **Garaż** — CRUD auta, kategoria/klasa, napęd, wymagane pola, clear-on-edit
- Zdjęcie auta (URL) + deklaracje (klatka, OC, PZM niezależnie od prawa jazdy B)
- Zapis na event z **wyborem auta**
- **`carMatch`** — proponowane / inne auta vs kategoria eventu (nazwać na głos)
- Filtr eventów **po aucie z garażu** (`carId`) — „pokaż tylko to, na co pasuję”
- Statusy zgłoszenia (PENDING → APPROVED / …)
- Dowód płatności (URL) przy evencie płatnym
- Anulowanie zgłoszenia
- Konto: adres, Instagram, PZM, zmiana hasła, avatar

### Organizator

- Wniosek „Zostań organizatorem” (typ działalności)
- Panel: tworzenie / edycja eventu (presety, kategorie, wpisowe, lokalizacja, plakat URL)
- Lista zgłoszeń do swojego eventu + zmiana statusów
- Mail do kierowcy po zmianie statusu → **Mailpit**
- Nota RODO przy tworzeniu eventu

### Admin

- Zatwierdzanie / odrzucanie eventów (PENDING)
- Wnioski organizatorów → nadanie roli
- Zarządzanie rolami użytkowników (bez self-demote ostatniego admina)
- „Widok z góry” całego katalogu

### Mobile (wizytówka)

- Katalog Eventów: lista / mapa / kalendarz (gość, bez logowania)
- Detal + CTA **„Zapisz się na stronie”** → web
- Świadoma decyzja: mobile = discovery, web = konwersja

### Ustawienia / UX „polishing”

- Motyw / akcent kolorystyczny (`--race-accent`)
- Responsywność (resize albo viewport mobile w DevTools)
- Spójny dark UI + font display (Oxanium)

### Backend / infrastruktura (krótko, ale efektownie)

- Docker Compose: web + API + MySQL + Mailpit (+ backup)
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
6. Mail w Mailpit po approve
7. Panel admina (eventy + wnioski org.)
8. Mapa markerów + trasa do toru
9. Mobile → CTA na web
10. Health + Compose jako „działa jak system”, nie mock

---

## Świadomie słabsze (nie obiecywać / nie rozwijać na scenie)

- Upload plików (jest URL, nie multipart)
- Galeria „pełna”
- Płatność PSP (tylko status + dowód URL)
- Mobile bez garażu / logowania
- Facebook OAuth / publikacja w store

---

## Powiązane

- Luki Spec formularzy: [`spec-conformity.md`](./spec-conformity.md)
- Pomysły produktowe: [`pomysly-rozwoju.md`](./pomysly-rozwoju.md)
- Stan MVP: [`MVP.md`](./MVP.md)
- Mobile: [`mobile.md`](./mobile.md)

---

*Utworzono: 2026-10-08 — checklista demo pod prezentację wtorkową.*
