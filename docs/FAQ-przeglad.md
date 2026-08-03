# RacePortal — FAQ dla przeglądu / odbioru

**Jedno miejsce na powtarzające się pytania.** Przed zgłoszeniem „usługa nie działa” / „gdzie seed?” przeczytaj poniższe.  
Aktualizacja: **2026-08-03**.

---

## 1. Gdzie jest seed bazy danych?

| Co | Szczegół |
|----|----------|
| Klasa | [`backend/src/main/java/pl/raceportal/service/DataInitializer.java`](../backend/src/main/java/pl/raceportal/service/DataInitializer.java) |
| Mechanizm | Spring `CommandLineRunner` — uruchamia się **przy starcie API** |
| Flaga | `SEED_ENABLED=true` (Compose) / `app.seed.enabled` |
| Pierwszy start | Brak użytkownika `admin@raceportal.pl` → tworzy admin/org/kierowca + eventy demo |
| Kolejne starty | Idempotentnie: `ensurePaidDemoEvents()`, `ensureDemoGarageCars()` |
| Logi | `docker compose logs api \| grep -i seed` |

Nie ma osobnego skryptu SQL „seed.sql” — inicjalizacja jest w Java przy bootcie Springa.

---

## 2. MySQL na `:3307` „nie działa” (HTTP / przeglądarka)

MySQL **nie serwuje HTTP**. Port **3307** to protokół MySQL (TCP).

| Sprawdzenie | Komenda / adres |
|-------------|-----------------|
| Kontener healthy | `docker compose ps` → `raceportal-mysql` = healthy |
| API widzi DB | http://127.0.0.1:4000/api/health → `"db":"up"` |
| Ping MySQL | `docker compose exec mysql mysqladmin ping -h 127.0.0.1 -uroot -proot` |

Błąd „connection refused” w przeglądarce na `http://localhost:3307` **nie oznacza**, że MySQL jest wyłączony.

---

## 3. Expo Web `:8082` / Expo Go „nie działa”

### Expo poza Compose

Expo **nie jest usługą Docker Compose**. Po `docker compose up` port 8082 będzie pusty, dopóki nie uruchomisz mobilki osobno:

```bash
cd mobile
npm install
npx expo start --web --port 8082
```

### Expo Go: *Project is incompatible with this version of Expo Go*

Projekt używa **Expo SDK 57**. Expo Go z App Store / Play często jest **starsze** → nie otworzy projektu.

| System | Co robić |
|--------|----------|
| **macOS** | Xcode → iOS Simulator → `npm start` → **`i`** |
| **Windows** | Android Studio (emulator) → `npm start` → **`a`**, albo Expo web `:8082` |
| Telefon | Ta sama Wi‑Fi + `EXPO_PUBLIC_API_URL=http://IP_PC:4000` — **tylko** jeśli Expo Go obsługuje SDK 57 |

Pełna instrukcja Mac/Windows: [`mobile/README.md`](../mobile/README.md).  
Historia / efekty: [`mobile.md`](./mobile.md).  
E2E Playwright mobile wymaga preview web `:8082` — to zamierzone.

---

## 4. Compose i `.env.example`

**Status:** zamknięte. Po `git pull` na `wojtek` plik jest w repo.

**Co zgłaszano (kiedyś):**  
`docker-compose.yml` wymaga pliku `backend/.env.example`. Reguła `.env.*` w `.gitignore` sprawiała, że Git **nie commitował** tego pliku. Autor miał go lokalnie → u niego działało. Po `git clone` pliku nie było → Compose padał z błędem „env file not found”.

**Co zrobiono:**  
- wyjątki w `.gitignore`: `!.env.example` i `!backend/.env.example`  
- plik [`backend/.env.example`](../backend/.env.example) jest w Git  

**Sprawdzenie:** `ls backend/.env.example` po clone/pull — plik musi być.  
Compose nadal może mieć `env_file: ./backend/.env.example`; prawdziwe wartości i tak nadpisuje sekcja `environment:` w Compose.

---

## 5. Konta demo (logowanie)

| Rola | Email | Hasło |
|------|-------|-------|
| Admin | `admin@raceportal.pl` | `admin123` |
| Organizator | `org@raceportal.pl` | `org123` |
| Kierowca | `test@wp.pl` | `test123` |

URL: http://127.0.0.1:8081/login

---

## 6. Co jest w Compose, a co nie?

| Usługa | Compose? | Port hosta |
|--------|----------|------------|
| Web (nginx) | tak | 8081 |
| API (Spring) | tak | 4000 |
| MySQL | tak | 3307 → 3306 |
| Mailpit | tak | 8025 (UI), 1025 (SMTP) |
| Backup cron | tak | — |
| Expo web | **nie** | 8082 (ręcznie) |

---

## 7. Logi

```bash
docker compose logs api -f          # backend / seed / błędy walidacji
docker compose logs web -f          # nginx access
docker compose logs api --tail 100
```

Komunikat UI „Nieprawidłowe dane” = walidacja Bean Validation; szczegóły pól są w body JSON (`details`) i w toastcie klienta.

---

## 8. Funkcje często mylone przy przeglądzie

| Temat | Stan |
|-------|------|
| 3 widoki wydarzeń | `/wydarzenia` — Lista / Mapa / Kalendarz (wspólne filtry) |
| Filtr po aucie z garażu | Zalogowany kierowca → select auta na `/wydarzenia` |
| Edycja wydarzenia | Panel organizatora → **Edytuj** (PATCH API) |
| Admin nie może odebrać sobie roli | API + UI blokują self-demote / ostatniego ADMINA |
| Galeria | Świadomie **odłożona** (nav: „później”) — nie jest luką MVP do domknięcia teraz |
| Mobile Expo | Parity z webem (taby Eventy/Moje/Garaż/Więcej) — zob. [`mobile/README.md`](../mobile/README.md); iOS wymaga pełnego **Xcode** |
| Upload plików (grafika/załączniki) | Nadal URL / poza prostym MVP (Specyfikacja Formularzy — etap późniejszy dla binariów) |

---

## Powiązane dokumenty

- Szybki start: [`README.md`](../README.md)  
- Chronologia: [`changes.md`](./changes.md)  
- MVP plan vs stan: [`MVP.md`](./MVP.md)  
- Wytyczne: [`Guidelines.md`](./Guidelines.md)  
