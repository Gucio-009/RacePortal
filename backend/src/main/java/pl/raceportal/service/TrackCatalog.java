package pl.raceportal.service;

/**
 * Statyczny katalog torów i miejsc eventowych w Polsce (seed {@link DataInitializer}).
 * Współrzędne przybliżone — pin na mapie.
 */
final class TrackCatalog {

    record Entry(String name, String city, String voivodeship, double lat, double lng, String kind) {}

    static final Entry[] ALL = {
            // duże / znane
            e("Tor Poznań", "Poznań", "Wielkopolskie", 52.3312, 16.8491, "CIRCUIT"),
            e("Autodrom Pomorze Pszczółki", "Pszczółki", "Pomorskie", 54.1985, 18.5986, "AUTODROM"),
            e("Tor Słomczyn", "Słomczyn", "Mazowieckie", 52.0376, 20.7589, "DRIFT"),
            e("Tor Kielce", "Kielce", "Świętokrzyskie", 50.8661, 20.6286, "CIRCUIT"),
            e("Tor Kamień Śląski", "Kamień Śląski", "Opolskie", 50.575, 18.083, "CIRCUIT"),
            e("Tor Ułęż", "Ułęż", "Lubelskie", 51.627, 22.108, "CIRCUIT"),
            e("Tor Modlin", "Nowy Dwór Mazowiecki", "Mazowieckie", 52.451, 20.651, "AIRFIELD"),
            e("Tor Jastrząb", "Jastrząb", "Mazowieckie", 51.248, 20.943, "CIRCUIT"),
            e("Tor Bednary", "Bednary", "Wielkopolskie", 52.353, 17.401, "KARTING"),
            e("Ośrodek Rajdowy Radom", "Radom", "Mazowieckie", 51.4027, 21.1471, "RALLY"),

            // Mazowsze
            e("Tor Bemowo", "Warszawa", "Mazowieckie", 52.259, 20.907, "OTHER"),
            e("Tor Służewiec", "Warszawa", "Mazowieckie", 52.164, 21.005, "OTHER"),
            e("PTAK Warsaw Expo", "Nadarzyn", "Mazowieckie", 52.070, 20.807, "EXPO"),
            e("Tor Legionowo", "Legionowo", "Mazowieckie", 52.401, 20.927, "KARTING"),
            e("Tor Pruszków", "Pruszków", "Mazowieckie", 52.167, 20.812, "KARTING"),
            e("Tor Piaseczno", "Piaseczno", "Mazowieckie", 52.073, 21.024, "KARTING"),
            e("Tor Otwock", "Otwock", "Mazowieckie", 52.105, 21.261, "OTHER"),
            e("Tor Mińsk Mazowiecki", "Mińsk Mazowiecki", "Mazowieckie", 52.179, 21.572, "OTHER"),
            e("Tor Siedlce", "Siedlce", "Mazowieckie", 52.168, 22.272, "KARTING"),
            e("Tor Płock", "Płock", "Mazowieckie", 52.547, 19.706, "KARTING"),
            e("Tor Ciechanów", "Ciechanów", "Mazowieckie", 52.881, 20.620, "OTHER"),
            e("Tor Ostrołęka", "Ostrołęka", "Mazowieckie", 53.086, 21.576, "OTHER"),
            e("Tor Radom (kartodrom)", "Radom", "Mazowieckie", 51.417, 21.156, "KARTING"),

            // Wielkopolska
            e("Tor Gostyń", "Gostyń", "Wielkopolskie", 51.882, 17.012, "KARTING"),
            e("Tor Ostrów Wielkopolski", "Ostrów Wielkopolski", "Wielkopolskie", 51.649, 17.817, "SPEEDWAY"),
            e("Tor Leszno", "Leszno", "Wielkopolskie", 51.843, 16.575, "SPEEDWAY"),
            e("Tor Gniezno", "Gniezno", "Wielkopolskie", 52.535, 17.598, "SPEEDWAY"),
            e("Tor Piła", "Piła", "Wielkopolskie", 53.151, 16.738, "KARTING"),
            e("Tor Konin", "Konin", "Wielkopolskie", 52.223, 18.251, "KARTING"),
            e("Tor Kalisz", "Kalisz", "Wielkopolskie", 51.761, 18.091, "KARTING"),
            e("Tor Września", "Września", "Wielkopolskie", 52.325, 17.565, "OTHER"),
            e("Tor Środa Wielkopolska", "Środa Wielkopolska", "Wielkopolskie", 52.229, 17.276, "OTHER"),

            // Pomorze
            e("Amber Karting Gdańsk", "Gdańsk", "Pomorskie", 54.378, 18.618, "KARTING"),
            e("Tor Gdynia Kosakowo", "Kosakowo", "Pomorskie", 54.580, 18.482, "AIRFIELD"),
            e("Tor Słupsk", "Słupsk", "Pomorskie", 54.464, 17.029, "KARTING"),
            e("Tor Chojnice", "Chojnice", "Pomorskie", 53.695, 17.557, "OTHER"),
            e("Tor Tczew", "Tczew", "Pomorskie", 54.092, 18.778, "OTHER"),
            e("Tor Malbork", "Malbork", "Pomorskie", 54.036, 19.028, "OTHER"),
            e("Tor Starogard Gdański", "Starogard Gdański", "Pomorskie", 53.964, 18.526, "OTHER"),

            // Zachodniopomorskie
            e("Tor Szczecin Dąbie", "Szczecin", "Zachodniopomorskie", 53.391, 14.665, "KARTING"),
            e("Tor Koszalin", "Koszalin", "Zachodniopomorskie", 54.194, 16.172, "KARTING"),
            e("Tor Kołobrzeg", "Kołobrzeg", "Zachodniopomorskie", 54.176, 15.576, "OTHER"),
            e("Tor Stargard", "Stargard", "Zachodniopomorskie", 53.336, 15.050, "OTHER"),
            e("Tor Wałcz", "Wałcz", "Zachodniopomorskie", 53.270, 16.471, "OTHER"),
            e("Tor Drawsko Pomorskie", "Drawsko Pomorskie", "Zachodniopomorskie", 53.531, 15.810, "OTHER"),

            // Kujawsko-Pomorskie
            e("Tor Myślęcinek", "Bydgoszcz", "Kujawsko-Pomorskie", 53.167, 18.038, "KARTING"),
            e("Motoarena Toruń", "Toruń", "Kujawsko-Pomorskie", 53.019, 18.587, "SPEEDWAY"),
            e("Tor Grudziądz", "Grudziądz", "Kujawsko-Pomorskie", 53.484, 18.754, "SPEEDWAY"),
            e("Tor Włocławek", "Włocławek", "Kujawsko-Pomorskie", 52.648, 19.068, "KARTING"),
            e("Tor Inowrocław", "Inowrocław", "Kujawsko-Pomorskie", 52.796, 18.264, "OTHER"),

            // Warmia-Mazury
            e("Tor Olsztyn", "Olsztyn", "Warmińsko-Mazurskie", 53.779, 20.480, "KARTING"),
            e("Baza Rajdowa Mikołajki", "Mikołajki", "Warmińsko-Mazurskie", 53.803, 21.570, "RALLY"),
            e("Tor Elbląg", "Elbląg", "Warmińsko-Mazurskie", 54.156, 19.405, "KARTING"),
            e("Tor Ostróda", "Ostróda", "Warmińsko-Mazurskie", 53.697, 19.965, "OTHER"),
            e("Tor Ełk", "Ełk", "Warmińsko-Mazurskie", 53.828, 22.365, "OTHER"),
            e("Tor Giżycko", "Giżycko", "Warmińsko-Mazurskie", 54.038, 21.759, "OTHER"),
            e("Tor Mrągowo", "Mrągowo", "Warmińsko-Mazurskie", 53.864, 21.305, "RALLY"),
            e("Tor Iława", "Iława", "Warmińsko-Mazurskie", 53.596, 19.569, "OTHER"),

            // Podlaskie
            e("Tor Białystok", "Białystok", "Podlaskie", 53.132, 23.169, "KARTING"),
            e("Tor Łomża", "Łomża", "Podlaskie", 53.178, 22.059, "OTHER"),
            e("Tor Suwałki", "Suwałki", "Podlaskie", 54.101, 22.931, "OTHER"),
            e("Tor Augustów", "Augustów", "Podlaskie", 53.843, 22.980, "OTHER"),

            // Lubelskie
            e("Tor Lublin", "Lublin", "Lubelskie", 51.247, 22.569, "KARTING"),
            e("Tor Puławy", "Puławy", "Lubelskie", 51.417, 21.969, "OTHER"),
            e("Tor Zamość", "Zamość", "Lubelskie", 50.723, 23.252, "OTHER"),
            e("Tor Chełm", "Chełm", "Lubelskie", 51.143, 23.471, "OTHER"),
            e("Tor Biała Podlaska", "Biała Podlaska", "Lubelskie", 52.033, 23.119, "OTHER"),
            e("Tor Świdnik", "Świdnik", "Lubelskie", 51.219, 22.696, "AIRFIELD"),

            // Podkarpackie
            e("Tor Rzeszów Jasionka", "Jasionka", "Podkarpackie", 50.110, 22.049, "AIRFIELD"),
            e("Tor Mielec", "Mielec", "Podkarpackie", 50.322, 21.436, "AIRFIELD"),
            e("Tor Krosno", "Krosno", "Podkarpackie", 49.687, 21.770, "AIRFIELD"),
            e("Tor Stalowa Wola", "Stalowa Wola", "Podkarpackie", 50.583, 22.053, "OTHER"),
            e("Tor Przemyśl", "Przemyśl", "Podkarpackie", 49.784, 22.767, "OTHER"),
            e("Baza Rajdowa Bieszczady", "Ustrzyki Dolne", "Podkarpackie", 49.430, 22.594, "RALLY"),

            // Małopolska
            e("Moto Park Kraków", "Kraków", "Małopolskie", 50.032, 19.945, "KARTING"),
            e("Tor Tarnów", "Tarnów", "Małopolskie", 50.012, 20.986, "KARTING"),
            e("Tor Nowy Sącz", "Nowy Sącz", "Małopolskie", 49.617, 20.715, "OTHER"),
            e("Tor Nowy Targ", "Nowy Targ", "Małopolskie", 49.478, 20.032, "AIRFIELD"),
            e("Baza Rajdowa Zakopane", "Zakopane", "Małopolskie", 49.299, 19.949, "RALLY"),
            e("Baza Rajdowa Wisła", "Wisła", "Śląskie", 49.647, 18.859, "RALLY"),
            e("Tor Oświęcim", "Oświęcim", "Małopolskie", 50.034, 19.238, "OTHER"),
            e("Tor Wadowice", "Wadowice", "Małopolskie", 49.883, 19.492, "OTHER"),

            // Śląskie
            e("Tor Katowice", "Katowice", "Śląskie", 50.259, 19.022, "KARTING"),
            e("Stadion Śląski (imprezy moto)", "Chorzów", "Śląskie", 50.288, 18.964, "EXPO"),
            e("Tor Tychy", "Tychy", "Śląskie", 50.123, 18.986, "KARTING"),
            e("Tor Gliwice", "Gliwice", "Śląskie", 50.294, 18.671, "KARTING"),
            e("Tor Zabrze", "Zabrze", "Śląskie", 50.325, 18.786, "OTHER"),
            e("Tor Rybnik", "Rybnik", "Śląskie", 50.102, 18.546, "SPEEDWAY"),
            e("Tor Sosnowiec", "Sosnowiec", "Śląskie", 50.286, 19.104, "OTHER"),
            e("Tor Dąbrowa Górnicza", "Dąbrowa Górnicza", "Śląskie", 50.322, 19.187, "OTHER"),
            e("Tor Bielsko-Biała", "Bielsko-Biała", "Śląskie", 49.822, 19.045, "KARTING"),
            e("Tor Częstochowa", "Częstochowa", "Śląskie", 50.812, 19.120, "KARTING"),
            e("Tor Pszczyna", "Pszczyna", "Śląskie", 49.978, 18.954, "OTHER"),
            e("Tor Żory", "Żory", "Śląskie", 50.045, 18.694, "OTHER"),
            e("Tor Jastrzębie-Zdrój", "Jastrzębie-Zdrój", "Śląskie", 49.955, 18.575, "OTHER"),
            e("Baza Rajdowa Szczyrk", "Szczyrk", "Śląskie", 49.718, 19.027, "RALLY"),

            // Opolskie
            e("Tor Opole", "Opole", "Opolskie", 50.666, 17.928, "KARTING"),
            e("Tor Nysa", "Nysa", "Opolskie", 50.474, 17.334, "OTHER"),
            e("Tor Racibórz", "Racibórz", "Śląskie", 50.092, 18.219, "OTHER"),

            // Dolny Śląsk
            e("Tor Wrocław", "Wrocław", "Dolnośląskie", 51.107, 17.039, "KARTING"),
            e("Tor Legnica", "Legnica", "Dolnośląskie", 51.207, 16.162, "OTHER"),
            e("Tor Wałbrzych", "Wałbrzych", "Dolnośląskie", 50.771, 16.284, "OTHER"),
            e("Tor Jelenia Góra", "Jelenia Góra", "Dolnośląskie", 50.904, 15.719, "OTHER"),
            e("Baza Rajdowa Karpacz", "Karpacz", "Dolnośląskie", 50.776, 15.755, "RALLY"),
            e("Baza Rajdowa Kłodzko", "Kłodzko", "Dolnośląskie", 50.435, 16.661, "RALLY"),
            e("Tor Świdnica", "Świdnica", "Dolnośląskie", 50.844, 16.489, "OTHER"),
            e("Tor Oleśnica", "Oleśnica", "Dolnośląskie", 51.213, 17.383, "OTHER"),

            // Lubuskie
            e("Tor Zielona Góra", "Zielona Góra", "Lubuskie", 51.935, 15.506, "SPEEDWAY"),
            e("Tor Gorzów Wielkopolski", "Gorzów Wielkopolski", "Lubuskie", 52.737, 15.229, "SPEEDWAY"),
            e("Tor Żagań", "Żagań", "Lubuskie", 51.617, 15.315, "OTHER"),
            e("Tor Nowa Sól", "Nowa Sól", "Lubuskie", 51.803, 15.717, "OTHER"),
            e("Tor Świebodzin", "Świebodzin", "Lubuskie", 52.247, 15.534, "OTHER"),

            // Łódzkie
            e("Tor Łódź", "Łódź", "Łódzkie", 51.759, 19.457, "KARTING"),
            e("Tor Piotrków Trybunalski", "Piotrków Trybunalski", "Łódzkie", 51.405, 19.703, "OTHER"),
            e("Tor Bełchatów", "Bełchatów", "Łódzkie", 51.367, 19.372, "OTHER"),
            e("Tor Tomaszów Mazowiecki", "Tomaszów Mazowiecki", "Łódzkie", 51.531, 20.008, "OTHER"),
            e("Tor Sieradz", "Sieradz", "Łódzkie", 51.596, 18.730, "OTHER"),
            e("Tor Skierniewice", "Skierniewice", "Łódzkie", 51.955, 20.158, "OTHER"),
            e("Tor Kutno", "Kutno", "Łódzkie", 52.231, 19.364, "OTHER"),

            // Świętokrzyskie
            e("Tor Ostrowiec Świętokrzyski", "Ostrowiec Świętokrzyski", "Świętokrzyskie", 50.929, 21.385, "OTHER"),
            e("Tor Starachowice", "Starachowice", "Świętokrzyskie", 51.038, 21.071, "OTHER"),
            e("Tor Skarżysko-Kamienna", "Skarżysko-Kamienna", "Świętokrzyskie", 51.113, 20.848, "OTHER"),
            e("Tor Sandomierz", "Sandomierz", "Świętokrzyskie", 50.682, 21.749, "OTHER"),

            // przygraniczne (często używane przez PL)
            e("Autodrom Most", "Most", "Dolnośląskie", 50.5031, 13.636, "CIRCUIT"),
    };

    private static Entry e(String name, String city, String voivodeship, double lat, double lng, String kind) {
        return new Entry(name, city, voivodeship, lat, lng, kind);
    }

    private TrackCatalog() {}
}
