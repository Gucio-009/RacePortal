# RacePortal — aplikacja mobilna: zmiany i efekty pracy

Dokument zbiera **całą historię prac nad `mobile/`** (Expo), decyzje technologiczne, stan przed/po oraz efekty widoczne dla użytkownika i recenzenta.  
Szybki start / emulator: [`../mobile/README.md`](../mobile/README.md). Chronologia całego projektu: [`changes.md`](./changes.md).

**Ostatnia aktualizacja:** 2026-08-03 (~10:55).

---

## 1. Cel i pozycja w monorepo

| Element | Opis |
|---------|------|
| Katalog | `mobile/` |
| Rola | Klient mobilny (iOS / Android / podgląd web) tego samego API co `web/` |
| Backend | Spring Boot `http://…:4000/api/*` (Compose) |
| Nie jest w Docker Compose | Expo startuje osobno; port podglądu web **8082** |

**Efekt:** jeden kontrakt JSON dla web i mobile — bez osobnego „mobile API”.

---

## 2. Decyzja o technologii

| Opcja | Werdykt |
|-------|---------|
| **Expo + React Native** | **Wybrane** — wspólny TS/React z webem, jeden zespół, szybki MVP, Expo Go / Simulator |
| Flutter | Odrzucone na ten etap (osobny język/zespół) |
| Natywnie Swift/Kotlin | Zbyt kosztowne przy istniejącym React |
| PWA / Capacitor | Słabsze UX store / offline vs RN |

**Efekt:** kontynuacja stacku z §9 `changes.md` zamiast przepisywania aplikacji.

---

## 3. Chronologia zmian (mobile)

### Etap A — MVP uproszczony (2026-08-01)

**Było:** brak klienta mobilnego w monorepo.  
**Jest:**

- Expo ~57, React Navigation (stack), UI dark/gold
- Ekrany: **Login**, **lista wydarzeń**, **szczegóły + zapis na start**, wylogowanie
- Token JWT: `expo-secure-store` (native) / `localStorage` (Expo web)
- CORS API rozszerzone o origin Expo web (`:8082`)
- README startowy w `mobile/`

**Efekt:** da się zalogować kontem demo i zapisać na event z telefonu / Expo web.

### Etap B — Testy mobile (2026-08-01+)

| Warstwa | Narzędzie | Zakres |
|---------|-----------|--------|
| Unit | Vitest | `API_URL`, token storage (web) — `mobile/tests/unit.client.test.ts` |
| E2E | Playwright | `tests/e2e/mobile.spec.ts` — login, lista, detal, błąd hasła, wylogowanie (Expo web `:8082`) |

**Efekt:** mobile w tej samej piramidzie testów co API/web (dokumentacja: [`testy/TESTY.md`](./testy/TESTY.md)).

### Etap C — FAQ / przegląd (2026-08-03)

Recenzenci mylili **Expo `:8082`** z usługą Compose oraz **MySQL `:3307`** z HTTP.

**Efekt docs:**

- [`FAQ-przeglad.md`](./FAQ-przeglad.md) §3 — Expo poza Compose
- Instrukcja: `cd mobile && npx expo start --web --port 8082`

### Etap D — Feature parity z webem (2026-08-03)

**Było:** tylko 3 ekrany po zalogowaniu.  
**Jest:** nawigacja tabami + pełny zestaw funkcji API:

| Tab / obszar | Funkcje | Efekt dla użytkownika |
|--------------|---------|------------------------|
| **Eventy** | Lista, filtry (`q`, paid, kategoria), detal, zapis, wybór auta z garażu, link do Apple Maps | Przeglądanie i start jak na webie |
| **Moje** | Zgłoszenia, anulowanie, dowód płatności (URL) | Obsługa płatnego startu z telefonu |
| **Garaż** | CRUD aut (pola jak Spec / web) | Auta do dopasowania przy zapisie |
| **Więcej** | Konto, ustawienia, wyniki/archiwum, galeria (placeholder), organizator, admin, wniosek org., regulamin | Role USER / ORGANIZER / ADMIN |
| **Auth** | Rejestracja (+ OTP), reset hasła | Onboarding bez weba |

**Stack nawigacji:**

