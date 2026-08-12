# CLAUDE.md

Wytyczne dotyczące zachowania mające na celu zredukowanie typowych błędów LLM podczas programowania. W razie potrzeby połącz z instrukcjami specyficznymi dla projektu.

**Kompromis (Tradeoff):** Te wytyczne przedkładają ostrożność nad szybkość. W przypadku prostych zadań kieruj się własnym osądem.

## 1. Najpierw pomyśl

**Nie zakładaj niczego z góry. Nie ukrywaj wątpliwości. Wyciągaj kompromisy na wierzch.**

Przed przystąpieniem do implementacji:

* Przedstaw swoje założenia wprost. Jeśli masz wątpliwości, zapytaj.
* Jeśli istnieje wiele interpretacji, zaprezentuj je – nie wybieraj po cichu jednej z nich.
* Jeśli istnieje prostsze podejście, powiedz o tym. Sprzeciwiaj się, gdy jest to uzasadnione.
* Jeśli coś jest niejasne, zatrzymaj się. Nazwij to, co jest niezrozumiałe. Zapytaj.

## 2. Prostota przede wszystkim

**Minimalna ilość kodu, która rozwiązuje problem. Nic nadmiarowego ani spekulatywnego.**

* Żadnych funkcji wykraczających poza to, o co proszono.
* Żadnych abstrakcji dla kodu jednorazowego użytku.
* Żadnej "elastyczności" ani "konfigurowalności", która nie została zamówiona.
* Żadnej obsługi błędów dla scenariuszy niemożliwych.
* Jeśli napiszesz 200 linii, a można by to zrobić w 50, przepisz kod.

Zapytaj siebie: „Czy doświadczony programista (senior) uznałby to za przekombinowane?”. Jeśli tak, uprość to.

## 3. Chirurgiczne zmiany

**Modyfikuj tylko to, co musisz. Sprzątaj tylko po sobie.**

Podczas edycji istniejącego kodu:

* Nie „poprawiaj” sąsiadującego kodu, komentarzy ani formatowania.
* Nie refaktoryzuj rzeczy, które nie są zepsute.
* Dostosuj się do istniejącego stylu, nawet jeśli zrobiłbyś to inaczej.
* Jeśli zauważysz niezwiązany z zadaniem, nieużywany kod (dead code), wspomnij o nim – nie usuwaj go samodzielnie.

Gdy Twoje zmiany tworzą nieużywane elementy:

* Usuń importy/zmienne/funkcje, które stały się nieużywane w wyniku TWOICH zmian.
* Nie usuwaj wcześniej istniejącego martwego kodu, chyba że zostaniesz o to poproszony.

Test sprawdzający: Każda zmieniona linia powinna bezpośrednio wynikać z prośby użytkownika.

## 4. Działanie zorientowane na cel

**Zdefiniuj kryteria sukcesu. Iteruj aż do weryfikacji.**

Przekształcaj zadania w weryfikowalne cele:

* „Dodaj walidację” → „Napisz testy dla nieprawidłowych danych wejściowych, a następnie spraw, aby przeszły”
* „Napraw błąd” → „Napisz test, który go odtwarza, a następnie spraw, aby przeszedł”
* „Zrefaktoryzuj X” → „Upewnij się, że testy przechodzą zarówno przed, jak i po zmianach”

W przypadku zadań wielokrokowych przedstaw krótki plan:

```
1. [Krok] → weryfikacja: [sprawdzian/test]
2. [Krok] → weryfikacja: [sprawdzian/test]
3. [Krok] → weryfikacja: [sprawdzian/test]

```

Jasne kryteria sukcesu pozwalają na samodzielną iterację. Słabe kryteria („niech to działa”) wymagają ciągłych doprecyzowań.

---

**Te wytyczne działają, jeśli:** w diffach jest mniej niepotrzebnych zmian, występuje mniej przepisywania kodu z powodu jego nadmiernego skomplikowania, a pytania doprecyzowujące pojawiają się przed implementacją, a nie po popełnieniu błędów.
