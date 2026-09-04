# CLAUDE.md

# Ten plik

Ten plik zawiera wskazówki dla Claude Code (claude.ai/code) podczas pracy z kodem w tym repozytorium.

Wytyczne behawioralne mające na celu ograniczenie typowych błędów kodowania LLM. W razie potrzeby połącz z instrukcjami specyficznymi dla projektu.

**Kompromis:** Wytyczne te kładą nacisk na ostrożność, a nie na szybkość. W przypadku trywialnych zadań użyj osądu.

## 1. Pomyśl przed kodowaniem

**Nie zakładaj. Nie ukrywaj niejasności. Nie idź na kompromisy powierzchownie (bez ich nazwania).**

Przed wdrożeniem:
- Wyraźnie określ swoje założenia. Jeśli nie masz pewności, zapytaj.
- Jeśli istnieje wiele interpretacji, przedstaw je - nie wybieraj po cichu.
- Jeśli istnieje prostsze podejście, powiedz to. Odpychaj, gdy jest to uzasadnione.
- Jeśli coś jest niejasne, przestań. Podaj nazwę, która jest myląca. Zapytać.

## 2. Prostota na pierwszym miejscu

**Minimalny kod rozwiązujący problem. Nic spekulatywnego.**

- Brak funkcji wykraczających poza to, o co pytano.
- Brak abstrakcji dla kodu jednorazowego użytku.
- Brak „elastyczności” i „konfigurowalności”, o które nie poproszono.
- Brak obsługi błędów w przypadku niemożliwych scenariuszy.
- Jeśli napiszesz 200 wierszy, a może być ich 50, przepisz je.
- Pisz kod zgodnie z dobrymi praktykami React
- Pisz kod na poziomie react senior developer
- Pisz kod zwracając uwagę na performance
- Pisz kod zwarcając uwagę na bezpieczeństwo

Zadaj sobie pytanie: „Czy starszy inżynier powiedziałby, że to zbyt skomplikowane?” Jeśli tak, uprość.

## 3. Zmiany chirurgiczne

**Dotknij tylko tego, co musisz. Posprzątaj tylko swój własny bałagan.**

Podczas edycji istniejącego kodu:
- Nie „ulepszaj” sąsiedniego kodu, komentarzy ani formatowania.
- Nie refaktoryzuj rzeczy, które nie są zepsute.
- Dopasuj istniejący styl, nawet jeśli zrobiłbyś to inaczej.
- Jeśli zauważysz niepowiązany martwy kod, wspomnij o nim - nie usuwaj go.

Kiedy Twoje zmiany tworzą sieroty:
- Usuń importy/zmienne/funkcje, które TWOJE zmiany uczyniły nieużywanymi.
- Nie usuwaj istniejącego wcześniej martwego kodu, chyba że zostaniesz o to poproszony.

Test: Każda zmieniona linia powinna być bezpośrednio powiązana z żądaniem użytkownika.

## 4. Realizacja oparta na celu

**Zdefiniuj kryteria sukcesu. Pętla do momentu weryfikacji.**

Przekształć zadania w weryfikowalne cele:
- „Dodaj walidację" → „Napisz testy na nieprawidłowe dane wejściowe, a następnie spraw, aby przeszły"
- „Napraw błąd" → „Napisz test, który go odtwarza, a następnie spraw, aby przeszedł"
- „Refaktoryzacja X” → „Upewnij się, że testy przejdą pomyślnie przed i po”

W przypadku zadań wieloetapowych należy podać krótki plan:
```
1. [Krok] → sprawdź: [sprawdź]
2. [Krok] → sprawdź: [sprawdź]
3. [Krok] → sprawdź: [sprawdź]
```

Silne kryteria sukcesu pozwalają na samodzielną pętlę. Słabe kryteria („sprawić, żeby to zadziałało") wymagają ciągłego wyjaśniania.

## 5. Pilnuj podziału przy każdej zmianie w komponencie

**Za każdym razem, gdy dotykasz pliku komponentu, sprawdź jego stan — zanim skończysz zadanie.**

Pliki nie puchną przez jedną złą decyzję, tylko przez dwadzieścia dobrych. Każda zmiana z osobna
jest chirurgiczna (patrz punkt 3) i żadna nie jest na tyle duża, żeby uzasadnić podział — a po
miesiącu komponent ma 400 linii i sześć odpowiedzialności. Punkt 3 to opisuje, ten punkt temu
przeciwdziała.

**Kryterium to liczba odpowiedzialności, nie liczba linii.** Plik robiący jedną rzecz może mieć 200
linii i być czytelny. Sygnały, że czas na podział:

- komponent ma więcej niż 3–4 `useState` albo miesza pobieranie danych, układ i obsługę akcji,
- w jednym pliku siedzą ikony, stałe, funkcje czyste i JSX,
- te same dane renderowane są na dwa sposoby (biurko/telefon) obok logiki, która je przygotowuje,
- żeby zrozumieć jedną funkcję, trzeba przewinąć plik w dwie strony.

**Co z tym zrobić — i tu jest napięcie z punktem 3:** nie refaktoryzuj przy okazji, po cichu.
Skończ zadanie, o które poproszono, a podział **zgłoś**: nazwij pliki, które by powstały, i powiedz,
co do których trafi. Użytkownik decyduje, czy robimy to teraz, czy później. Milczenie jest gorsze
niż jedno i drugie — bo za trzy tygodnie koszt podziału jest już trzy razy większy.

**Dobre praktyki, o których warto powiedzieć w tym samym momencie:** duplikacja, która właśnie
powstała; stan trzymany wyżej, niż potrzeba; brakujący `key`; obliczenie w renderze, które powinno
być w `useMemo`; komponent renderowany w pętli bez potrzeby. Jedno zdanie na każdą, bez wykładu.

---

**Te wytyczne działają, jeśli:** mniej niepotrzebnych zmian w różnicach, mniej przeróbek z powodu nadmiernego skomplikowania i pytania wyjaśniające pojawiają się przed wdrożeniem, a nie po błędach.
