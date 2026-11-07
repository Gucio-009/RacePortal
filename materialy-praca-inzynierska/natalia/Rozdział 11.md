## 11.1 Struktura aplikacji webowej

Warstwa klientowska systemu RacePortal została zaimplementowana jako zaawansowana aplikacja jednostronicowa (SPA) oparta o bibliotekę **React 18** oraz język **TypeScript**, wykorzystująca bundler **Vite** oraz stylowanie za pomocą **Tailwind CSS** i komponentów Radix UI. Architektura katalogów w module web/src/app została zorganizowana modularnie, co zapewnia czytelność i łatwość utrzymania kodu:

* pages/ – komponenty widoków ekranowych reprezentujące poszczególne podstrony aplikacji.
* components/ – reużywalne elementy interfejsu (formularze, karty, modale, elementy nawigacyjne).
* context/ – zarządzanie stanem globalnym, w tym główny kontekst autoryzacji (AuthContext) kontrolujący sesję użytkownika.
* lib/ – warstwa logiki sieciowej (api.ts), typowania oraz konwersji danych zgodna ze wspólnym pakietem typów API.

Poniższy kod realizuje dynamiczne routowanie aplikacji przy użyciu createBrowserRouter z React Router v7, definiując układ bazowy (RootLayout) oraz chronione trasy dostępu dla poszczególnych ról systemowych.

```
export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "login", Component: LoginPage },
      { path: "wydarzenia", Component: EventsPage },
      { path: "wydarzenia/:id", Component: EventDetailPage },
      { path: "dashboard", Component: ProtectedDashboard },
      { path: "garaz", Component: ProtectedGarage },
      { path: "organizer", Component: ProtectedOrganizer },
      { path: "admin", Component: ProtectedAdmin },
    ],
  },
]);
```

## 11.2 Strona główna i katalog wydarzeń

Strona główna integruje główny katalog wydarzeń motorsportowych, oferując użytkownikom trzy spójne widoki z zachowaniem tych samych filtrów: **listę chronologiczną**, **interaktywną mapę** oraz **kalendarz**.

* W widoku listy zaimplementowano optymalizację w postaci mechanizmu *debounce* dla filtrów, co zapobiega wysyłaniu nadmiarowych zapytań HTTP do backendu podczas wpisywania fraz wyszukiwania.
* Użytkownik ma do dyspozycji funkcję „Wyczyść filtry” oraz paginację listy zsynchronizowaną z markerami przeglądowymi na mapie.

## 11.3 Widok szczegółów wydarzenia

Podstrona szczegółów dostarcza użytkownikowi pełnych informacji o wybranej imprezie motorsportowej:

* Wyświetla dokładny opis, dane organizatora oraz rygorystyczne wymagania techniczne stawiane pojazdom i uczestnikom.
* Integruje moduł szybkiego zapisu na wydarzenie, który weryfikuje posiadane przez kierowcę auta w garażu pod kątem reguł dopasowania kategorii (*carMatch*).
* Zawiera mapę z wyznaczaniem trasy dojazdu do lokalizacji obiektu z wykorzystaniem routingu OSRM.

## 11.4 Logowanie i rejestracja

Moduł autoryzacji opiera się na kontrolowanych formularzach frontendowych, wspierających procesy logowania, rejestracji oraz odzyskiwania zapomnianego hasła. Bezpieczeństwo sesji gwarantują ciasteczka typu httpOnly (rp_at, rp_rt) przesyłane z flagą credentials: "include", co całkowicie eliminuje podatności związane z przechowywaniem tokenów JWT w lokalnej pamięci przeglądarki (localStorage).

Poniższy kod implementuje asynchroniczne pobieranie danych o zalogowanym użytkowniku przy użyciu mechanizmu optymalizacyjnego `deferUntilIdle`, dbając o to, by zapytanie nie blokowało renderowania głównego wątku aplikacji.

```
useEffect(() => {
  clearLegacyToken();
  return deferUntilIdle(() => {
    void (async () => {
      try {
        const me = await api.get<User>("/api/auth/me");
        persistAuth(me);
      } catch {
        persistAuth(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, 2000);
}, []);
```

## 11.5 Dashboard użytkownika

Panel użytkownika (Dashboard) stanowi centralne miejsce zarządzania aktywnością zalogowanego kierowcy w systemie. Prezentuje on przejrzyste podsumowanie aktualnych zgłoszeń użytkownika na nadchodzące wydarzenia motorsportowe, umożliwiając błyskawiczny podgląd ich statusów (oczekujące, zatwierdzone, anulowane) oraz dostęp do szczegółów rezerwacji.

## 11.6 Widok garażu

Moduł wirtualnego garażu pozwala kierowcom na pełne zarządzanie flotą własnych pojazdów startowych.

* Interfejs dostarcza formularz dodawania nowego pojazdu z rygorystyczną walidacją pól wymaganych (takich jak marka, model, specyfikacja techniczna, masa czy dopasowanie opon).
* Użytkownik ma możliwość edycji danych oraz usuwania aut ze swojego profilu, przy czym system uwzględnia zabezpieczenia biznesowe (np. blokadę usunięcia pojazdu, który został powiązany z aktywnym, zatwierdzonym zgłoszeniem na zawody).

## 11.7 Panel organizatora

Panel organizatora udostępnia dedykowane narzędzia dla podmiotów publikujących imprezy motorsportowe. Umożliwia on:

* Tworzenie oraz edycję wydarzeń w jednym spójnym formularzu z wykorzystaniem wbudowanych presetów torów.
* Podgląd napływających zgłoszeń od kierowców oraz zarządzanie ich statusami (np. akceptacja uczestnictwa, odrzucenie lub zmiana statusu płatności).

## 11.8 Panel administratora

Panel administratora zapewnia operatorom platformy narzędzia najwyższego poziomu do nadzoru nad treścią oraz strukturą uprawnień w systemie. Obejmuje on:

* Moderację nadesłanych wydarzeń oraz rozpatrywanie wniosków użytkowników ubiegających się o uzyskanie uprawnień organizatora (dedykowana ścieżka formularza pod adresem /zostan-organizatorem).
* Zarządzanie globalnymi rolami kont oraz podgląd systemowych zgłoszeń błędów.

## 11.9 Mapa i elementy lokalizacyjne

Warstwa mapowa opiera się na integracji biblioteki Leaflet z kafelkami CARTO / OpenStreetMap. Umożliwia ona interaktywną prezentację punktów zainteresowania, selekcję współrzędnych geograficznych w formularzach wydarzeń oraz płatną lub opartą o OSRM integrację routingu trasy dojazdu dla kierowców.

## 11.10 Responsywność i doświadczenie użytkownika

Interfejs aplikacji zaprojektowano w koncepcji *mobile-first*. Układy siatek (grid, flexbox) w Tailwind CSS dynamicznie dostosowują się do ekranów smartfonów, tabletów oraz monitorów stacjonarnych. Spójność wizualną oparto o ciemny motyw motorsportowy z wyrazistym akcentem --race-accent, optymalizując czytelność danych i zapewniając wysoką użyteczność (UX).
