# Backoffice — bo.raceportal.pl

Status: **w implementacji** (shell BO + auth + CSV + cookie Domain).

---

## Cel

Osobny, **desktopowy** panel operacyjny dla roli **ADMIN** na subdomenie `https://bo.raceportal.pl`.

- Ten sam backend / te same konta co `raceportal.pl`.
- Maksimum czytelności i eksportów CSV („wow, jakie możliwości”).
- Uproszczony `/admin` na apexie **zostaje** — BO go nie zastępuje.

---

## Auth

| Reguła | Opis |
|--------|------|
| Kto | Tylko `role === ADMIN` |
| Dane | Te same co na `raceportal.pl` (email/hasło + **Google**) |
| Rejestracja | **Brak** na `bo.*` (żadnych CTA „załóż konto” / Google sign-up) |
| Non-admin | Po udanym logowaniu / Google: twarda odmowa + wylogowanie (komunikat „brak dostępu”) |
| Sesja | Współdzielona z apexem (te same cookies / JWT) — admin zalogowany na jednym hoście jest zalogowany na drugim |

Google: tylko ścieżka **sign-in**. Konto Google bez roli ADMIN → odmowa (bez soft complete-registration).

---

## Relacja do apexu

| Powierzchnia | Rola |
|--------------|------|
| `raceportal.pl/admin` | Istniejący, uproszczony panel admina — **zostaje** |
| `bo.raceportal.pl` | Pełny backoffice (hub + sidebar + eksporty) |

W headerze BO: link **do RacePortal** (`https://raceportal.pl`) + **Wyloguj**.

---

## Layout (desktop-only)

- **Sidebar** (nawigacja stała): Hub · Wydarzenia · Użytkownicy · Wnioski org. · Błędy · (ew. Archiwum / inne później).
- **Główna treść** — tabele / listy z dużą czytelnością (gęstość tabelaryczna, jasne statusy, bez marketingu).
- **Mobile / PWA BO** — out of scope (tylko PC).

---

## URL-e

| Ścieżka | Widok |
|---------|--------|
| `/` | Hub startowy |
| `/logowanie` | Logowanie (email/hasło + Google); bez rejestracji |
| `/wydarzenia` | Wydarzenia (pending + approved / filtry statusu) |
| `/uzytkownicy` | Użytkownicy |
| `/wnioski` | Wnioski organizatora |
| `/bledy` | Zgłoszenia błędów (bug reports) |

Niezalogowany → `/logowanie`. Zalogowany non-admin → odmowa. Zalogowany ADMIN na `/logowanie` → redirect `/`.

---

## Widok startowy — Hub

Jeden czytelny ekran operacyjny:

1. Kim jesteś (username / email / rola ADMIN).
2. **Kolejka wymagająca akcji** — liczby + CTA:
   - wydarzenia `PENDING`
   - wnioski org. `PENDING`
   - otwarte / nowe bugi (wg aktualnego modelu statusów API)
3. Szybkie wejścia do modułów (duże kafelki / linki sidebaru).

Bez hero, bez „nadchodzących wyścigów”, bez statystyk vanity.

---

## Moduły MVP (1:1 obecny AdminPanel + eksport)

Funkcje jak dziś w `AdminPanelPage` (i powiązanych komponentach), przeniesione / rozłożone na trasy BO:

| Moduł | Zakres |
|-------|--------|
| Wydarzenia | Pending approval, approved; akceptacja / odrzucenie (z powodem), anulacja, archiwizacja, podgląd |
| Użytkownicy | Lista, zmiana roli (nie własnej), usuwanie konta (jak dziś) |
| Wnioski org. | Pending / historia; approve → rola ORGANIZER; reject |
| Błędy | Lista zgłoszeń bugów (jak `AdminBugReports`) |

**Czytelność:** czytelne tabele, statusy jako badge, filtry/szukaj gdzie ma sens, zero zbędnych kart.

---

## Eksport CSV — „wszystko co możliwe”

Cel: admin ma poczucie pełnej kontroli nad danymi.

### Zasady

- Przycisk **Eksport CSV** na każdej liście / widoku tabelarycznym.
- Eksportuje **aktualny zakres widoku** (po filtrach / wyszukiwaniu), plus osobno opcja „eksportuj wszystko” jeśli filtr jest aktywny (doprecyzować w implementacji — domyślnie: to, co widać + jasny label).
- Encoding: **UTF-8 z BOM** (Excel PL otwiera polskie znaki).
- Separator: **`;`** (Excel PL).
- Nazwa pliku: `bo-{zasób}-{YYYYMMDD-HHMM}.csv`.

### MVP — obowiązkowe eksporty

| Zasób | Przykładowe kolumny |
|-------|---------------------|
| Wydarzenia | id, name, status, category, date, track, city, voivodeship, paid, entryFee, organizerUsername, organizerEmail, createdAt, rejectionReason, … |
| Użytkownicy | id, username, email, role, googleAccount, createdAt, phone, firstName, lastName, … (bez haseł / sekretów) |
| Wnioski org. | id, status, userUsername, userEmail, company, businessType, message, createdAt, … |
| Bug reports | id, status, username, accountEmail, description, createdAt, … |

### „Wow” — rozszerzenia (MVP jeśli API już daje dane; inaczej v2)

- Zgłoszenia (registrations) per wydarzenie / globalnie
- Garaż / auta (jeśli endpoint admina istnieje lub łatwo dodać)
- Eksport „pełny dump operacyjny” z Huba (jeden ZIP lub kilka CSV naraz) — **opcjonalne v1.1**

**Bezpieczeństwo CSV:** tylko ADMIN; te same guardy co API admin; nie eksportować tokenów, hashów haseł, refresh tokenów.

---

## i18n

- **Tylko PL** (hardcoded PL lub osobny namespace i18n tylko `pl` — decyzja przy implementacji; nie wymagamy EN na BO).

---

## Infrastruktura (już jest)

- DNS + tunnel: `bo.raceportal.pl` → ten sam nginx `:8081`.
- Później: rozróżnienie hosta w nginx / osobny entry SPA dla BO (ta sama VM, bez osobnej maszyny).

---

## Out of scope (v1)

- Mobile / PWA backoffice
- Rejestracja na `bo.*`
- Role ORGANIZER / USER w BO
- Osobna VM / osobny backend
- EN
- Zastąpienie `/admin` na apexie

---

## Kryteria „bo.md gotowe → można kodować”

- [x] Auth: ADMIN only, Google OK, brak rejestracji, hard deny non-admin  
- [x] Apex `/admin` zostaje  
- [x] Hub startowy + sidebar + URL-e jak wyżej  
- [x] Moduły 1:1 AdminPanel + CSV „wszystko co możliwe”  
- [x] Desktop only, PL only  
- [x] Potwierdzenie właściciela + start implementacji

## Implementacja (kod)

- Host-aware router: `web/src/app/bo/*` gdy hostname `bo.*`
- Cookies: `COOKIE_DOMAIN=.raceportal.pl` + CORS z `https://bo.raceportal.pl`
- Apex `/admin` bez zmian
- Po deployu: w Google Cloud Console dodać origin `https://bo.raceportal.pl`
- Na VM w `.env`: `COOKIE_SECURE=true`, `COOKIE_DOMAIN=.raceportal.pl`, potem recreate `api`
