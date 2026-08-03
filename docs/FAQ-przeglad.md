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

## 3. Expo Web `:8082` „nie działa”

Expo **nie jest usługą Docker Compose**. Po `docker compose up` port 8082 będzie pusty, dopóki nie uruchomisz mobilki osobno:

```bash
cd mobile
npm install
npx expo start --web --port 8082
```

Szczegóły: [`mobile/README.md`](../mobile/README.md).  
E2E Playwright mobile wymaga tego preview — to zamierzone.

---

## 4. `docker compose` pada na `env_file: ./backend/.env.example`

| Było | Jest |
|------|------|
| `.gitignore` miało `.env.*` → plik nie trafiał do git | Wyjątki `!.env.example` i `!backend/.env.example` |
| Brak pliku przy clone | [`backend/.env.example`](../backend/.env.example) jest w repo |

Compose `api` nadal wskazuje `env_file: ./backend/.env.example`; wartości i tak nadpisuje sekcja `environment:` w `docker-compose.yml`.  
Po `git pull` plik powinien być na dysku — **nie usuwaj** wpisu `env_file` bez synchronizacji z zespołem.

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
| Upload plików (grafika/załączniki) | Nadal URL / poza prostym MVP (Specyfikacja Formularzy — etap późniejszy dla binariów) |

---

## Powiązane dokumenty

- Szybki start: [`README.md`](../README.md)  
- Chronologia: [`changes.md`](./changes.md)  
- MVP plan vs stan: [`MVP.md`](./MVP.md)  
- Wytyczne: [`Guidelines.md`](./Guidelines.md)  
