/** Hierarchical event categories from review feedback / Specyfikacja. */

export type CategoryGroup = {
  group: string;
  items: string[];
};

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

export const ALL_EVENT_CATEGORIES: string[] = EVENT_CATEGORY_GROUPS.flatMap((g) => g.items);

/** Flat list for garage car className select (aligned with event categories). */
export const CAR_CLASS_OPTIONS = ALL_EVENT_CATEGORIES.filter((c) => c !== "Inne");