- Auth stack: Login → Register / ForgotPassword  
- Main tabs: Eventy · Moje · Garaż · Więcej  
- Stacki zagnieżdżone: detal eventu, panele admin/org.

**Klient API:** `GET/POST/PATCH/DELETE`, obsługa `details` walidacji.

**Efekt:** mobile przestaje być „demo listy eventów” — jest klientem funkcjonalnym pod dyplom / odbiór.

### Etap E — Dokumentacja emulatora iOS (2026-08-03)

**Problem:** na maszynie deweloperskiej był tylko *Command Line Tools*, bez pełnego **Xcode** → brak iOS Simulator (`i` w Expo nie działa).

**Efekt docs:** w [`mobile/README.md`](../mobile/README.md) kroki: App Store → Xcode → `xcode-select` → `simctl` → `npm start` + klawisz `i`. Alternatywa: Expo Go na fizycznym iPhonie + `EXPO_PUBLIC_API_URL`.

### Etap F — Expo Go vs SDK 57 + instrukcja Windows (2026-08-03)

**Problem:** fizyczny telefon + Expo Go ze sklepu → *Project is incompatible with this version of Expo Go* (projekt = SDK 57, sklepowa Go często starsza).

**Efekt docs:**

- macOS: zalecany **iOS Simulator**, nie App Store Expo Go
- Windows: **Android Emulator** (`a`) lub Expo web — bez iOS Simulatora
- [`mobile/README.md`](../mobile/README.md) rozdzielone na sekcje Mac / Windows

---

## 4. Architektura (stan obecny)

```
mobile/
  App.tsx                 # Auth vs MainTabs, theme
  src/
    api/client.ts         # fetch + JWT
    api/types.ts          # User, Event, Car, Registration, Admin…
    context/AuthContext.tsx
    navigation/types.ts
    components/ui.tsx     # wspólne Field / Button / Header
    screens/              # ekrany parity
    theme/colors.ts
  tests/unit.client.test.ts
```

| Warstwa | Technologia |
|---------|-------------|
| Runtime | Expo 57, RN 0.86, React 19 |
| Nawigacja | `@react-navigation/native` + native-stack + **bottom-tabs** |
| Auth storage | SecureStore / localStorage |
| Testy | Vitest + Playwright (web preview) |

**Adresy API (domyślne):**

| Środowisko | Base URL |
|------------|----------|
| iOS Simulator | `http://127.0.0.1:4000` |
| Android emulator | `http://10.0.2.2:4000` |
| Expo web | `http://127.0.0.1:4000` |
| Telefon fizyczny | `EXPO_PUBLIC_API_URL=http://LAN_IP:4000` |

---

## 5. Mapowanie: web → mobile

| Funkcja web | Mobile | Uwagi |
|-------------|--------|-------|
| `/login` | Auth → Login | ✅ |
| `/register` (+ verify) | Register | ✅ |
| `/forgot-password` | ForgotPassword | ✅ |
| `/wydarzenia` | Tab Eventy + filtry | Mapa/kalendarz → skrócone (Maps) |
| `/wydarzenia/:id` | EventDetail | ✅ + wybór auta |
| `/dashboard` | Tab Moje | ✅ |
| `/garaz` | Tab Garaż | ✅ |
| `/konto` | Więcej → Konto | ✅ |
| `/ustawienia` | Więcej → Ustawienia | Lokalnie (SecureStore / localStorage) |
| `/wyniki`, `/archiwum` | Więcej | ✅ |
| `/galeria` | Placeholder „później” | Świadomie jak web |
| `/organizer` | Więcej → Organizator | Formularz eventów uproszczony vs web presets |
| `/admin` | Więcej → Admin | ✅ |
| `/zostan-organizatorem` | Więcej | ✅ |
| `/terms`, `/privacy` | Legal | Skrót treści |

---

## 6. Konta demo (seed API)

| Email | Hasło | Do testów mobile |
|-------|-------|------------------|
| `test@wp.pl` | `test123` | Eventy, garaż, zgłoszenia |
| `org@raceportal.pl` | `org123` | Panel organizatora |
| `admin@raceportal.pl` | `admin123` | Panel admina |

