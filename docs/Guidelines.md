# RACEPORTAL — wytyczne projektowe

Kontekst dla agentów i deweloperów pracujących w tym repozytorium.

## Stack

- Frontend: `web/` — Vite + React + Tailwind + shadcn/ui, font Orbitron, accent `#FFD700`, dark UI
- Backend: `backend/` — Spring Boot 3 + MySQL + JWT + Bean Validation
- Mobile: `mobile/` — Expo 57 (login, events, rejestracja)
- Docs: `docs/` · E2E: `tests/e2e/` · Scripts: `scripts/`
- Docker Compose: `web`, `api`, `mysql`, `mailhog` (Mailpit), `backup`
- Testy: JUnit/MockMvc/Testcontainers (API), Vitest (mobile unit), Playwright E2E (web + Expo web)
- App lokalnie: http://127.0.0.1:8081/ (nie 8080)

## Dokumentacja — obowiązek aktualizacji

Przy każdej istotnej zmianie aktualizuj:

1. **`docs/MVP.md`** — format porównania (poniżej)
2. **`docs/changes.md`** — chronologia / co doszło (**z godziną**, nie samym dniem)
3. **`README.md`** / **`mobile/README.md`** — jeśli zmienia się sposób uruchomienia
4. **`docs/testy/TESTY.md`** + **`docs/testy/wyniki/podsumowanie.md`** — gdy zmienia się zestaw lub wynik testów

### `changes.md` — format historii (obowiązkowy)

Każdy nowy wpis musi zawierać:

1. **Datę i godzinę** (np. `2026-08-02 08:27` albo zakres `08:27–08:31`) — nigdy tylko dzień  
2. Tabelę lub listę **Było → Jest → Dlaczego** (argument decyzji, nie sama lista plików)  
3. Krótki kontekst *po co* zmiana (problem użytkownika / Dokumentacja / demo)  
4. Główne pliki + sposób weryfikacji  

Bez uzasadnienia („dlaczego A zamiast B”) wpis jest niepełny.

### MVP.md — obowiązkowy format porównania

Przy każdej istotnej zmianie **aktualizuj `docs/MVP.md`** w układzie:

1. **Co miało być** — zakres MPC (nie usuwać)
2. **Co jest** — tabela funkcja → stan → werdykt (OK / Częściowo / Brak)
3. **Co zostało zrobione** — domknięte względem MVP
4. **Co zostało do zrobienia** — luki vs MVP / odbiór
5. **Co zrobione ponad MVP** — extras poza wymaganiami

Zaktualizuj też datę „Ostatnia synchronizacja” i skrót w sekcji 7.

## Zasady

- Zmiany funkcjonalne dokumentuj w `docs/changes.md` (**data+godzina** + **było/jest/dlaczego**) i synchronizuj `docs/MVP.md` jak wyżej
- Auth idzie wyłącznie przez API (`raceportal_token`); bez działającego `api` logowanie nie działa
- Nie commitować sekretów; JWT / DB hasła w compose to wartości deweloperskie
- Nie dodawać mocków localStorage auth z powrotem, o ile użytkownik tego nie zażąda
- Design: trzymaj się istniejącego dark/gold looku; nie wprowadzaj domyślnych „AI purple” motywów
- Social login (Google/Facebook) to UI demo — nie produkcyjny OAuth
- Po dodaniu / zmianie ścieżek krytycznych uzupełnij testy (JUnit API lub Playwright) i odśwież wyniki w `docs/testy/wyniki/`

## Seed / Compose / porty

**Źródło prawdy dla recenzentów:** [`FAQ-przeglad.md`](./FAQ-przeglad.md) (seed, MySQL TCP, Expo poza Compose, `.env.example`).

Krótko: seed = `DataInitializer` przy starcie API; MySQL `:3307` ≠ HTTP; Expo `:8082` ręcznie z `mobile/`.

## Konta deweloperskie (seed)

| Rola | Email | Hasło |
|------|-------|-------|
| Admin | `admin@raceportal.pl` | `admin123` |
| Organizator | `org@raceportal.pl` | `org123` |
| Kierowca | `test@wp.pl` | `test123` |

## Komendy

```bash
docker compose up --build -d --remove-orphans
docker compose down

# Testy (wymaga Docker; E2E mobile → Expo na :8082)
npm run test:api
npm run test:mobile-unit
npx playwright test
# albo: npm run test:report
```

| Usługa | Adres |
|--------|--------|
| Web | http://127.0.0.1:8081/ |
| API | http://127.0.0.1:4000/api/health |
| MySQL | localhost:3307 |
| Maile | http://127.0.0.1:8025/ |
| Expo web | http://127.0.0.1:8082/ |

Dokumentacja testów: [`docs/testy/TESTY.md`](./testy/TESTY.md)
