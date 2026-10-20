# Specyfikacja Formularzy — zgodność z kodem

Źródło: `Dokumentacja/Dokumenty/Specyfikacja Formularzy.docx`  
Porównanie z kodem (web / mobile / API): **2026-09-14 ~18:50**.

Ten plik **nie naprawia** luk — tylko je rejestruje, żeby decyzja (naprawiać / świadomie odłożyć) była jasna.

Legenda: **OK** · **Minor** · **Major** · **Blocker**

---

## 1. Rejestracja / profil kierowcy

| Pole (spec) | Spec | Stan w kodzie | Severity |
|-------------|------|---------------|----------|
| E-mail | WYMAGANE, unikalne | OK (UI + backend) | OK |
| Hasło | 8+, wielka, cyfra, specjalny | UI egzekwuje; backend `@Size(min=6)` — da się ominąć klienta | Major |
| Imię | WYMAGANE, 2–50, tylko litery | Pole opcjonalne; brak reguły „tylko litery” | Blocker |
| Nazwisko | WYMAGANE, 2–50, tylko litery | Jak imię | Blocker |
| Telefon | WYMAGANE, format, unikalny | Unikalność OK gdy podany; **nie wymagany**; brak walidacji formatu | Blocker |
| Adres | OPCJONALNE | Jest (web+mobile+API) | OK |
| Prawo jazdy B | OPCJONALNE switch | Jest, niezależny od PZM | OK |
| Licencja PZM | OPCJONALNE, niezależne | Osobny switch + numer | OK |
| Instagram | OPCJONALNE URL | Jest; brak twardej walidacji URL po stronie API | Minor |

## 2. Organizator

| Pole (spec) | Spec | Stan w kodzie | Severity |
|-------------|------|---------------|----------|
| Pełna rejestracja org. (email/hasło/telefon) | Osobny formularz rejestracji | Produktowo: wniosek zalogowanego USER (`/zostan-organizatorem`); API `register-organizer` bez UI | Major |
| Typ działalności | WYMAGANE dropdown | Jest (web select + mobile chips + API) | OK |
| Linki zewnętrzne | OPCJONALNE | Brak | Major |
| Grafika / avatar | OPCJONALNE file upload | Brak uploadu | Major |
| Opis / biogram | OPCJONALNE | Częściowo jako `message` wniosku | Minor |

## 3. Garaż (Dodawanie pojazdu V3)

| Pole (spec) | Spec | Stan w kodzie | Severity |
|-------------|------|---------------|----------|
| Marka / model | WYMAGANE, słownik marek | Wymagane free-text; **brak** autocomplete/słownika | Major |
| Rok | 1900–bieżący | Web OK; backend 1886–2100; mobile bez twardej walidacji create | Major (mobile) |
| Napęd | FWD / RWD / AWD/**4WD** | Tylko FWD/RWD/AWD (brak 4WD) | Major |
| KM / cm³ / kg | WYMAGANE (0 cm³ = EV) | Web+API create; mobile create nadal luźniejsze | Major (mobile) |
| Zarejestrowane → ukryj tablica/typ/KSS | WARUNKOWE | Web: ukrywa typ/KSS, **tablica nadal widoczna**; mobile: KSS przy każdym „zarejestrowane” | Minor–Major |
| Typ rejestracji | standardowe / sportowe | `cywilne` / `sportowe` (nazwy inne niż w spec, sens OK) | Minor |
| Klatka / OC / PT | WYMAGANE switch | Web+API; mobile toggle bez osobnej walidacji UX | OK / Minor |
| Zdjęcia | **File upload** min. 1, ≤5 MB | **URL** wymagany (web/API); mobile **bez** pola zdjęcia | Blocker |
| Social / video / mods | OPCJONALNE | Web OK; mobile tylko mods | Minor |

## 4. Formularz wydarzenia (organizator)

| Pole (spec) | Spec | Stan w kodzie | Severity |
|-------------|------|---------------|----------|
| Plakat | WYMAGANE file upload | Preset / URL, nie upload pliku | Major |
| Data/godzina końca | WYMAGANE | Opcjonalne | Major |
| Ulica | OPCJONALNE | W DTO, często brak w UI | Minor |
| Wpisowe | WYMAGANE (0 = free) | Switch płatne/darmowe, nie zawsze jawne `0` | Minor |
| Tworzenie eventu na mobile | — | Brak formularza create na mobile | Major |

---

## 5. Co już domknięto (2026-09-14, §42 `changes.md`)

- Clear-on-edit garażu (puste pola czyszczą wartości)
- Walidacja wymaganych pól garażu (web) + czerwone `*`
- PZM niezależny od prawa jazdy B
- Adres + Instagram w profilu
- Unikalny telefon (gdy podany)
- Typ działalności na wniosku organizatora
- „Wyczyść filtry” na web wydarzeniach
- Mobile: akcent motywu + feedback zapisu + safe-area

---

## 6. Propozycja decyzji (do rozważenia)

| Priorytet | Temat | Opcje |
|-----------|-------|--------|
| P0 | Imię / nazwisko / telefon wymagane + format | A) Dostosować UI+API do spec · B) Zmienić spec na „opcjonalne przy rejestracji” |
| P0 | Upload zdjęć (garaż / plakat) | A) Multipart + storage · B) Spec: „URL lub upload w v2” |
| P1 | Hasło min. 8 + reguły na backendzie | Zsynchronizować Bean Validation z UI |
| P1 | 4WD + słownik marek | Dodać do selectów / seed słownika |
| P2 | Pełna rejestracja organizatora wg §2 | Osobny flow vs obecny wniosek USER→ORG |
| P2 | Event: end datetime + plakat upload | Uzupełnić OrganizerEventFormDialog |

**Werdykt na dziś:** funkcjonalnie MVP działa; **pełna zgodność ze Specyfikacją Formularzy — nie**. Największe rozjazdy: wymagalność danych osobowych, upload plików, napęd 4WD, mobile garaż vs API.
