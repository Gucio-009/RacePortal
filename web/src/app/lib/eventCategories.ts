/**
 * eventCategories.ts — grupy / lista kategorii wydarzeń (Select w formularzu org.).
 *
 * Re-eksport z `@raceportal/api-types` — spójność web ↔ mobile ↔ walidacja API.
 * `EVENT_CATEGORY_GROUPS` + `ALL_EVENT_CATEGORIES` używane w OrganizerEventFormDialog
 * i `eventToForm` (rozpoznanie OTHER vs preset).
 *
 * Pomysł (alt): kategorie z endpointu admina (CRUD) zamiast stałej listy.
 */

/** Re-export — źródło prawdy: @raceportal/api-types */
export * from "@raceportal/api-types";
