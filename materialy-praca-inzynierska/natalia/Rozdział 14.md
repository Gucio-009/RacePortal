## 14.1 Strategia testowania

Strategia testowania w projekcie **RacePortal** została zaimplementowana w oparciu o model piramidy testów, gwarantujący kompleksową weryfikację poprawności działania platformy na każdym etapie jej warstwowej architektury. Podejście to łączy:

* **Testy jednostkowe (Unit):** weryfikujące poprawność strukturalną wspólnych typów (packages/api-types) oraz logiki klienckiej aplikacji mobilnej.
* **Testy integracyjne backendu:** testujące poprawne funkcjonowanie serwera Spring Boot, logiki biznesowej oraz relacyjnej bazy danych MySQL przy użyciu JUnit i MockMvc.
* **Testy End-to-End (E2E):** zautomatyzowane scenariusze interfejsu webowego oraz podglądu mobilnego realizowane za pomocą frameworka Playwright.
* **Testy wydajnościowe (Load Testing):** pomiary przepustowości i odporności systemu na obciążenie ruchami żądań (RPS) wykonane za pomocą narzędzia Grafana k6 w docelowym środowisku chmurowym.

## 14.2 Środowisko testowe

Środowisko testowe i demonstracyjne opiera się na konteneryzacji **Docker Compose**, grupującej serwer WWW (nginx), backend API (Spring Boot) oraz bazę danych MySQL 8.4. Do testów wydajnościowych wykorzystano bezpośrednio maszynę produkcyjną Oracle Always Free (VM.Standard.A1.Flex, Frankfurt: 2 OCPU, 11 GiB RAM + 2 GiB swap), uruchamiając narzędzie k6 lokalnie na węźle w celu oszacowania wydajności tzw. *originu* przed tunelem Cloudflare.

## 14.3 Testy jednostkowe

Testy jednostkowe skupiają się na weryfikacji niezmienników i kontraktów danych. Wykorzystując bibliotekę Vitest, przetestowano strukturę pakietu `packages/api-types` oraz kluczowe komponenty frontendu i mobilki, co pozwala na wykrywanie niespójności typów już na etapie integracji kodu.

## 14.4 Testy integracyjne backendu

Weryfikację warstwy biznesowej opartej o Spring Boot przeprowadzono przy użyciu **JUnit** oraz **MockMvc**. Scenariusze te pokrywają:

* Procedury uwierzytelniania klienckiego, mechanizmy tokenów JWT oraz ochronę przed atakami typu brute-force (Rate Limiter).
* Operacje CRUD na zasobach wydarzeń motorsportowych.
* Integralność relacji w wirtualnym garażu użytkowników oraz mechanizm dopasowania kategorii (*carMatch*).
* Poprawność obiegu dokumentów w systemie zgłoszeń i generowanie powiadomień e-mail.
* Egzekwowanie polityki kontroli dostępu opartej o role (RBAC) dla ról USER, ORGANIZER oraz ADMIN.

## 14.5 Testy End-to-End aplikacji webowej

Automatyzacja testów interfejsu webowego realizowana jest za pomocą frameworka **Playwright**. Skrypty te symulują ścieżki użytkownika (zarówno w widokach stacjonarnych, jak i mobilnych viewportach), weryfikując poprawność ładowania strony głównej, działanie filtrów katalogu, moduł autoryzacji, zarządzanie pojazdami w garażu oraz poprawność restrykcji dostępu do paneli ról.

Poniższy fragment prezentuje autentyczną funkcję pomocniczą logowania oraz test `TC-WEB-07` weryfikujący wejście kierowcy na dashboard po autoryzacji.

```
async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByPlaceholder("twoj@email.com").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 20000 }),
    page.locator('main button[type="submit"]').click(),
  ]);
}

test.describe("Web — auth i panel kierowcy", () => {
  test("TC-WEB-07: logowanie kierowcy i wejście na dashboard", async ({ page }) => {
    await loginAs(page, "test@wp.pl", "test123");
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("main").getByText(/test|KIEROWCA|dashboard|profil|garaż/i).first()).toBeVisible();
  });
});
```

