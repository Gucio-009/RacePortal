# Pomysły technologiczne (alternatywy) — RacePortal

**Cel dokumentu:** zebrać notki `Pomysł (alt): …` z kodu i rozmów — co jest użyte dziś vs co można rozważyć później (dyplom / rozwój).  
**Stan stacku (obecny):** Spring Boot 3 + MySQL + JWT · Vite/React + Tailwind v4 · Expo/RN · Docker Compose · Vitest/JUnit/Playwright.

---

## 1. Backend / API

| Dziś | Pomysł (alt) | Po co |
|------|--------------|-------|
| Własny JWT (`JwtService`) | Keycloak / Auth0 / Supabase Auth | SSO, odświeżanie tokenów, mniej kodu security |
| MySQL 8.4 | PostgreSQL (+ opcjonalnie PostGIS) | bogatsze typy geo, standard wielu SaaS |
| Hibernate `ddl-auto: update` | Flyway / Liquibase | migracje wersjonowane, bezpieczny prod |
| Caffeine (in-process) | Redis | cache współdzielony przy wielu replikach API |
| JPA Specification filtry | Elasticsearch / OpenSearch | pełnotekstowe wyszukiwanie wydarzeń |
| Ręczny mapowanie DTO | MapStruct | mniej boilerplate, mniej błędów mapowania |
| Google idToken weryfikacja w API | Pełny OAuth2 Authorization Code + PKCE | bezpieczniejszy flow web/mobile |
| JavaMail + Mailpit | SendGrid / SES / Resend | dostarczalność w produkcji |
| Publiczny OSRM | własny OSRM / Google Directions / Mapbox | SLA i limity zapytań |
| Monolit Spring | osobny serwis powiadomień / worker | kolejki maili, archiwizacja |

## 2. Front web

| Dziś | Pomysł (alt) | Po co |
|------|--------------|-------|
| Vite SPA + nginx | Next.js / Remix | SSR, SEO listy wydarzeń |
| React Router data APIs | TanStack Router | typowane trasy |
| fetch + AuthContext | TanStack Query + Zustand | cache HTTP, mniej prop-drilling |
| Tailwind v4 + shadcn/Radix | MUI / własny Design System | spójność enterprise / white-label |
| Oxanium + Montserrat (Google Fonts) | self-host `@fontsource` | mniej zależności od CDN, CSP prostsze |
| Leaflet + OSM/Carto | Mapbox GL / Google Maps JS | stylizowane mapy, wsparcie |
| localStorage ustawień UI | konto-backed preferences API | sync między urządzeniami |
| nginx reverse proxy | Caddy / Traefik + TLS | automatyczne certyfikaty |

## 3. Mobile

| Dziś | Pomysł (alt) | Po co |
|------|--------------|-------|
| Expo (RN) | Flutter / Kotlin+Swift natywnie | wydajność / sklepowe UX |
| Expo SecureStore + localStorage (web) | react-native-keychain wszędzie | jednolity model sekretów |
| Współdzielone `@raceportal/api-types` | wygenerowane OpenAPI client | kontrakt 1:1 z backendem |
| Expo web preview E2E | Detox / Maestro na device | prawdziwe gesty natywne |

## 4. Dane, DevOps, jakość

| Dziś | Pomysł (alt) | Po co |
|------|--------------|-------|
| Docker Compose | Kubernetes / Nomad | skalowanie, health, secrets |
| Seed w `DataInitializer` | osobne fixtures + factory | czystsze środowiska |
| `raceportal_test` + create-drop | Testcontainers reuse + migracje | szybsze CI |
| Playwright E2E | + k6 / Gatling load | P95, 10k rekordów (luka MVP) |
| Backup cron w compose | managed backup (RDS snapshot) | restore udokumentowany formalnie |
| Monorepo npm workspaces | Turborepo / Nx | cache buildów |

## 5. Domenowa logika (ważne z testów)

- **Dopasowanie kategorii auta (`carMatch` / `CategoryMatcher`):** string-matching + aliasy.  
  **Alt:** kanoniczne ID kategorii w DB + relacja many-to-many z klasami pojazdu.
- **Normalizacja PL:** specjalna obsługa `ł` (nie rozkłada się NFD).  
  **Alt:** ICU transliterator / biblioteka `unidecode`.
- **Aliasy exact-first:** żeby `racing` nie wpadało w `gt racing`.  
  **Alt:** enum + słownik synonimów w tabeli SQL.

---

## 6. Gdzie szukać komentarzy w kodzie

Komentarze PL + lokalne `Pomysł (alt)` są w:

- `backend/src/main/java/pl/raceportal/**` (JavaDoc klas i kluczowych metod)
- `backend/src/main/resources/application*.yml`
- `packages/api-types/src/**`
- `web/src/**` (nagłówki plików; UI shadcn — krótki header)
- `mobile/src/**`, `mobile/App.tsx`, testy
- `scripts/*.sh`, `docker-compose.yml`, `web/nginx.conf`, Dockerfiles, `vite.config.ts`

---

*Ostatnia aktualizacja: 2026-08-06 — wprowadzenie komentarzy PL w całym kodzie źródłowym + ten rejestr alt.*
