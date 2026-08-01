# RacePortal Backend (Spring Boot)

REST API zgodne z kontraktem `/api/*` używanym przez `web/` i `mobile/`.

## Stack (dyplom)

- Java **21** + Spring Boot **3.3** (Web, Security, Data JPA, Validation, Mail)
- MySQL **8**
- JWT (JJWT)
- Maven
- Testcontainers (integracja MockMvc)

## Uruchomienie

Razem ze stackiem:

```bash
docker compose up --build -d
```

API: http://127.0.0.1:4000/api/health

## Testy

```bash
# z katalogu repo (Java 21 lokalnie LUB fallback Docker Maven + Compose MySQL)
npm run test:api
# albo:
cd backend && ./mvnw test
```

## Seed

| Rola | Email | Hasło |
|------|-------|-------|
| ADMIN | admin@raceportal.pl | admin123 |
| ORGANIZER | org@raceportal.pl | org123 |
| USER | test@wp.pl | test123 |

Model JPA jest uproszczony względem pełnego ERD z dokumentacji (osobne `categories` / `locations` / `roles`), ale zachowuje ten sam JSON API dla frontendu.
