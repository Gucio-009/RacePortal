/**
 * Klucze rodzajów opon w garażu (CSV w {@code Car.tireTypes}).
 * Etykiety UI: i18n `garage.tire.*`.
 */
export const TIRE_TYPE_OPTIONS = [
  "road",
  "semislick",
  "slick",
  "gravel",
  "rain",
  "studded",
] as const;

export type TireType = (typeof TIRE_TYPE_OPTIONS)[number];
