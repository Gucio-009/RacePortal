# 🏁 RacePortal
**Centralny katalog wydarzeń motorsportowych w Polsce**

RacePortal to aplikacja webowa, której celem jest zebranie w jednym miejscu aktualnych wydarzeń motorsportowych w Polsce. Projekt eliminuje problem rozproszenia informacji pomiędzy grupami Facebookowymi, stronami torów i pojedynczymi witrynami organizatorów.

---

## 🚗 Funkcjonalności (MVP)

- Przejrzysty **katalog wydarzeń**: widok listy oraz kalendarza.
- **Filtrowanie** po: kategorii, torze, województwie, słowach kluczowych.
- **Szczegóły wydarzenia**: data, opis, lokalizacja, organizator, linki zewnętrzne.
- **Panel administratora**: pełne CRUD dla eventów i moderacja treści.
- **Konta organizatorów** z możliwością dodawania i edycji własnych wydarzeń.
- Ręczny/semi-automatyczny **import danych** przez formularze.

### Funkcje planowane (poza MVP)
- Integracja z Google Maps (pełna wizualizacja lokalizacji).
- System zgłoszeń zawodników do organizatorów.
- Profile zawodników i ich pojazdów.
- Automatyczne scrapowanie danych z zewnętrznych źródeł.
- Powiadomienia mailowe i webhooki.

---

## 🧱 Architektura systemu
```
React (Frontend) → Spring Boot REST API → PostgreSQL
```

### Technologie
- **Frontend:** React.js, TailwindCSS / SCSS
- **Backend:** Spring Boot (REST, Security, JWT)
- **Baza danych:** PostgreSQL
- **Konteneryzacja:** Docker
- **Integracje:** Google Maps, zewnętrzne linki do wydarzeń
- **Narzędzia:** Maven, GitHub, Jira

---

## 🔐 Bezpieczeństwo
- JWT + RBAC (ADMIN, ORGANIZER).
- Zgodność z **OWASP ASVS Level 1**.
- Walidacja danych + rate limiting.
- Wymuszone HTTPS, zabezpieczenia nagłówków (CSP, HSTS itd.).

---

## ⚡ Wydajność
- Paginacja + indeksowanie zapytań.
- API ≤ **500–700 ms P95** dla listy do 50 rekordów.
- Skalowanie testowane przy **10 000 rekordów** i 50 RPS.

---

## 📦 Wymagania niefunkcjonalne
- Codzienne backupy bazy.
- Monitoring i alertowanie.
- Pełna przenośność środowiska dzięki Dockerowi.
- Responsywne UI (mobile-first).

---

## 🧩 Kategorie użytkowników
- **Anonimowi** – przeglądanie wydarzeń.
- **Organizatorzy** – dodawanie i edycja własnych eventów (po weryfikacji).
- **Administratorzy** – zarządzanie całą treścią.

---

## 👥 Zespół projektowy
**Kierownik projektu:**
- Wojciech Wronisz

**Frontend:** Natalia Otrombke, Oliwier Kasprowicz
**Backend:** Michał Gutowski, Miłosz Parkitny
**Fullstack + Marketing:** Wojciech Wronisz
**Opiekun projektu:** Marta Łabuda

---

## 📄 Dokumentacja
Pełen *Dokument Założeń Wstępnych* znajduje się w repozytorium:
`02_DZW-GrA(Kasprowicz, Gutowski, Otrombke, Parkitny, Wronisz)_v1.1.pdf