Wymagane: `docker compose up` + `SEED_ENABLED` / `DataInitializer` (szczegóły: [`FAQ-przeglad.md`](./FAQ-przeglad.md)).

---

## 7. Co świadomie **nie** jest (jeszcze) w mobile

| Temat | Powód |
|-------|--------|
| Galeria zdjęć | Odłożona także na webie |
| Pełna mapa Leaflet / kalendarz jak `/wydarzenia` | Zamiast: filtry + Apple Maps z lat/lng |
| Wszystkie selecty/presety organizatora 1:1 z web | Formularz mobilny z kluczowymi polami API |
| Upload plików (binaria) | Jak web — URL |
| Push notifications | Poza obecnym zakresem |
| Publikacja App Store / Play (EAS) | Dev / Expo Go na teraz |

---

## 8. Efekty pracy — podsumowanie „było → jest”

| Obszar | Było | Jest |
|--------|------|------|
| Zakres produktu | Demo 3 ekranów | Klient z parity funkcji web |
| Nawigacja | Jeden stack | Taby + auth + panele ról |
| API client | get/post | + patch/delete + błędy pól |
| Auth | Tylko login | Rejestracja, OTP, reset, profil, hasło |
| Testy | Unit + E2E smoke | Nadal aktualne ścieżki login/lista/detal/wyloguj |
| Docs | Krótki README | README Mac/Windows + [`mobile.md`](./mobile.md) + FAQ Expo Go/SDK 57 |
| Emulator iOS | Niejasny / brak Xcode | Instrukcja Xcode + Simulator; Windows → Android/`web` |

---

## 9. Jak uruchomić — macOS vs Windows

Pełna instrukcja: [`../mobile/README.md`](../mobile/README.md). Skrót:

### Wspólne

1. `docker compose up -d` → `http://127.0.0.1:4000/api/health` → `"db":"up"`
2. `cd mobile && npm install`

### macOS

| Cel | Jak |
|-----|-----|
| **Zalecane** | Xcode + iOS Simulator → `npm start` → klawisz **`i`** |
| Telefon | Ta sama Wi‑Fi + `EXPO_PUBLIC_API_URL=http://<IP_MAC>:4000 npm start` |
| Expo Go vs SDK 57 | Często błąd *incompatible* — **nie polegaj na App Store Expo Go**; użyj Simulatora |
| E2E / smoke | `npx expo start --web --port 8082` |

### Windows

| Cel | Jak |
|-----|-----|
| **Zalecane** | Android Studio (AVD) → `npm start` → klawisz **`a`** (API: `10.0.2.2:4000`) |
| Telefon Android | Wi‑Fi + `$env:EXPO_PUBLIC_API_URL="http://<IP_PC>:4000"; npm start` + Expo Go (ten sam caveat SDK 57) |
| Bez emulatora | `npx expo start --web --port 8082` |
| iOS Simulator | **Niedostępny** natywnie na Windows |

### Expo Go + SDK 57

Projekt = Expo **~57**. Gdy sklepowa Expo Go jest starsza → komunikat *Project is incompatible…*.  
Workaround: Simulator (Mac) / emulator Android (Windows) / Expo web — nie wymaga nowszego Expo Go.

E2E:

```bash
cd mobile && npx expo start --web --port 8082   # osobny terminal
npx playwright test tests/e2e/mobile.spec.ts    # z roota repo
npm --prefix mobile test                        # unit
```

---

## 10. Powiązane pliki

| Plik | Rola |
|------|------|
| [`../mobile/README.md`](../mobile/README.md) | Start **Mac / Windows**, Xcode, Android, Expo Go/SDK 57 |
| [`changes.md`](./changes.md) §9, §10, §24–26 | Chronologia w skali całego projektu |
| [`FAQ-przeglad.md`](./FAQ-przeglad.md) | Expo poza Compose, seed, konta, Expo Go |
| [`testy/TESTY.md`](./testy/TESTY.md) | TC mobile |
| `tests/e2e/mobile.spec.ts` | E2E Expo web |
| `mobile/App.tsx` + `mobile/src/screens/*` | Implementacja |

---

*Dokument utrzymywany przy kolejnych zmianach w `mobile/` — dopisuj sekcję chronologii i aktualizuj tabelę §5 / §8.*
