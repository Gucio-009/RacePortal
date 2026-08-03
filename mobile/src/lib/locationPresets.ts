/** Shared location presets for filters (aligned with web organizer presets). */

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

export type TrackPreset = {
  track: string;
  city: string;
  voivodeship: string;
  lat: number;
  lng: number;
};

export const TRACK_PRESETS: TrackPreset[] = [
  { track: "Tor Poznań", city: "Poznań", voivodeship: "Wielkopolskie", lat: 52.3312, lng: 16.8491 },
  { track: "Autodrom Pomorze Pszczółki", city: "Pszczółki", voivodeship: "Pomorskie", lat: 54.1985, lng: 18.5986 },
  { track: "Tor Słomczyn", city: "Słomczyn", voivodeship: "Mazowieckie", lat: 52.0376, lng: 20.7589 },
  { track: "Autodrom Most", city: "Most", voivodeship: "Dolnośląskie", lat: 50.5031, lng: 13.636 },
  { track: "Tor Kamień Śląski", city: "Kamień Śląski", voivodeship: "Opolskie", lat: 50.575, lng: 18.083 },
  { track: "Tor Ułęż", city: "Ułęż", voivodeship: "Lubelskie", lat: 51.627, lng: 22.108 },
  { track: "Tor Kielce", city: "Kielce", voivodeship: "Świętokrzyskie", lat: 50.8661, lng: 20.6286 },
  { track: "Ośrodek Rajdowy Radom", city: "Radom", voivodeship: "Mazowieckie", lat: 51.4027, lng: 21.1471 },
  { track: "Tor Modlin", city: "Nowy Dwór Mazowiecki", voivodeship: "Mazowieckie", lat: 52.451, lng: 20.651 },
  { track: "Tor Jastrząb", city: "Jastrząb", voivodeship: "Mazowieckie", lat: 51.248, lng: 20.943 },
];

export const FILTER_CITIES = Array.from(new Set(TRACK_PRESETS.map((t) => t.city))).sort((a, b) =>
  a.localeCompare(b, "pl"),
);
