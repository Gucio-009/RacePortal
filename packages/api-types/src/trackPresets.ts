/**
 * Katalog torów i miejsc eventowych w Polsce (presety UI + seed backendu).
 *
 * Współrzędne przybliżone (centrum obiektu) — pin na mapie / LocationMapPicker.
 * `kind`: CIRCUIT | AUTODROM | KARTING | DRIFT | RALLY | AIRFIELD | SPEEDWAY | EXPO | OTHER
 */

export type TrackKind =
  | "CIRCUIT"
  | "AUTODROM"
  | "KARTING"
  | "DRIFT"
  | "RALLY"
  | "AIRFIELD"
  | "SPEEDWAY"
  | "EXPO"
  | "OTHER";

export type TrackPreset = {
  track: string;
  city: string;
  voivodeship: string;
  lat: number;
  lng: number;
  kind?: TrackKind;
};

/** Tory, autodromy, kartodromy, bazy rajdowe i miejsca imprez motorsportowych w PL. */
export const TRACK_PRESETS: TrackPreset[] = [
  // —— duże / znane tory ——
  { track: "Tor Poznań", city: "Poznań", voivodeship: "Wielkopolskie", lat: 52.3312, lng: 16.8491, kind: "CIRCUIT" },
  { track: "Autodrom Pomorze Pszczółki", city: "Pszczółki", voivodeship: "Pomorskie", lat: 54.1985, lng: 18.5986, kind: "AUTODROM" },
  { track: "Tor Słomczyn", city: "Słomczyn", voivodeship: "Mazowieckie", lat: 52.0376, lng: 20.7589, kind: "DRIFT" },
  { track: "Tor Kielce", city: "Kielce", voivodeship: "Świętokrzyskie", lat: 50.8661, lng: 20.6286, kind: "CIRCUIT" },
  { track: "Tor Kamień Śląski", city: "Kamień Śląski", voivodeship: "Opolskie", lat: 50.575, lng: 18.083, kind: "CIRCUIT" },
  { track: "Tor Ułęż", city: "Ułęż", voivodeship: "Lubelskie", lat: 51.627, lng: 22.108, kind: "CIRCUIT" },
  { track: "Tor Modlin", city: "Nowy Dwór Mazowiecki", voivodeship: "Mazowieckie", lat: 52.451, lng: 20.651, kind: "AIRFIELD" },
  { track: "Tor Jastrząb", city: "Jastrząb", voivodeship: "Mazowieckie", lat: 51.248, lng: 20.943, kind: "CIRCUIT" },
  { track: "Tor Bednary", city: "Bednary", voivodeship: "Wielkopolskie", lat: 52.353, lng: 17.401, kind: "KARTING" },
  { track: "Ośrodek Rajdowy Radom", city: "Radom", voivodeship: "Mazowieckie", lat: 51.4027, lng: 21.1471, kind: "RALLY" },

  // —— Mazowsze / okolice Warszawy ——
  { track: "Tor Bemowo", city: "Warszawa", voivodeship: "Mazowieckie", lat: 52.259, lng: 20.907, kind: "OTHER" },
  { track: "Tor Służewiec", city: "Warszawa", voivodeship: "Mazowieckie", lat: 52.164, lng: 21.005, kind: "OTHER" },
  { track: "PTAK Warsaw Expo", city: "Nadarzyn", voivodeship: "Mazowieckie", lat: 52.070, lng: 20.807, kind: "EXPO" },
  { track: "Tor Legionowo", city: "Legionowo", voivodeship: "Mazowieckie", lat: 52.401, lng: 20.927, kind: "KARTING" },
  { track: "Tor Pruszków", city: "Pruszków", voivodeship: "Mazowieckie", lat: 52.167, lng: 20.812, kind: "KARTING" },
  { track: "Tor Piaseczno", city: "Piaseczno", voivodeship: "Mazowieckie", lat: 52.073, lng: 21.024, kind: "KARTING" },
  { track: "Tor Otwock", city: "Otwock", voivodeship: "Mazowieckie", lat: 52.105, lng: 21.261, kind: "OTHER" },
  { track: "Tor Mińsk Mazowiecki", city: "Mińsk Mazowiecki", voivodeship: "Mazowieckie", lat: 52.179, lng: 21.572, kind: "OTHER" },
  { track: "Tor Siedlce", city: "Siedlce", voivodeship: "Mazowieckie", lat: 52.168, lng: 22.272, kind: "KARTING" },
  { track: "Tor Płock", city: "Płock", voivodeship: "Mazowieckie", lat: 52.547, lng: 19.706, kind: "KARTING" },
  { track: "Tor Ciechanów", city: "Ciechanów", voivodeship: "Mazowieckie", lat: 52.881, lng: 20.620, kind: "OTHER" },
  { track: "Tor Ostrołęka", city: "Ostrołęka", voivodeship: "Mazowieckie", lat: 53.086, lng: 21.576, kind: "OTHER" },
  { track: "Tor Radom (kartodrom)", city: "Radom", voivodeship: "Mazowieckie", lat: 51.417, lng: 21.156, kind: "KARTING" },

  // —— Wielkopolska ——
  { track: "Tor Gostyń", city: "Gostyń", voivodeship: "Wielkopolskie", lat: 51.882, lng: 17.012, kind: "KARTING" },
  { track: "Tor Ostrów Wielkopolski", city: "Ostrów Wielkopolski", voivodeship: "Wielkopolskie", lat: 51.649, lng: 17.817, kind: "SPEEDWAY" },
  { track: "Tor Leszno", city: "Leszno", voivodeship: "Wielkopolskie", lat: 51.843, lng: 16.575, kind: "SPEEDWAY" },
  { track: "Tor Gniezno", city: "Gniezno", voivodeship: "Wielkopolskie", lat: 52.535, lng: 17.598, kind: "SPEEDWAY" },
  { track: "Tor Piła", city: "Piła", voivodeship: "Wielkopolskie", lat: 53.151, lng: 16.738, kind: "KARTING" },
  { track: "Tor Konin", city: "Konin", voivodeship: "Wielkopolskie", lat: 52.223, lng: 18.251, kind: "KARTING" },
  { track: "Tor Kalisz", city: "Kalisz", voivodeship: "Wielkopolskie", lat: 51.761, lng: 18.091, kind: "KARTING" },
  { track: "Tor Września", city: "Września", voivodeship: "Wielkopolskie", lat: 52.325, lng: 17.565, kind: "OTHER" },
  { track: "Tor Środa Wielkopolska", city: "Środa Wielkopolska", voivodeship: "Wielkopolskie", lat: 52.229, lng: 17.276, kind: "OTHER" },

  // —— Pomorze ——
  { track: "Amber Karting Gdańsk", city: "Gdańsk", voivodeship: "Pomorskie", lat: 54.378, lng: 18.618, kind: "KARTING" },
  { track: "Tor Gdynia Kosakowo", city: "Kosakowo", voivodeship: "Pomorskie", lat: 54.580, lng: 18.482, kind: "AIRFIELD" },
  { track: "Tor Słupsk", city: "Słupsk", voivodeship: "Pomorskie", lat: 54.464, lng: 17.029, kind: "KARTING" },
  { track: "Tor Chojnice", city: "Chojnice", voivodeship: "Pomorskie", lat: 53.695, lng: 17.557, kind: "OTHER" },
  { track: "Tor Tczew", city: "Tczew", voivodeship: "Pomorskie", lat: 54.092, lng: 18.778, kind: "OTHER" },
  { track: "Tor Malbork", city: "Malbork", voivodeship: "Pomorskie", lat: 54.036, lng: 19.028, kind: "OTHER" },
  { track: "Tor Starogard Gdański", city: "Starogard Gdański", voivodeship: "Pomorskie", lat: 53.964, lng: 18.526, kind: "OTHER" },

  // —— Zachodniopomorskie ——
  { track: "Tor Szczecin Dąbie", city: "Szczecin", voivodeship: "Zachodniopomorskie", lat: 53.391, lng: 14.665, kind: "KARTING" },
  { track: "Tor Koszalin", city: "Koszalin", voivodeship: "Zachodniopomorskie", lat: 54.194, lng: 16.172, kind: "KARTING" },
  { track: "Tor Kołobrzeg", city: "Kołobrzeg", voivodeship: "Zachodniopomorskie", lat: 54.176, lng: 15.576, kind: "OTHER" },
  { track: "Tor Stargard", city: "Stargard", voivodeship: "Zachodniopomorskie", lat: 53.336, lng: 15.050, kind: "OTHER" },
  { track: "Tor Wałcz", city: "Wałcz", voivodeship: "Zachodniopomorskie", lat: 53.270, lng: 16.471, kind: "OTHER" },
  { track: "Tor Drawsko Pomorskie", city: "Drawsko Pomorskie", voivodeship: "Zachodniopomorskie", lat: 53.531, lng: 15.810, kind: "OTHER" },

  // —— Kujawsko-Pomorskie ——
  { track: "Tor Myślęcinek", city: "Bydgoszcz", voivodeship: "Kujawsko-Pomorskie", lat: 53.167, lng: 18.038, kind: "KARTING" },
  { track: "Motoarena Toruń", city: "Toruń", voivodeship: "Kujawsko-Pomorskie", lat: 53.019, lng: 18.587, kind: "SPEEDWAY" },
  { track: "Tor Grudziądz", city: "Grudziądz", voivodeship: "Kujawsko-Pomorskie", lat: 53.484, lng: 18.754, kind: "SPEEDWAY" },
  { track: "Tor Włocławek", city: "Włocławek", voivodeship: "Kujawsko-Pomorskie", lat: 52.648, lng: 19.068, kind: "KARTING" },
  { track: "Tor Inowrocław", city: "Inowrocław", voivodeship: "Kujawsko-Pomorskie", lat: 52.796, lng: 18.264, kind: "OTHER" },

  // —— Warmia i Mazury ——
  { track: "Tor Olsztyn", city: "Olsztyn", voivodeship: "Warmińsko-Mazurskie", lat: 53.779, lng: 20.480, kind: "KARTING" },
  { track: "Baza Rajdowa Mikołajki", city: "Mikołajki", voivodeship: "Warmińsko-Mazurskie", lat: 53.803, lng: 21.570, kind: "RALLY" },
  { track: "Tor Elbląg", city: "Elbląg", voivodeship: "Warmińsko-Mazurskie", lat: 54.156, lng: 19.405, kind: "KARTING" },
  { track: "Tor Ostróda", city: "Ostróda", voivodeship: "Warmińsko-Mazurskie", lat: 53.697, lng: 19.965, kind: "OTHER" },
  { track: "Tor Ełk", city: "Ełk", voivodeship: "Warmińsko-Mazurskie", lat: 53.828, lng: 22.365, kind: "OTHER" },
  { track: "Tor Giżycko", city: "Giżycko", voivodeship: "Warmińsko-Mazurskie", lat: 54.038, lng: 21.759, kind: "OTHER" },
  { track: "Tor Mrągowo", city: "Mrągowo", voivodeship: "Warmińsko-Mazurskie", lat: 53.864, lng: 21.305, kind: "RALLY" },
  { track: "Tor Iława", city: "Iława", voivodeship: "Warmińsko-Mazurskie", lat: 53.596, lng: 19.569, kind: "OTHER" },

  // —— Podlaskie ——
  { track: "Tor Białystok", city: "Białystok", voivodeship: "Podlaskie", lat: 53.132, lng: 23.169, kind: "KARTING" },
  { track: "Tor Łomża", city: "Łomża", voivodeship: "Podlaskie", lat: 53.178, lng: 22.059, kind: "OTHER" },
  { track: "Tor Suwałki", city: "Suwałki", voivodeship: "Podlaskie", lat: 54.101, lng: 22.931, kind: "OTHER" },
  { track: "Tor Augustów", city: "Augustów", voivodeship: "Podlaskie", lat: 53.843, lng: 22.980, kind: "OTHER" },

  // —— Lubelskie ——
  { track: "Tor Lublin", city: "Lublin", voivodeship: "Lubelskie", lat: 51.247, lng: 22.569, kind: "KARTING" },
  { track: "Tor Puławy", city: "Puławy", voivodeship: "Lubelskie", lat: 51.417, lng: 21.969, kind: "OTHER" },
  { track: "Tor Zamość", city: "Zamość", voivodeship: "Lubelskie", lat: 50.723, lng: 23.252, kind: "OTHER" },
  { track: "Tor Chełm", city: "Chełm", voivodeship: "Lubelskie", lat: 51.143, lng: 23.471, kind: "OTHER" },
  { track: "Tor Biała Podlaska", city: "Biała Podlaska", voivodeship: "Lubelskie", lat: 52.033, lng: 23.119, kind: "OTHER" },
  { track: "Tor Świdnik", city: "Świdnik", voivodeship: "Lubelskie", lat: 51.219, lng: 22.696, kind: "AIRFIELD" },

  // —— Podkarpackie ——
  { track: "Tor Rzeszów Jasionka", city: "Jasionka", voivodeship: "Podkarpackie", lat: 50.110, lng: 22.049, kind: "AIRFIELD" },
  { track: "Tor Mielec", city: "Mielec", voivodeship: "Podkarpackie", lat: 50.322, lng: 21.436, kind: "AIRFIELD" },
  { track: "Tor Krosno", city: "Krosno", voivodeship: "Podkarpackie", lat: 49.687, lng: 21.770, kind: "AIRFIELD" },
  { track: "Tor Stalowa Wola", city: "Stalowa Wola", voivodeship: "Podkarpackie", lat: 50.583, lng: 22.053, kind: "OTHER" },
  { track: "Tor Przemyśl", city: "Przemyśl", voivodeship: "Podkarpackie", lat: 49.784, lng: 22.767, kind: "OTHER" },
  { track: "Baza Rajdowa Bieszczady", city: "Ustrzyki Dolne", voivodeship: "Podkarpackie", lat: 49.430, lng: 22.594, kind: "RALLY" },

  // —— Małopolska ——
  { track: "Moto Park Kraków", city: "Kraków", voivodeship: "Małopolskie", lat: 50.032, lng: 19.945, kind: "KARTING" },
  { track: "Tor Tarnów", city: "Tarnów", voivodeship: "Małopolskie", lat: 50.012, lng: 20.986, kind: "KARTING" },
  { track: "Tor Nowy Sącz", city: "Nowy Sącz", voivodeship: "Małopolskie", lat: 49.617, lng: 20.715, kind: "OTHER" },
  { track: "Tor Nowy Targ", city: "Nowy Targ", voivodeship: "Małopolskie", lat: 49.478, lng: 20.032, kind: "AIRFIELD" },
  { track: "Baza Rajdowa Zakopane", city: "Zakopane", voivodeship: "Małopolskie", lat: 49.299, lng: 19.949, kind: "RALLY" },
  { track: "Baza Rajdowa Wisła", city: "Wisła", voivodeship: "Śląskie", lat: 49.647, lng: 18.859, kind: "RALLY" },
  { track: "Tor Oświęcim", city: "Oświęcim", voivodeship: "Małopolskie", lat: 50.034, lng: 19.238, kind: "OTHER" },
  { track: "Tor Wadowice", city: "Wadowice", voivodeship: "Małopolskie", lat: 49.883, lng: 19.492, kind: "OTHER" },

  // —— Śląskie ——
  { track: "Tor Katowice", city: "Katowice", voivodeship: "Śląskie", lat: 50.259, lng: 19.022, kind: "KARTING" },
  { track: "Stadion Śląski (imprezy moto)", city: "Chorzów", voivodeship: "Śląskie", lat: 50.288, lng: 18.964, kind: "EXPO" },
  { track: "Tor Tychy", city: "Tychy", voivodeship: "Śląskie", lat: 50.123, lng: 18.986, kind: "KARTING" },
  { track: "Tor Gliwice", city: "Gliwice", voivodeship: "Śląskie", lat: 50.294, lng: 18.671, kind: "KARTING" },
  { track: "Tor Zabrze", city: "Zabrze", voivodeship: "Śląskie", lat: 50.325, lng: 18.786, kind: "OTHER" },
  { track: "Tor Rybnik", city: "Rybnik", voivodeship: "Śląskie", lat: 50.102, lng: 18.546, kind: "SPEEDWAY" },
  { track: "Tor Sosnowiec", city: "Sosnowiec", voivodeship: "Śląskie", lat: 50.286, lng: 19.104, kind: "OTHER" },
  { track: "Tor Dąbrowa Górnicza", city: "Dąbrowa Górnicza", voivodeship: "Śląskie", lat: 50.322, lng: 19.187, kind: "OTHER" },
  { track: "Tor Bielsko-Biała", city: "Bielsko-Biała", voivodeship: "Śląskie", lat: 49.822, lng: 19.045, kind: "KARTING" },
  { track: "Tor Częstochowa", city: "Częstochowa", voivodeship: "Śląskie", lat: 50.812, lng: 19.120, kind: "KARTING" },
  { track: "Tor Pszczyna", city: "Pszczyna", voivodeship: "Śląskie", lat: 49.978, lng: 18.954, kind: "OTHER" },
  { track: "Tor Żory", city: "Żory", voivodeship: "Śląskie", lat: 50.045, lng: 18.694, kind: "OTHER" },
  { track: "Tor Jastrzębie-Zdrój", city: "Jastrzębie-Zdrój", voivodeship: "Śląskie", lat: 49.955, lng: 18.575, kind: "OTHER" },
  { track: "Baza Rajdowa Szczyrk", city: "Szczyrk", voivodeship: "Śląskie", lat: 49.718, lng: 19.027, kind: "RALLY" },

  // —— Opolskie ——
  { track: "Tor Opole", city: "Opole", voivodeship: "Opolskie", lat: 50.666, lng: 17.928, kind: "KARTING" },
  { track: "Tor Nysa", city: "Nysa", voivodeship: "Opolskie", lat: 50.474, lng: 17.334, kind: "OTHER" },
  { track: "Tor Racibórz", city: "Racibórz", voivodeship: "Śląskie", lat: 50.092, lng: 18.219, kind: "OTHER" },

  // —— Dolny Śląsk ——
  { track: "Tor Wrocław", city: "Wrocław", voivodeship: "Dolnośląskie", lat: 51.107, lng: 17.039, kind: "KARTING" },
  { track: "Tor Legnica", city: "Legnica", voivodeship: "Dolnośląskie", lat: 51.207, lng: 16.162, kind: "OTHER" },
  { track: "Tor Wałbrzych", city: "Wałbrzych", voivodeship: "Dolnośląskie", lat: 50.771, lng: 16.284, kind: "OTHER" },
  { track: "Tor Jelenia Góra", city: "Jelenia Góra", voivodeship: "Dolnośląskie", lat: 50.904, lng: 15.719, kind: "OTHER" },
  { track: "Baza Rajdowa Karpacz", city: "Karpacz", voivodeship: "Dolnośląskie", lat: 50.776, lng: 15.755, kind: "RALLY" },
  { track: "Baza Rajdowa Kłodzko", city: "Kłodzko", voivodeship: "Dolnośląskie", lat: 50.435, lng: 16.661, kind: "RALLY" },
  { track: "Tor Świdnica", city: "Świdnica", voivodeship: "Dolnośląskie", lat: 50.844, lng: 16.489, kind: "OTHER" },
  { track: "Tor Oleśnica", city: "Oleśnica", voivodeship: "Dolnośląskie", lat: 51.213, lng: 17.383, kind: "OTHER" },

  // —— Lubuskie ——
  { track: "Tor Zielona Góra", city: "Zielona Góra", voivodeship: "Lubuskie", lat: 51.935, lng: 15.506, kind: "SPEEDWAY" },
  { track: "Tor Gorzów Wielkopolski", city: "Gorzów Wielkopolski", voivodeship: "Lubuskie", lat: 52.737, lng: 15.229, kind: "SPEEDWAY" },
  { track: "Tor Żagań", city: "Żagań", voivodeship: "Lubuskie", lat: 51.617, lng: 15.315, kind: "OTHER" },
  { track: "Tor Nowa Sól", city: "Nowa Sól", voivodeship: "Lubuskie", lat: 51.803, lng: 15.717, kind: "OTHER" },
  { track: "Tor Świebodzin", city: "Świebodzin", voivodeship: "Lubuskie", lat: 52.247, lng: 15.534, kind: "OTHER" },

  // —— Łódzkie ——
  { track: "Tor Łódź", city: "Łódź", voivodeship: "Łódzkie", lat: 51.759, lng: 19.457, kind: "KARTING" },
  { track: "Tor Piotrków Trybunalski", city: "Piotrków Trybunalski", voivodeship: "Łódzkie", lat: 51.405, lng: 19.703, kind: "OTHER" },
  { track: "Tor Bełchatów", city: "Bełchatów", voivodeship: "Łódzkie", lat: 51.367, lng: 19.372, kind: "OTHER" },
  { track: "Tor Tomaszów Mazowiecki", city: "Tomaszów Mazowiecki", voivodeship: "Łódzkie", lat: 51.531, lng: 20.008, kind: "OTHER" },
  { track: "Tor Sieradz", city: "Sieradz", voivodeship: "Łódzkie", lat: 51.596, lng: 18.730, kind: "OTHER" },
  { track: "Tor Skierniewice", city: "Skierniewice", voivodeship: "Łódzkie", lat: 51.955, lng: 20.158, kind: "OTHER" },
  { track: "Tor Kutno", city: "Kutno", voivodeship: "Łódzkie", lat: 52.231, lng: 19.364, kind: "OTHER" },

  // —— Świętokrzyskie ——
  { track: "Tor Ostrowiec Świętokrzyski", city: "Ostrowiec Świętokrzyski", voivodeship: "Świętokrzyskie", lat: 50.929, lng: 21.385, kind: "OTHER" },
  { track: "Tor Starachowice", city: "Starachowice", voivodeship: "Świętokrzyskie", lat: 51.038, lng: 21.071, kind: "OTHER" },
  { track: "Tor Skarżysko-Kamienna", city: "Skarżysko-Kamienna", voivodeship: "Świętokrzyskie", lat: 51.113, lng: 20.848, kind: "OTHER" },
  { track: "Tor Sandomierz", city: "Sandomierz", voivodeship: "Świętokrzyskie", lat: 50.682, lng: 21.749, kind: "OTHER" },

  // —— przygraniczne (często używane przez kierowców z PL) ——
  {
    track: "Autodrom Most",
    city: "Most",
    voivodeship: "Dolnośląskie",
    lat: 50.5031,
    lng: 13.636,
    kind: "CIRCUIT",
  },
];

export const FILTER_CITIES = Array.from(new Set(TRACK_PRESETS.map((t) => t.city))).sort((a, b) =>
  a.localeCompare(b, "pl"),
);
