import type { Car } from "../api/types";

const CAR_CLASS_OPTIONS = [
  "Drift",
  "GT Racing",
  "Rally",
  "Endurance",
  "Time Attack",
  "Racing",
  "Track Day",
  "MPWS",
];

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

export { CAR_CLASS_OPTIONS };
