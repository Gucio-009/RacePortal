/**
 * carMatch.ts — dopasowanie auta z garażu do kategorii wydarzenia.
 *
 * Re-eksport z `@raceportal/api-types` (ta sama logika co mobile).
 * Używane przy zapisie na event: `carMatchesEventCategory` / `partitionCarsForEvent`.
 *
 * Pomysł (alt): reguły po stronie API jako jedyne źródło (frontend tylko wyświetla).
 */

/** Re-export — źródło prawdy: @raceportal/api-types */
export {
  CAR_CATEGORIES,
  CAR_CLASS_OPTIONS,
  carMatchesEventCategory,
  partitionCarsForEvent,
  formatCarLabel,
} from "@raceportal/api-types";