## 14.6 Testy aplikacji mobilnej

Testy aplikacji mobilnej opartej o ekosystem Expo obejmują weryfikację adresów URL API oraz scenariusze E2E w trybie podglądu webowego. Testowane są m.in. poprawność pobierania listy wydarzeń z API, przełączanie widoków (*Lista / Kalendarz / Mapa*) oraz działanie mechanizmu przekierowania do pełnej wersji webowej (*CTA*).

## 14.7 Testy mechanizmów bezpieczeństwa

W ramach weryfikacji odporności systemu przetestowano:

* Odporność endpointów administracyjnych na próbę nieautoryzowanego dostępu przez użytkowników z pozycją zwykłego kierowcy (USER).
* Prawidłowość walidacji DTO po stronie backendu, zabezpieczającą aplikację przed niepoprawnym formatem danych wejściowych.

## 14.8 Automatyzacja uruchamiania testów

Wszystkie testy automatyczne są spięte w skrypty npm umieszczone w katalogu `scripts/` oraz zintegrowane z potokami ciągłej integracji (CI/CD) w GitHub Actions.

## 14.9 Analiza wyników testów i testy wydajnościowe k6

Werdykty z testów funkcjonalnych i jednostkowych są stale monitorowane w procesie *Pull Requestów*. Uzupełnieniem weryfikacji jakościowej były testy przepustowości przeprowadzone **25 października 2026 r.** przy użyciu narzędzia **Grafana k6** bezpośrednio na produkcyjnej maszynie wirtualnej Oracle Cloud.

Celem testu było oszacowanie maksymalnej przepustowości (RPS) stacku technologicznego w warunkach lokalnych (unikając narzutu publicznej bramki Cloudflare na czas pomiaru origin). Metodyka objęła testy typu *ramping arrival-rate* oraz *constant arrival-rate* trwające po 30 sekund dla kluczowych zasobów:

* **API lekkie (`GET /api/health`):** osiągnęło stabilny komfort obsługi na poziomie do **~2000 RPS** (latencja p95 ~116 ms), osiągając bezwzględny sufit wydajnościowy rzędu **2200–2260 RPS**.
* **Warstwa prezentacji (`GET /` przez nginx na porcie `:8081`):** statyczny serwer nginx obsłużył bezbłędnie **~2000 RPS** przy latencji p95 wynoszącej zaledwie 23 ms, a sufit wydajnościowy osiągnął ok. **3250 RPS**.
* **API z bazą danych (`GET /api/events?page=0&size=10`):** zapytania generujące obciążenie relacyjnej bazy MySQL wykazały próg pełnego komfortu operacyjnego na poziomie **150–200 RPS** (latencja p95 w granicach 4–22 ms). Przy próbie forsowania powyżej 300 RPS system wchodzi w stan saturacji i degradacji ze względu na współdzielone zasoby 2 OCPU maszyny.

Wnioskiem z przeprowadzonych testów obciążeniowych jest fakt, że wąskim gardłem produkcyjnym platformy są zapytania angażujące bazę danych (~200 RPS komfortu), co w warunkach typowego ruchu akademickiego i demonstracyjnego (dziesiątki współbieżnych użytkowników) zapewnia wielokrotny zapas bezpieczeństwa.

## 14.10 Ograniczenia procesu testowania

W obecnej wersji MVP proces testowania posiada świadome ograniczenia:

* Brak natywnych testów mobilnych (np. *Detox* lub *Maestro*).
* Przeprowadzone testy wydajnościowe k6 skupiły się na zasobach odczytowych i stanach stabilnych maszyny wirtualnej, a ze względu na architekturę współdzielonych 2 OCPU nie były replikowane w pełnym scenariuszu 10 000 rekordów przy sztywnym progu 50 RPS jako zautomatyzowanym wymogu odbiorczym.
