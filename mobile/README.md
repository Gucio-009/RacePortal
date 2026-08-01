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

## API URL

Domyślnie:

- iOS symulator → `http://127.0.0.1:4000`
- Android emulator → `http://10.0.2.2:4000`

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
