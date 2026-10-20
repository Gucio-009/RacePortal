# RacePortal — czego może brakować / fajne pomysły

**Cel:** luźna, produktowa lista luk i kierunków rozwoju (nie backlog sprintu).  
**Stan produktu (dziś):** web = pełny klient (auth, eventy, garaż, zgłoszenia, org/admin); mobile = **wizytówka** (katalog + CTA na web); API Spring + MySQL.

Nie dubluje:

| Plik | Co tam |
|------|--------|
| [`spec-conformity.md`](./spec-conformity.md) | Luki vs Specyfikacja Formularzy (pola, upload, walidacje) |
| [`MVP.md`](./MVP.md) §5 | Luki formalne odbioru (perf 10k/50RPS, HTTPS, restore) |
| [`pomysly-technologiczne.md`](./pomysly-technologiczne.md) | Alternatywy stacku (Keycloak, Next, Redis…) |

---

## 1. Świadomie „cienkie” miejsca (dziś OK, ale widać dziurę)

| Obszar | Co jest | Czego może brakować |
|--------|---------|---------------------|
| **Mobile** | Katalog Eventów + „Zapisz się na stronie” | Powiadomienia push o starcie / zmianie statusu; ulubione eventy offline; deep-link z powrotem do appki po zapisie na webie |
| **Płatności** | Statusy zgłoszenia + dowód (URL) | Prawdziwy checkout (Przelewy24 / Stripe); faktury; zwroty |
| **Galeria** | Świadomie odłożona | Albumy po evencie, upload organizatora, tagi aut/kierowców |
| **Social** | Google opcjonalnie | Facebook / Apple; udostępnianie eventu (OG + share sheet) |
| **Mapa / trasa** | Leaflet + OSRM | „Wydarzenia w pobliżu mnie”; zapisane torowiska; live weather na torze |
| **Wyszukiwanie** | Filtry + `q` | Autocomplete, zapisane wyszukiwania, „podobne eventy” |
| **Role** | USER / ORGANIZER / ADMIN | Współorganizatorzy, sędziowie, media-pass |
| **Treści** | Opisy eventów | Regulamin startu per event (PDF), checklista kierowcy, FAQ organizatora |

---

## 2. Pomysły produktowe (wysoki „wow” przy rozsądnym koszcie)

### A. Dla kierowcy
1. **Watchlist / „Obserwuj wydarzenie”** — mail lub push gdy zmieni się status, zostały wolne miejsca, zmiana daty.  
2. **Kalendarz iCal** — „Dodaj do Kalendarza” (`.ics`) z detalu eventu (web + mobile CTA).  
3. **Porównanie aut z wymagań** — wizualny checklista: OC / klatka / klasa vs wymagania eventu (dziś `carMatch` jest tekstowy).  
4. **Historia startów + statystyki** — ile startów w sezonie, kategorie, mapa odwiedzonych torów.  
5. **Kod QR zgłoszenia** — na bramce / odprawie (status APPROVED → QR).

### B. Dla organizatora
1. **Lista startowa / export CSV/PDF** — jeden klik z panelu zgłoszeń.  
2. **Szablony wydarzeń** — „Track Day Poznań” jako preset (data + lokalizacja + wymagania).  
3. **Limit miejsc + waitlista** — automatyczne przesunięcie z listy rezerwowej.  
4. **Komunikat do zapisanych** — broadcast mail (dziś maile są transactional).  
5. **Dashboard frekwencji** — ile APPROVED / PENDING / płatnych vs darmowych.

### C. Dla platformy / admina
1. **Moderacja treści** — report eventu / użytkownika.  
2. **Featured events** na home (nie tylko chronologicznie).  
3. **Partnerzy / sponsoring** — sloty logo na evencie (nawet proste URL + kolejność).  
4. **Publiczne API read-only** + klucz dla aggregatorów motorsportu.

### D. Mobile (kolejne kroki po wizytówce)
1. **Widget „najbliższy start”** (iOS/Android) — bez pełnej parity.  
2. **Skan QR** do szybkiego otwarcia eventu / check-inu (org).  
3. **Tryb „tylko mapa”** fullscreen z filtrami (dziś mapa jest w tym samym ekranie co lista).

---

## 3. UX / jakość, które szybko poprawiają odbiór

| Pomysł | Dlaczego |
|--------|----------|
| Onboarding 3 ekrany na web (gość → po co konto → garaż) | Mniej „pustego” dashboardu dla nowego USER |
| Empty states z CTA (brak aut → „Dodaj auto”) | Już częściowo jest — warto ujednolicić ton |
| Skeleton loadery zamiast spinnera na listach | Wrażenie szybkości |
| Dark/light + kontrast WCAG na złotym akcencie | Dostępność / recenzja |
| Język EN (i18n) choćby Eventów publicznych | SEO / zagraniczni kierowcy |
| PWA „Dodaj do ekranu głównego” dla weba | Zamiast store w krótkim terminie |

---

## 4. Dane i „prawdziwość” katalogu

- **Więcej seedów torów PL** (Tor Poznań, Kielce, Bednary…) ze stałymi GPS — mapa wygląda „żywo”.  
- **Import kalendarzy** (CSV / iCal organizerów zewnętrznych) — mniej ręcznego przepisywania.  
- **Weryfikacja lokalizacji** — geocode przy zapisie eventu (mniej literówek w mieście/woj.).  
- **Deduplikacja eventów** (ten sam tor + data + nazwa).

---

## 5. Bezpieczeństwo / zaufanie (produktowo)

| Temat | Idea |
|-------|------|
| Płatności | Nie trzymać „dowodu URL” jako jedynej prawdy — status z bramki |
| Konta | 2FA opcjonalne dla ORGANIZER/ADMIN |
| Dane osobowe | Eksport / usunięcie konta (RODO „prawo do bycia zapomnianym”) w UI, nie tylko polityka |
| Org. | Weryfikacja NIP / KRS przy wniosku (nawet ręczny check admina + checkbox) |

---

## 6. Dyplom / demo — co robi wrażenie w 1 godzinie

Kolejność „najwięcej efektu / najmniej ryzyka”:

1. Upload zdjęć (garaż + plakat) **albo** uczciwa zmiana Spec → URL (patrz `spec-conformity.md`).  
2. Wymagane imię/nazwisko/telefon + twarde hasło na API.  
3. `.ics` + share link eventu.  
4. Export listy startowej CSV dla organizatora.  
5. Watchlist + mail „zmiana statusu wydarzenia”.  
6. Test obciążenia 10k / P95 (domknięcie luk MVP jakości).

---

## 7. Czego **nie** gonić na siłę (na teraz)

- Pełna parity mobile = web (świadomie porzucona na rzecz wizytówki).  
- Własny silnik płatności bez PSP.  
- Native store release bez EAS / konta deweloperskiego.  
- Mikroserwisy / K8s przy jednym Compose.

---

## 8. Jak używać tego pliku

- **Decyzja produktowa:** wybierz 1–2 pozycje z §2 lub §6 i dopisz do `changes.md` po wdrożeniu.  
- **Zgodność ze Spec:** najpierw `spec-conformity.md` (P0), potem fajerwerki.  
- **Tech rewrite:** tylko `pomysly-technologiczne.md`.

---

*Utworzono: 2026-09-28 — rejestr luk produktowych i pomysłów po etapie mobilki-wizytówki.*
