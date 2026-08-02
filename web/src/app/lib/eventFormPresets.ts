/** Presets for click-friendly organizer event creation. */

export const OTHER = "__other__";

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

/** Popular PL tracks — selecting one fills city / voivodeship / coords. */
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

export const START_TIMES = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "19:30",
  "20:00",
] as const;

export const EVENT_IMAGE_PRESETS = [
  {
    label: "Grid / start",
    url: "https://images.unsplash.com/photo-1638909469623-4fdd7758414b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    label: "GT / pace",
    url: "https://images.unsplash.com/photo-1617130644016-d318045a3958?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    label: "Drift",
    url: "https://images.unsplash.com/photo-1638909486348-82ae8d57dfd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    label: "Festiwal",
    url: "https://images.unsplash.com/photo-1752449096739-83ac1ef2c0dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    label: "Endurance / noc",
    url: "https://images.unsplash.com/photo-1664911200744-8c3a496baa2a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    label: "Track day",
    url: "https://images.unsplash.com/photo-1617130627248-0bf361f6556a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    label: "Rally",
    url: "https://images.unsplash.com/photo-1600661653561-629509216228?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    label: "Street / time attack",
    url: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
] as const;

export const ENTRY_FEE_PRESETS = ["150", "250", "320", "450", "650", "890", "1200"] as const;

export const PAYMENT_DEADLINE_OPTIONS = [
  { value: "24", label: "24 godziny" },
  { value: "48", label: "48 godzin" },
  { value: "72", label: "72 godziny (3 dni)" },
  { value: "168", label: "7 dni" },
] as const;

export const FREE_CANCEL_OPTIONS = [
  { value: "3", label: "3 dni przed" },
  { value: "7", label: "7 dni przed" },
  { value: "14", label: "14 dni przed" },
  { value: "30", label: "30 dni przed" },
] as const;

export const DEMO_BANK_ACCOUNT = "PL61 1090 1014 0000 0712 1981 2874";
