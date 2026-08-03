# RacePortal Mobile (Expo)

Aplikacja Expo (**SDK 57**) z feature parity względem weba — ten sam kontrakt `/api/*`.  
Backend: Spring Boot na porcie **4000** (Docker Compose).

| Dokument | Zawartość |
|----------|-----------|
| **Ten plik** | Jak odpalić (macOS / Windows), API URL, konta |
| [`docs/mobile.md`](../docs/mobile.md) | Historia zmian, efekty, mapowanie web→mobile |
| [`docs/FAQ-przeglad.md`](../docs/FAQ-przeglad.md) | Typowe pomyłki (Expo poza Compose, Expo Go vs SDK) |

---

## Wspólne wymagania (Mac i Windows)

1. **Node.js** (LTS, np. 20+)
2. **Docker Desktop** + działający stack API:
   ```bash
   # z katalogu głównego repo
   docker compose up -d
   curl http://127.0.0.1:4000/api/health
   ```
   Oczekiwane: `"status":"ok"`, `"db":"up"`.
3. Zależności mobile:
   ```bash
   cd mobile
   npm install
   ```

---

## macOS — krok po kroku

### A) iOS Simulator (zalecane przy SDK 57)

Expo Go z App Store **często nie obsługuje jeszcze SDK 57** → na iPhonie dostaniesz  
`Project is incompatible with this version of Expo Go`.  
**Simulator omija ten problem.**

1. Zainstaluj **Xcode** z App Store (duży download).
2. W Xcode dociągnij **iOS Simulator Runtime** (Settings → Platforms), jeśli jeszcze nie ma.
3. Raz otwórz Xcode, zaakceptuj licencję, potem:
   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   xcrun simctl list devices available | grep iPhone
   ```
4. Uruchom Metro i Simulator:
   ```bash
   cd mobile
   npm start
   # w terminalu Expo naciśnij: i
   ```
   Albo jednym poleceniem: `npx expo start --ios`.
5. Zaloguj się: `test@wp.pl` / `test123`.

API na Simulatorze: **`http://127.0.0.1:4000`** (domyślnie, bez zmiennych).

### B) Fizyczny iPhone (ta sama sieć Wi‑Fi)

1. Ustal IP Maca (np. Ustawienia systemowe → Sieć, albo `ipconfig getifaddr en0`).
2. Start z URL API na LAN:
   ```bash
   cd mobile
   EXPO_PUBLIC_API_URL=http://192.168.x.x:4000 npm start
   ```
3. **Opcja 1 — Simulator / development client** (gdy iOS runtime jest OK).  
   **Opcja 2 — Expo Go:** działa tylko jeśli wersja Expo Go w App Store **obsługuje SDK 57**.  
   Jeśli błąd *incompatible with this version of Expo Go* → użyj Simulatora albo czekaj na update sklepu (ew. `eas go` / development build — poza MVP).

### C) Podgląd w przeglądarce (E2E)

```bash
cd mobile
npx expo start --web --port 8082
```

---

## Windows — krok po kroku

Na Windows **nie ma** oficjalnego iOS Simulatora. Realistyczne ścieżki: **Android Emulator**, **Expo Go (Android)** albo **Expo web**.

### 0) Wymagania

- [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) (WSL2 zalecane)
- [Node.js LTS](https://nodejs.org/)
- Opcjonalnie: [Android Studio](https://developer.android.com/studio) + emulator (AVD)

### 1) API

W **PowerShell** / terminalu (katalog główny repo):

```powershell
docker compose up -d
curl http://127.0.0.1:4000/api/health
```

### 2) Mobile — Android Emulator (zalecane)

1. Android Studio → Device Manager → utwórz/uruchom AVD (np. Pixel).
2. W nowym terminalu:
   ```powershell
   cd mobile
   npm install
   npm start
   ```
3. Naciśnij **`a`** (Android) albo:
   ```powershell
   npx expo start --android
   ```

API na emulatorze Androida: klient sam używa **`http://10.0.2.2:4000`** (alias hosta z poziomu emulatora).

### 3) Mobile — telefon Android + Expo Go

1. Telefon i PC w **tej samej sieci Wi‑Fi**.
2. IP komputera: `ipconfig` → adres IPv4 karty Wi‑Fi / Ethernet.
3. ```powershell
   cd mobile
   $env:EXPO_PUBLIC_API_URL="http://192.168.x.x:4000"
   npm start
   ```
4. Zeskanuj QR w **Expo Go**.  
   Przy błędzie *incompatible … Expo Go* (SDK 57 vs sklep): użyj **emulatora Android** (`a`) albo Expo web — nie downgrade’uj projektu „w ciemno”.

### 4) Mobile — tylko przeglądarka (bez telefonu)

```powershell
cd mobile
npx expo start --web --port 8082
```

Otwórz `http://localhost:8082` — wystarczy do smoke / E2E.

---

## API URL — ściągawka

| Środowisko | Base URL API |
|------------|--------------|
| iOS Simulator (Mac) | `http://127.0.0.1:4000` |
| Android Emulator | `http://10.0.2.2:4000` (ustawiane automatycznie) |
| Expo web | `http://127.0.0.1:4000` |
| Fizyczny telefon | `EXPO_PUBLIC_API_URL=http://<IP_PC>:4000` |

Sprawdzenie API z hosta: `http://127.0.0.1:4000/api/health`.

---

## Expo Go vs SDK 57 (ważne)

Projekt: **`expo: ~57`**.

| Sytuacja | Co robić |
|----------|----------|
| Błąd: *Project is incompatible with this version of Expo Go* | Expo Go w sklepie jest za stary względem SDK 57 |
| Mac | **iOS Simulator** (`i`) — bez czekania na App Store |
| Windows | **Android Emulator** (`a`) lub Expo web `:8082` |
| Update Expo Go w sklepie | Pomaga dopiero gdy sklep wypuści build pod SDK 57 |

Komunikat `npx expo install --check` (pakiety do aktualizacji) jest osobną sprawą — nie blokuje startu Simulatora/emulatora.

---

## Konta demo

| Email | Hasło | Rola |
|-------|-------|------|
| `test@wp.pl` | `test123` | kierowca |
| `org@raceportal.pl` | `org123` | organizator |
| `admin@raceportal.pl` | `admin123` | admin |

---

## Zakres (parity z webem)

| Obszar | Status |
|--------|--------|
| Login / rejestracja / reset hasła | ✅ |
| Wydarzenia + filtry (q, paid, kategoria) | ✅ |
| Szczegóły + zapis + wybór auta | ✅ |
| Moje zgłoszenia / dowód płatności | ✅ |
| Garaż CRUD | ✅ |
| Konto + zmiana hasła | ✅ |
| Ustawienia lokalne | ✅ |
| Wyniki / archiwum | ✅ |
| Panel organizatora (CRUD event, zgłoszenia) | ✅ |
| Panel admina | ✅ |
| Zostań organizatorem | ✅ |
| Regulamin / prywatność | ✅ |
| Galeria | odłożona (jak na webie) |
| Mapa/kalendarz 1:1 jak web | skrócone — lokalizacja → Apple Maps (iOS) |

---

## Testy

```bash
# unit
npm --prefix mobile test

# E2E (root repo) — wymaga Expo web
cd mobile && npx expo start --web --port 8082   # osobny terminal
npx playwright test tests/e2e/mobile.spec.ts
```
