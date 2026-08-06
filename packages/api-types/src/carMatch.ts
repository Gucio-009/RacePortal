import type { Car } from "./types";
import { CAR_CLASS_OPTIONS } from "./eventCategories";

/** @deprecated use CAR_CLASS_OPTIONS — kept for imports */
export const CAR_CATEGORIES = CAR_CLASS_OPTIONS;

/** Alias groups so legacy class names still match event categories. */
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

export function partitionCarsForEvent(cars: Car[], eventCategory: string) {
  const recommended = cars.filter((c) => carMatchesEventCategory(c.className, eventCategory));
  const other = cars.filter((c) => !carMatchesEventCategory(c.className, eventCategory));
  return { recommended, other };
}

export function formatCarLabel(car: Car, recommended = false): string {
  const base = `${car.make} ${car.model}${car.year ? ` (${car.year})` : ""}`;
  const klass = car.className ? ` · ${car.className}` : "";
  return recommended ? `★ ${base}${klass}` : `${base}${klass}`;
}

export { CAR_CLASS_OPTIONS };
