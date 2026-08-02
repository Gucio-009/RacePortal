import type { Car } from "./types";

/** Known race categories used as car className and event.category. */
export const CAR_CATEGORIES = [
  "Drift",
  "GT Racing",
  "Rally",
  "Endurance",
  "Time Attack",
  "Racing",
  "Track Day",
  "MPWS",
] as const;

/** Alias groups so legacy class names (GT4, Cup…) still match event categories. */
const CATEGORY_ALIASES: Record<string, string[]> = {
  drift: ["drift", "drifting", "drifter"],
  "gt racing": ["gt racing", "gt", "gt4", "gt3", "cup", "gtr"],
  rally: ["rally", "rajd", "rallysprint"],
  endurance: ["endurance", "dlugodystans", "długodystans"],
  "time attack": ["time attack", "timeattack", "ta"],
  racing: ["racing", "wyscig", "wyścig", "touring"],
  "track day": ["track day", "trackday", "td"],
  mpws: ["mpws"],
};

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function aliasKeyFor(normalized: string): string | null {
  for (const [key, aliases] of Object.entries(CATEGORY_ALIASES)) {
    if (aliases.some((a) => a === normalized || normalized.includes(a) || a.includes(normalized))) {
      return key;
    }
  }
  return null;
}

/** Whether a garage car class fits the event category (zalecane). */
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
