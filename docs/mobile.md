# RacePortal — aplikacja mobilna: zmiany i efekty pracy

Dokument zbiera **całą historię prac nad `mobile/`** (Expo), decyzje technologiczne, stan przed/po oraz efekty widoczne dla użytkownika i recenzenta.  
Szybki start / emulator: [`../mobile/README.md`](../mobile/README.md). Chronologia całego projektu: [`changes.md`](./changes.md).

**Ostatnia aktualizacja:** 2026-09-14 (~19:30).

---

## 1. Cel i pozycja w monorepo

| Element | Opis |
|---------|------|
| Katalog | `mobile/` |
| Rola | **Wizytówka** — publiczny katalog wydarzeń (lista / mapa / kalendarz + detal); zapis i konta tylko na webie |
| Backend | Spring Boot `http://…:4000/api/*` (Compose) — tylko publiczne GET |
| CTA web | `EXPO_PUBLIC_WEB_URL` → `/wydarzenia/:id` (Compose web **8081**) |
| Nie jest w Docker Compose | Expo startuje osobno; port podglądu Expo web **8082** |

**Efekt:** mobilka nie dubluje auth/garażu — katalog + deep-link do weba.

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
| **Eventy** | Lista, filtry (`q`, paid, kategoria, woj., daty), **Wyczyść filtry** (web), detal, zapis, wybór auta, Google Maps | Przeglądanie i start jak na webie |
| **Moje** | Zgłoszenia (bez CANCELED), long-press anuluj, dowód płatności (URL) | Obsługa płatnego startu z telefonu |
| **Garaż** | CRUD + cyfry-only + clear-on-edit (null); wymagane pola mocniejsze na web | Auta do dopasowania przy zapisie |
| **Więcej** | Konto (adres/IG/PZM niezależne), ustawienia (**akcent ThemeContext** + goBack), org/admin | Role USER / ORGANIZER / ADMIN |
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

### Etap G — Code review + gość + carMatch (2026-08-03)

**Było:** wymuszony login; auta bez dopasowania kategorii; credentials w polach.  
**Jest:** przeglądanie Eventów jako gość; `carMatch`; puste pola logowania; E2E zaktualizowane.  
Szczegóły: [`review-2026-08-03.md`](./review-2026-08-03.md).

---

## 4. Architektura (stan obecny — wizytówka)

```
mobile/
  App.tsx                 # ThemeProvider + stack Eventy
  src/
    api/client.ts         # publiczne GET + WEB_URL / webEventUrl
    api/types.ts          # typy Event (katalog)
    navigation/types.ts   # EventsStackParamList
    components/ui.tsx
    screens/EventsScreen.tsx
    screens/EventDetailScreen.tsx
    theme/
  tests/unit.client.test.ts
```

| Warstwa | Technologia |
|---------|-------------|
| Runtime | Expo 57, RN 0.86, React 19 |
| Nawigacja | `@react-navigation/native` + native-stack (tylko Eventy) |
| Auth | brak — gość zawsze |
| Testy | Vitest (API/WEB URL) + Playwright (katalog / detal / CTA) |

**Adresy (domyślne):**

| Środowisko | API | WEB (CTA) |
|------------|-----|-----------|
| iOS Simulator | `http://127.0.0.1:4000` | `http://127.0.0.1:8081` |
| Android emulator | `http://10.0.2.2:4000` | `http://10.0.2.2:8081` |
| Expo web | `http://127.0.0.1:4000` | `http://127.0.0.1:8081` |
| Telefon fizyczny | `EXPO_PUBLIC_API_URL` | `EXPO_PUBLIC_WEB_URL` |

---

## 5. Mapowanie: web → mobile

| Funkcja web | Mobile | Uwagi |
|-------------|--------|-------|
| `/wydarzenia` | EventsList (lista / kalendarz / mapa) | Publiczne filtry |
| `/wydarzenia/:id` | EventDetail + CTA Linking | Zapis tylko na webie |
| Login / Moje / garaż / org / admin / legal | — | Świadomie poza mobilką |

---

## 6. Konta demo

Konta seed (`test@wp.pl` itd.) służą **tylko webowi** — mobilka nie loguje.  
Szczegóły: [`FAQ-przeglad.md`](./FAQ-przeglad.md).

---

## 7. Co świadomie **nie** jest w mobile

| Temat | Powód |
|-------|--------|
| Auth / garaż / Moje / role | Produkt = wizytówka; konwersja na webie |
| Archiwum / wyniki / galeria | Wybrane A — tylko Eventy |
| Push / store (EAS) | Poza zakresem |

---

## 8. Efekty pracy — podsumowanie „było → jest”

| Obszar | Było (parity) | Jest (wizytówka) |
|--------|---------------|------------------|
| Zakres | Taby Eventy/Moje/Garaż/Więcej + auth | Stack Eventy + CTA web |
| API client | JWT + CRUD | Publiczne GET + `webEventUrl` |
| Testy | Login / wylogowanie | Gość: lista / widoki / detal / CTA |

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
| [`spec-conformity.md`](./spec-conformity.md) | Luki vs Specyfikacja Formularzy (upload, wymagalne pola) |
| [`testy/TESTY.md`](./testy/TESTY.md) | TC mobile |
| `tests/e2e/mobile.spec.ts` | E2E Expo web |
| `mobile/App.tsx` + `mobile/src/screens/*` | Implementacja |
| `mobile/src/theme/ThemeContext.tsx` | Akcent gold/redline/ice |

---

### Etap E — UX / Spec (2026-09-14)

- ThemeContext: zmiana akcentu + Alert + zamknięcie Settings  
- Clear-on-edit numerów w garażu; większy gap na „Moje”  
- Profil: adres, Instagram, PZM niezależny; wniosek org. z `businessType`  

Luki względem Spec (upload plików, wymagane imię/telefon itd.): [`spec-conformity.md`](./spec-conformity.md).

### Etap H — Mobilka-wizytówka (2026-09-14)

**Było:** feature parity (auth, Moje, garaż, Więcej, org/admin).  
**Jest:** tylko stack Eventy; detal z CTA `Linking` → web `/wydarzenia/:id`; usunięte ekrany auth/ról i `AuthContext`.

**Efekt:** katalog publiczny bez konta; konwersja zapisu na webie Compose `:8081`.

---

*Dokument utrzymywany przy kolejnych zmianach w `mobile/` — dopisuj sekcję chronologii i aktualizuj tabelę §5 / §8.*
