/**
 * Presety lokalizacji pod filtry listy wydarzeń (województwa, miasta, tory).
 *
 * Źródło: `@raceportal/api-types` (zsynchronizowane z seedem backendu `/api/tracks`).
 */

export {
  TRACK_PRESETS,
  FILTER_CITIES,
  type TrackPreset,
  type TrackKind,
} from "@raceportal/api-types";

export const VOIVODESHIPS = [
  "Dolnośląskie",
  "Kujawsko-Pomorskie",
  "Lubelskie",
  "Lubuskie",
  "Łódzkie",
  "Małopolskie",
  "Mazowieckie",
  "Opolskie",
  "Podkarpackie",
  "Podlaskie",
  "Pomorskie",
  "Śląskie",
  "Świętokrzyskie",
  "Warmińsko-Mazurskie",
  "Wielkopolskie",
  "Zachodniopomorskie",
] as const;
