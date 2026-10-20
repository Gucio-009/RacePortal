/**
 * types.ts — re-eksport typów domenowych z `@raceportal/api-types`.
 *
 * Źródło prawdy: `packages/api-types` (współdzielone web + mobile).
 * Tu tylko barrel, żeby importy w appce były krótkie (`../lib/types`).
 * Zawiera m.in. ApiEvent, User, Registration, formatEntryFee, userInitials…
 *
 * Pomysł (alt): generacja z OpenAPI backendu zamiast ręcznego pakietu.
 */

/** Re-export wspólnych typów domenowych — źródło prawdy: @raceportal/api-types */
export * from "@raceportal/api-types";
