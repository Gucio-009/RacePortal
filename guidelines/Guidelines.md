# RACEPORTAL — wytyczne projektowe

Kontekst dla agentów i deweloperów pracujących w tym repozytorium.

## Stack

- Frontend: Vite + React + Tailwind + shadcn/ui, font Orbitron, accent `#FFD700`, dark UI
- Backend: `backend/` — Express + Prisma + PostgreSQL + JWT + Zod
- Mobile: `mobile/` — Expo 57 (login, events, rejestracja)
- Docker Compose: `web`, `api`, `db`, `mailhog` (Mailpit), `backup`
- Testy: Vitest (API + mobile unit), Playwright E2E (web + Expo web)
- App lokalnie: http://127.0.0.1:8081/ (nie 8080)

## Dokumentacja — obowiązek aktualizacji

Przy każdej istotnej zmianie aktualizuj:

1. **`MVP.md`** — format porównania (poniżej)
2. **`changes.md`** — chronologia / co doszło
3. **`README.md`** / **`mobile/README.md`** — jeśli zmienia się sposób uruchomienia
4. **`docs/TESTY.md`** + **`docs/wyniki-testow/podsumowanie.md`** — gdy zmienia się zestaw lub wynik testów

### MVP.md — obowiązkowy format porównania

Przy każdej istotnej zmianie **aktualizuj `MVP.md`** w układzie:

1. **Co miało być** — zakres MPC (nie usuwać)
2. **Co jest** — tabela funkcja → stan → werdykt (OK / Częściowo / Brak)
3. **Co zostało zrobione** — domknięte względem MVP
4. **Co zostało do zrobienia** — luki vs MVP / odbiór
5. **Co zrobione ponad MVP** — extras poza wymaganiami

Zaktualizuj też datę „Ostatnia synchronizacja” i skrót w sekcji 7.

## Zasady

- Zmiany funkcjonalne dokumentuj w `changes.md` i synchronizuj `MVP.md` jak wyżej
- Auth idzie wyłącznie przez API (`raceportal_token`); bez działającego `api` logowanie nie działa
- Nie commitować sekretów; JWT / DB hasła w compose to wartości deweloperskie
- Nie dodawać mocków localStorage auth z powrotem, o ile użytkownik tego nie zażąda
- Design: trzymaj się istniejącego dark/gold looku; nie wprowadzaj domyślnych „AI purple” motywów
- Social login (Google/Facebook) to UI demo — nie produkcyjny OAuth
- Po dodaniu / zmianie ścieżek krytycznych uzupełnij testy (API Vitest lub Playwright) i odśwież wyniki w `docs/wyniki-testow/`

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
npm --prefix backend test
npm --prefix mobile test
npx playwright test
# albo: npm run test:report
```

| Usługa | Adres |
|--------|--------|
| Web | http://127.0.0.1:8081/ |
| API | http://127.0.0.1:4000/api/health |
| Maile | http://127.0.0.1:8025/ |
| Expo web | http://127.0.0.1:8082/ |

Dokumentacja testów: [`docs/TESTY.md`](../docs/TESTY.md)
