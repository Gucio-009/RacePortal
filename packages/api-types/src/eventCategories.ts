/**
 * Hierarchiczne kategorie wydarzeń (feedback z review / Specyfikacja).
 *
 * Grupy UI (Rajdy / Wyścigi / Drift / Inne) + płaska lista ALL_EVENT_CATEGORIES
 * do filtrów i walidacji. CAR_CLASS_OPTIONS = te same nazwy bez „Inne”
 * (klasa auta w garażu nie powinna być „Inne”).
 *
 * Nazwy muszą być spójne z aliasami w carMatch.ts (np. „Wyścigi górskie” → rodzina racing).
 *
 * Pomysł (alt): kategorie jako encje w MySQL z slugiem + i18n, zamiast stałej w TS.
 */

export type CategoryGroup = {
  group: string;
  items: string[];
};

/** Grupy do selectów/organizer forms — kolejność = kolejność w UI. */
export const EVENT_CATEGORY_GROUPS: CategoryGroup[] = [
  {
    group: "Rajdy",
    items: ["Rajdy", "KJS", "RallySprint", "SuperOES", "Super Sprint", "RSMP", "SKJS", "HRSMP"],
  },
  {
    group: "Wyścigi",
    items: [
      "Wyścigi górskie",
      "Rallycross",
      "Wrak race",
      "Time Attack",
      "Track Day",
      "Drag race",
      "Sprint",
      "GT Racing",
      "Endurance",
      "MPWS",
      "Racing",
    ],
  },
  {
    group: "Drift",
    items: ["Drift", "Drift trening", "Drift amatorskie", "Drift pro"],
  },
  {
    group: "Inne",
    items: ["Inne"],
  },
];

/** Płaska lista wszystkich kategorii wydarzeń (24 pozycji przy obecnym zestawie). */
export const ALL_EVENT_CATEGORIES: string[] = EVENT_CATEGORY_GROUPS.flatMap((g) => g.items);

/** Płaska lista do selecta className w garażu (bez „Inne”). */
export const CAR_CLASS_OPTIONS = ALL_EVENT_CATEGORIES.filter((c) => c !== "Inne");
