/**
 * Dopasowanie aut z garażu do kategorii wydarzenia (re-export).
 *
 * Rola w architekturze: ta sama logika co na webie (`partitionCarsForEvent`
 * itd.) — ekran szczegółów eventu pokazuje „pasujące” vs „pozostałe” auta.
 *
 * Pomysł (alt): reguły po stronie API (serwer filtruje garaż per event).
 */
/** Re-export — source of truth: @raceportal/api-types */
export {
  CAR_CLASS_OPTIONS,
  carMatchesEventCategory,
  partitionCarsForEvent,
  formatCarLabel,
} from "@raceportal/api-types";
