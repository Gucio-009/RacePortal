# RacePortal Mobile (MVP uproszczony)

Aplikacja Expo — logowanie, lista wydarzeń, szczegóły, zapis na start.

## Wymagania

1. Działający backend (`docker compose up` w katalogu głównym projektu)
2. Node.js + [Expo Go](https://expo.dev/go) na telefonie **albo** symulator iOS/Android

## Start

```bash
cd mobile
npm install
npm start
```

Zeskanuj QR w Expo Go albo naciśnij `i` / `a` (symulator).

Podgląd w przeglądarce (używany też w E2E Playwright):

```bash
npx expo start --web --port 8082
```

## API URL

Domyślnie:

- iOS symulator → `http://127.0.0.1:4000`
- Android emulator → `http://10.0.2.2:4000`
- Expo web → `http://127.0.0.1:4000` (token JWT w `localStorage`)

Na **fizycznym telefonie** ustaw IP komputera w sieci lokalnej:

```bash
EXPO_PUBLIC_API_URL=http://192.168.x.x:4000 npm start
```

(API musi nasłuchiwać na `0.0.0.0` / być dostępne z LAN — w Dockerze port `4000` jest wystawiony.)

## Konta demo

| Email | Hasło |
|-------|-------|
| `test@wp.pl` | `test123` |
| `admin@raceportal.pl` | `admin123` |

## Zakres (na teraz)

- logowanie JWT  
- lista nadchodzących wydarzeń  
- szczegóły + zgłoszenie udziału  
- wylogowanie  

Poza MVP mobile (później): garaż, mapa, panel admina/organizatora, push.

## Testy automatyczne

| Zestaw | Narzędzie | Plik | Ostatni wynik |
|--------|-----------|------|----------------|
| Unit | Vitest | `mobile/tests/unit.client.test.ts` | **2 / 2 PASS** |
| E2E (Expo web) | Playwright | `e2e/mobile.spec.ts` (root) | **5 / 5 PASS** (projekt `mobile-expo`) |

```bash
# z katalogu głównego repo (API + Expo web muszą działać)
npm --prefix mobile test
npx playwright test e2e/mobile.spec.ts
```

Pełna dokumentacja: [`docs/TESTY.md`](../docs/TESTY.md) · wyniki: [`docs/wyniki-testow/podsumowanie.md`](../docs/wyniki-testow/podsumowanie.md)
