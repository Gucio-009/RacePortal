/**
 * Dopasowanie klasy auta (garaż) do kategorii wydarzenia.
 *
 * Używane przy zapisie na event: UI dzieli auta na „rekomendowane” vs „pozostałe”
 * (partitionCarsForEvent), żeby zawodnik łatwiej wybrał auto zgodne z dyscypliną.
 *
 * Logika aliasów:
 * 1) Normalizacja PL — trim, lower-case, zamiana „ł”→„l” (ł nie rozkłada się przez NFD),
 *    potem NFD + usunięcie znaków diakrytycznych, zostawienie a-z0-9 i spacji.
 * 2) aliasKeyFor — NAJPIERW dokładne trafienie aliasu (po normalizacji), dopiero potem
 *    „alias zawarty w wartości” (najdłuższy alias ≥3 znaków). Kierunek tylko
 *    normalized.includes(alias), nie odwrotnie — żeby „racing” nie wpadało w „gt racing”.
 * 3) carMatchesEventCategory — równość znormalizowana, wspólny klucz aliasu, na końcu
 *    wzajemne includes (ścieżka substring, może być asymetryczna).
 *
 * Pomysł (alt): mapa kanonicznych ID kategorii z backendu zamiast string-matchingu;
 * albo Fuse.js / fuzzy search — tu celowo deterministyczne reguły bez zależności.
 */
import type { Car } from "./types";
import { CAR_CLASS_OPTIONS } from "./eventCategories";

/** @deprecated użyj CAR_CLASS_OPTIONS — zostawione dla starych importów. */
export const CAR_CATEGORIES = CAR_CLASS_OPTIONS;

/**
 * Grupy aliasów: klucz kanoniczny → warianty legacy / PL / skróty.
 * Dzięki temu np. „KJS” i „Rajd” trafiają w tę samą rodzinę co „rally”.
 */
const CATEGORY_ALIASES: Record<string, string[]> = {
  drift: ["drift", "drifting", "drifter", "drift trening", "drift amatorskie", "drift pro"],
  "gt racing": ["gt racing", "gt", "gt4", "gt3", "cup", "gtr"],
  rally: ["rally", "rajd", "rajdy", "rallysprint", "kjs", "superoes", "super sprint", "rsmp", "skjs", "hrsmp"],
  endurance: ["endurance", "dlugodystans", "długodystans"],
  "time attack": ["time attack", "timeattack", "ta"],
  racing: ["racing", "wyscig", "wyścig", "wyścigi górskie", "touring", "sprint", "drag race", "wrak race", "rallycross"],
  "track day": ["track day", "trackday", "td"],
  mpws: ["mpws"],
};

/**
 * Normalizacja pod porównania: case-insensitive, bez PL diakrytyków.
 * Uwaga: „ł” mapujemy ręcznie przed NFD — Unicode NFD nie rozkłada ł na l+combining.
 */
function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ł/g, "l") // ł nie rozkłada się przez NFD
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Zwraca klucz kanoniczny z CATEGORY_ALIASES albo null.
 * Kolejność: (1) exact match aliasu, (2) najdłuższy alias ⊆ wartość (≥3 znaki).
 */
function aliasKeyFor(normalized: string): string | null {
  // 1) dokładne trafienie aliasu (po normalizacji PL)
  for (const [key, aliases] of Object.entries(CATEGORY_ALIASES)) {
    for (const raw of aliases) {
      if (normalize(raw) === normalized) return key;
    }
  }
  // 2) alias zawarty w wartości (nie odwrotnie — „racing” nie wpada w „gt racing”)
  let best: { key: string; len: number } | null = null;
  for (const [key, aliases] of Object.entries(CATEGORY_ALIASES)) {
    for (const raw of aliases) {
      const a = normalize(raw);
      if (a.length >= 3 && normalized.includes(a)) {
        if (!best || a.length > best.len) best = { key, len: a.length };
      }
    }
  }
  return best?.key ?? null;
}

/**
 * Czy klasa auta pasuje do kategorii wydarzenia (dokładnie / alias / substring).
 * Puste / whitespace → false.
 */
export function carMatchesEventCategory(
  carClass: string | null | undefined,
  eventCategory: string | null | undefined,
): boolean {
  if (!carClass?.trim() || !eventCategory?.trim()) return false;
  const carN = normalize(carClass);
  const eventN = normalize(eventCategory);
  if (carN === eventN) return true;

  const carKey = aliasKeyFor(carN);
  const eventKey = aliasKeyFor(eventN);
  if (carKey && eventKey && carKey === eventKey) return true;

  return carN.includes(eventN) || eventN.includes(carN);
}

/**
 * Dzieli listę aut garażu na rekomendowane (pasują do kategorii) i pozostałe.
 * Kolejność w tablicach wejściowych jest zachowana w obu wynikach.
 */
export function partitionCarsForEvent(cars: Car[], eventCategory: string) {
  const recommended = cars.filter((c) => carMatchesEventCategory(c.className, eventCategory));
  const other = cars.filter((c) => !carMatchesEventCategory(c.className, eventCategory));
  return { recommended, other };
}

/**
 * Etykieta selecta auta: „Make Model (year) · class”.
 * recommended=true dokłada gwiazdkę ★ na początku (UI „polecane”).
 */
export function formatCarLabel(car: Car, recommended = false): string {
  const base = `${car.make} ${car.model}${car.year ? ` (${car.year})` : ""}`;
  const klass = car.className ? ` · ${car.className}` : "";
  return recommended ? `★ ${base}${klass}` : `${base}${klass}`;
}

export { CAR_CLASS_OPTIONS };
