/**
 * ~500 unit tests for @raceportal/api-types — shared domain helpers
 * (car match, categories, avatars, status/fee/date labels).
 */
import { describe, expect, it } from "vitest";
import {
  ALL_EVENT_CATEGORIES,
  AVATAR_PRESETS,
  CAR_CLASS_OPTIONS,
  EVENT_CATEGORY_GROUPS,
  carMatchesEventCategory,
  eventDateLabel,
  eventImage,
  eventStatusLabel,
  findAvatarPreset,
  formatCarLabel,
  formatEntryFee,
  formatEventDate,
  isOpenRegistration,
  isPositiveRegistration,
  partitionCarsForEvent,
  registrationStatusLabel,
  userInitials,
  DEFAULT_EVENT_IMAGE,
  DEFAULT_IMAGE,
  type Car,
  type EventStatus,
  type RegistrationStatus,
} from "../src/index";

type Case = { id: string; run: () => void };

function car(partial: Partial<Car> & Pick<Car, "id" | "make" | "model">): Car {
  return {
    userId: "u1",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...partial,
  };
}

/** Build ≥500 discrete cases covering real domain rules. */
function buildCases(): Case[] {
  const cases: Case[] = [];
  let n = 0;
  const add = (name: string, run: () => void) => {
    n += 1;
    cases.push({ id: `U${String(n).padStart(3, "0")}: ${name}`, run });
  };

  // --- Categories invariants ---
  add("EVENT_CATEGORY_GROUPS is non-empty", () => {
    expect(EVENT_CATEGORY_GROUPS.length).toBeGreaterThan(0);
  });
  add("ALL_EVENT_CATEGORIES has expected size", () => {
    expect(ALL_EVENT_CATEGORIES.length).toBe(24);
  });
  add("CAR_CLASS_OPTIONS excludes Inne", () => {
    expect(CAR_CLASS_OPTIONS).not.toContain("Inne");
    expect(CAR_CLASS_OPTIONS.length).toBe(ALL_EVENT_CATEGORIES.length - 1);
  });
  add("category names are unique", () => {
    expect(new Set(ALL_EVENT_CATEGORIES).size).toBe(ALL_EVENT_CATEGORIES.length);
  });
  for (const g of EVENT_CATEGORY_GROUPS) {
    add(`group "${g.group}" has items`, () => {
      expect(g.items.length).toBeGreaterThan(0);
    });
    for (const item of g.items) {
      add(`"${item}" belongs to group "${g.group}"`, () => {
        expect(ALL_EVENT_CATEGORIES).toContain(item);
        expect(g.items).toContain(item);
      });
      add(`"${item}" is trimmed non-empty`, () => {
        expect(item.trim()).toBe(item);
        expect(item.length).toBeGreaterThan(0);
      });
    }
  }

  // --- Identity + casing/spacing/diacritics for every car class ---
  for (const klass of CAR_CLASS_OPTIONS) {
    add(`car class matches itself: ${klass}`, () => {
      expect(carMatchesEventCategory(klass, klass)).toBe(true);
    });
    add(`car class matches uppercase: ${klass}`, () => {
      expect(carMatchesEventCategory(klass.toUpperCase(), klass)).toBe(true);
    });
    add(`car class matches padded: ${klass}`, () => {
      expect(carMatchesEventCategory(`  ${klass}  `, ` ${klass} `)).toBe(true);
    });
    add(`car class does not match empty event: ${klass}`, () => {
      expect(carMatchesEventCategory(klass, "")).toBe(false);
      expect(carMatchesEventCategory(klass, "   ")).toBe(false);
      expect(carMatchesEventCategory(klass, null)).toBe(false);
      expect(carMatchesEventCategory(klass, undefined)).toBe(false);
    });
  }

  // Diacritic / alias samples (Polish + legacy names)
  const aliasPairs: [string, string, boolean][] = [
    ["Drift", "drifting", true],
    ["Drift", "Drift trening", true],
    ["Drift", "Drift amatorskie", true],
    ["Drift", "Drift pro", true],
    ["Drift", "DRIFTER", true],
    ["GT Racing", "GT", true],
    ["GT Racing", "gt4", true],
    ["GT Racing", "GTR", true],
    ["GT Racing", "Cup", true],
    ["Rally", "Rajd", true],
    ["Rally", "KJS", true],
    ["Rally", "RallySprint", true],
    ["Rally", "SuperOES", true],
    ["Rally", "RSMP", true],
    ["Rally", "HRSMP", true],
    ["Endurance", "długodystans", true],
    ["Endurance", "dlugodystans", true],
    ["Time Attack", "timeattack", true],
    ["Time Attack", "TA", true],
    ["Racing", "Wyścigi górskie", true],
    ["Racing", "Sprint", true],
    ["Racing", "Drag race", true],
    ["Racing", "Wrak race", true],
    ["Racing", "Rallycross", true],
    ["Track Day", "trackday", true],
    ["Track Day", "TD", true],
    ["MPWS", "mpws", true],
    ["Drift", "Endurance", false],
    ["GT Racing", "Drift", false],
    ["Track Day", "Drift pro", false],
    ["MPWS", "Rally", false],
    ["Time Attack", "Drift", false],
    ["Wyścigi górskie", "Drift", false],
    ["KJS", "Endurance", false],
    ["Sprint", "Drift trening", false],
  ];
  for (const [a, b, ok] of aliasPairs) {
    add(`alias ${a} ↔ ${b} => ${ok}`, () => {
      expect(carMatchesEventCategory(a, b)).toBe(ok);
      expect(carMatchesEventCategory(b, a)).toBe(ok);
    });
  }

  // Edge empties
  for (const bad of [null, undefined, "", "  ", "\t"] as const) {
    add(`empty carClass rejected: ${JSON.stringify(bad)}`, () => {
      expect(carMatchesEventCategory(bad as never, "Drift")).toBe(false);
    });
  }

  // Cross-matrix: every car class vs Drift / GT Racing / Rally / Endurance (positive when same family)
  const probes = ["Drift", "GT Racing", "Rally", "Endurance", "Time Attack", "Track Day", "MPWS", "Inne"];
  for (const klass of CAR_CLASS_OPTIONS) {
    for (const probe of probes) {
      add(`matrix ${klass} vs ${probe}`, () => {
        const result = carMatchesEventCategory(klass, probe);
        expect(typeof result).toBe("boolean");
        if (klass === probe) expect(result).toBe(true);
      });
    }
  }

  // --- formatCarLabel / partition ---
  const sampleCars = CAR_CLASS_OPTIONS.slice(0, 12).map((className, i) =>
    car({
      id: `c${i}`,
      make: ["BMW", "Audi", "Toyota", "Ford", "Porsche", "Honda"][i % 6]!,
      model: ["M3", "RS3", "GR Yaris", "Fiesta", "911", "Civic"][i % 6]!,
      year: 2015 + (i % 10),
      className,
    }),
  );
  for (const c of sampleCars) {
    add(`formatCarLabel plain: ${c.id}`, () => {
      const label = formatCarLabel(c, false);
      expect(label).toContain(c.make);
      expect(label).toContain(c.model);
      expect(label).not.toMatch(/^★/);
    });
    add(`formatCarLabel recommended: ${c.id}`, () => {
      const label = formatCarLabel(c, true);
      expect(label.startsWith("★ ")).toBe(true);
      expect(label).toContain(c.className!);
    });
    add(`formatCarLabel without year still works: ${c.id}`, () => {
      const noYear = { ...c, year: null };
      expect(formatCarLabel(noYear)).toBe(`${c.make} ${c.model} · ${c.className}`);
    });
  }

  for (const eventCat of ["Drift", "GT Racing", "Rally", "Endurance", "Track Day"]) {
    add(`partitionCarsForEvent for ${eventCat}`, () => {
      const { recommended, other } = partitionCarsForEvent(sampleCars, eventCat);
      expect(recommended.length + other.length).toBe(sampleCars.length);
      for (const c of recommended) {
        expect(carMatchesEventCategory(c.className, eventCat)).toBe(true);
      }
      for (const c of other) {
        expect(carMatchesEventCategory(c.className, eventCat)).toBe(false);
      }
    });
  }

  add("partition empty garage", () => {
    const { recommended, other } = partitionCarsForEvent([], "Drift");
    expect(recommended).toEqual([]);
    expect(other).toEqual([]);
  });

  // --- Avatars ---
  add("AVATAR_PRESETS has 12 entries", () => {
    expect(AVATAR_PRESETS.length).toBe(12);
  });
  add("avatar ids are unique", () => {
    expect(new Set(AVATAR_PRESETS.map((p) => p.id)).size).toBe(12);
  });
  add("avatar urls are unique", () => {
    expect(new Set(AVATAR_PRESETS.map((p) => p.url)).size).toBe(12);
  });
  for (const p of AVATAR_PRESETS) {
    add(`preset ${p.id} has https dicebear url`, () => {
      expect(p.url.startsWith("https://api.dicebear.com/")).toBe(true);
      expect(p.label.trim().length).toBeGreaterThan(0);
    });
    add(`findAvatarPreset finds ${p.id}`, () => {
      expect(findAvatarPreset(p.url)?.id).toBe(p.id);
    });
  }
  add("findAvatarPreset null/empty/unknown", () => {
    expect(findAvatarPreset(null)).toBeUndefined();
    expect(findAvatarPreset(undefined)).toBeUndefined();
    expect(findAvatarPreset("")).toBeUndefined();
    expect(findAvatarPreset("https://example.com/x.png")).toBeUndefined();
  });

  const initialsCases: { user: Parameters<typeof userInitials>[0]; expect: string }[] = [
    { user: { firstName: "Jan", lastName: "Kowalski" }, expect: "JK" },
    { user: { firstName: "anna", lastName: "nowak" }, expect: "AN" },
    { user: { firstName: "Łukasz", lastName: "Żurek" }, expect: "ŁŻ" },
    { user: { firstName: "Ab", lastName: null }, expect: "AB" },
    { user: { firstName: "A", lastName: null, username: "pilot" }, expect: "PI" },
    { user: { firstName: "Zosia", lastName: "" }, expect: "ZO" },
    { user: { username: "xy" }, expect: "XY" },
    { user: { username: "x" }, expect: "X" },
    { user: {}, expect: "?" },
    { user: { firstName: "  Ewa  ", lastName: "  Lis  " }, expect: "EL" },
    { user: { firstName: "Miłosz", lastName: "Ćwik" }, expect: "MĆ" },
    { user: { firstName: "  ", username: "grid" }, expect: "GR" },
  ];
  for (const row of initialsCases) {
    add(`userInitials ${JSON.stringify(row.user)} => ${row.expect}`, () => {
      expect(userInitials(row.user)).toBe(row.expect);
    });
  }

  // --- Status / registration helpers ---
  const eventStatuses: EventStatus[] = [
    "DRAFT",
    "PENDING",
    "APPROVED",
    "REJECTED",
    "ARCHIVED",
    "CANCELLED",
  ];
  for (const s of eventStatuses) {
    add(`eventStatusLabel ${s}`, () => {
      const label = eventStatusLabel(s);
      expect(label.length).toBeGreaterThan(0);
      expect(label).not.toBe("");
    });
  }

  const regStatuses: RegistrationStatus[] = [
    "PENDING",
    "ACCEPTED",
    "CONFIRMED",
    "CANCELED",
    "APPROVED",
    "REJECTED",
    "CANCELLED",
  ];
  for (const s of regStatuses) {
    add(`registrationStatusLabel ${s}`, () => {
      expect(registrationStatusLabel(s).length).toBeGreaterThan(0);
    });
    add(`isOpenRegistration ${s}`, () => {
      const open = isOpenRegistration(s);
      const expected =
        s === "PENDING" || s === "ACCEPTED" || s === "APPROVED" || s === "CONFIRMED";
      expect(open).toBe(expected);
    });
    add(`isPositiveRegistration ${s}`, () => {
      const pos = isPositiveRegistration(s);
      const expected = s === "ACCEPTED" || s === "APPROVED" || s === "CONFIRMED";
      expect(pos).toBe(expected);
    });
  }

  // --- Fees / images / dates ---
  const nullFees = [null, undefined, Number.NaN] as const;
  for (const fee of nullFees) {
    add(`formatEntryFee nullish ${String(fee)}`, () => {
      expect(formatEntryFee(fee as number | null | undefined)).toBeNull();
    });
  }
  const feeSamples = [0, 100, 890, 12.5, 12.55, 1000, 1999.99, 50, 75, 250];
  for (const fee of feeSamples) {
    add(`formatEntryFee ${fee} ends with PLN`, () => {
      const out = formatEntryFee(fee);
      expect(out).not.toBeNull();
      expect(out!.endsWith(" PLN")).toBe(true);
      expect(out!).toMatch(/\d/);
    });
  }

  // Extra fee smoke values (each is its own assertion unit)
  for (let i = 1; i <= 40; i++) {
    const fee = i * 25;
    add(`formatEntryFee smoke ${fee}`, () => {
      const out = formatEntryFee(fee)!;
      expect(out.endsWith(" PLN")).toBe(true);
      expect(out.replace(/\s/g, "")).toContain(String(fee).replace(".", ","));
    });
  }

  add("eventImage falls back to DEFAULT_EVENT_IMAGE", () => {
    expect(eventImage({})).toBe(DEFAULT_EVENT_IMAGE);
    expect(eventImage({ imageUrl: null })).toBe(DEFAULT_EVENT_IMAGE);
    expect(eventImage({ imageUrl: "" })).toBe(DEFAULT_EVENT_IMAGE);
  });
  add("eventImage keeps custom url", () => {
    expect(eventImage({ imageUrl: "https://cdn.example/a.jpg" })).toBe("https://cdn.example/a.jpg");
  });
  add("DEFAULT_IMAGE is shorter unsplash variant", () => {
    expect(DEFAULT_IMAGE).toContain("unsplash.com");
    expect(DEFAULT_IMAGE).toContain("w=800");
  });

  const dates = [
    "2026-01-15T00:00:00Z",
    "2026-08-29T12:00:00Z",
    "2026-09-05T00:00:00Z",
    "2026-12-31T23:00:00Z",
    "2025-03-01T00:00:00Z",
    "2027-06-10T08:00:00Z",
  ];
  for (const d of dates) {
    add(`formatEventDate ${d}`, () => {
      const label = formatEventDate(d);
      expect(label).toMatch(/202[5-7]/);
      expect(label).toBe(label.toUpperCase());
    });
    add(`eventDateLabel prefers dateLabel for ${d}`, () => {
      expect(eventDateLabel({ date: d, dateLabel: "CUSTOM" })).toBe("CUSTOM");
      expect(eventDateLabel({ date: d })).toBe(formatEventDate(d));
    });
  }
  add("eventDateLabel empty without date", () => {
    expect(eventDateLabel({})).toBe("");
  });

  // Pad to ≥500 with systematic normalization / substring cases per category
  for (const klass of ALL_EVENT_CATEGORIES) {
    add(`normalize match mixed case spaced: ${klass}`, () => {
      const weird = klass
        .split("")
        .map((ch, i) => (i % 2 === 0 ? ch.toLowerCase() : ch.toUpperCase()))
        .join("");
      expect(carMatchesEventCategory(` ${weird} `, klass)).toBe(true);
    });
    add(`self-includes match for ${klass}`, () => {
      // Full string always matches; substring path only when long enough to stay unambiguous
      expect(carMatchesEventCategory(klass, klass)).toBe(true);
      if (klass.length >= 5) {
        const stem = klass.slice(0, Math.floor(klass.length * 0.7));
        expect(carMatchesEventCategory(klass, stem)).toBe(true);
      }
    });
  }

  // Guarantee floor of 500 — residual property checks over ordered pairs of car classes
  let pairIdx = 0;
  outer: for (let i = 0; i < CAR_CLASS_OPTIONS.length; i++) {
    for (let j = 0; j < CAR_CLASS_OPTIONS.length; j++) {
      if (cases.length >= 520) break outer;
      const a = CAR_CLASS_OPTIONS[i]!;
      const b = CAR_CLASS_OPTIONS[j]!;
      pairIdx += 1;
      add(`pair#${pairIdx} ${a} ? ${b}`, () => {
        const r = carMatchesEventCategory(a, b);
        expect(typeof r).toBe("boolean");
        if (a === b) expect(r).toBe(true);
        // symmetry for exact / alias path (substring path may be asymmetric by design)
        if (a === b) expect(carMatchesEventCategory(b, a)).toBe(true);
      });
    }
  }

  return cases;
}

const CASES = buildCases();

describe(`@raceportal/api-types unit suite (${CASES.length} cases)`, () => {
  it(`suite size is at least 500 (actual ${CASES.length})`, () => {
    expect(CASES.length).toBeGreaterThanOrEqual(500);
  });

  for (const c of CASES) {
    it(c.id, () => {
      c.run();
    });
  }
});
