/**
 * data/events.ts — lokalne mocki / seed UI (wydarzenia, wyniki, galeria).
 *
 * Historycznie: dane demo przed pełnym API. Część stron może nadal importować
 * `events` / `results` / `gallery` jako fallback lub content marketingowy.
 * Produkcyjna lista eventów idzie z backendu (`/api/events`) — typy w lib/types (ApiEvent).
 *
 * Statusy tu są po polsku (`Potwierdzone`…) — inne niż enum API (PUBLISHED / …).
 *
 * Pomysł (alt): usunąć po pełnej migracji na API; albo przenieść do Storybook fixtures.
 */

export interface RaceEvent {
  id: number;
  image: string;
  date: string;
  dateIso: string;
  track: string;
  name: string;
  category: string;
  city: string;
  voivodeship: string;
  time: string;
  description: string;
  status: "Potwierdzone" | "Oczekujące" | "Zakończone";
}

export interface RaceResult {
  id: number;
  date: string;
  track: string;
  name: string;
  category: string;
  winner: string;
  podium: [string, string, string];
  image: string;
}

export interface GalleryItem {
  id: number;
  image: string;
  title: string;
  event: string;
  date: string;
  category: string;
}

export const events: RaceEvent[] = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1638909469623-4fdd7758414b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    date: "28 KWIETNIA 2026",
    dateIso: "2026-04-28",
    track: "Tor Poznań",
    name: "Mistrzostwa Polski Wyścigów Samochodowych",
    category: "MPWS",
    city: "Poznań",
    voivodeship: "Wielkopolskie",
    time: "15:00",
    description:
      "Główna runda Mistrzostw Polski Wyścigów Samochodowych. Sprinty kwalifikacyjne i wyścig główny na torze Poznań — pełna obsada klas Touring i GT.",
    status: "Potwierdzone",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1617130644016-d318045a3958?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    date: "5 MAJA 2026",
    dateIso: "2026-05-05",
    track: "Autodrom Pomorze Pszczółki",
    name: "Puchar Polski GT Racing",
    category: "GT Racing",
    city: "Pszczółki",
    voivodeship: "Pomorskie",
    time: "14:00",
    description:
      "Puchar Polski dla samochodów GT. Dwie sesje kwalifikacyjne oraz wyścig na dystansie 45 minut z obowiązkowym pitstopem.",
    status: "Oczekujące",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1638909486348-82ae8d57dfd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    date: "12 MAJA 2026",
    dateIso: "2026-05-12",
    track: "Tor Słomczyn",
    name: "Drift Masters Polish Grand Prix",
    category: "Drift",
    city: "Słomczyn",
    voivodeship: "Mazowieckie",
    time: "16:00",
    description:
      "Polska runda Drift Masters. Battle 1v1, strefy oceny i freestyle show po finale. Wstęp dla kibiców od południa.",
    status: "Potwierdzone",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1752449096739-83ac1ef2c0dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    date: "19 MAJA 2026",
    dateIso: "2026-05-19",
    track: "Autodrom Most",
    name: "Poland Racing Festival",
    category: "Racing",
    city: "Most",
    voivodeship: "Dolnośląskie",
    time: "13:00",
    description:
      "Festiwal wyścigowy z wieloma klasami: touring, historic i open. Strefa paddock open oraz pokazowe przejazdy legend.",
    status: "Potwierdzone",
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1664911200744-8c3a496baa2a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    date: "26 MAJA 2026",
    dateIso: "2026-05-26",
    track: "Tor Kamień Śląski",
    name: "Śląski Wyścig Długodystansowy",
    category: "Endurance",
    city: "Kamień Śląski",
    voivodeship: "Opolskie",
    time: "12:00",
    description:
      "4-godzinny endurance z wymianami kierowców. Strategia pitstopów decyduje o wyniku — klasyfikacja generalna i amatorska.",
    status: "Potwierdzone",
  },
  {
    id: 6,
    image: "https://images.unsplash.com/photo-1617130627248-0bf361f6556a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    date: "2 CZERWCA 2026",
    dateIso: "2026-06-02",
    track: "Tor Ułęż",
    name: "Mazowieckie Mistrzostwa Trackday",
    category: "Track Day",
    city: "Ułęż",
    voivodeship: "Lubelskie",
    time: "10:00",
    description:
      "Track day z sesjami open pitlane oraz opcjonalnymi pomiarami czasu. Idealny start dla kierowców amatorów.",
    status: "Oczekujące",
  },
];

export const results: RaceResult[] = [
  {
    id: 1,
    date: "14 KWIETNIA 2026",
    track: "Tor Kamień Śląski",
    name: "Śląski Wyścig Długodystansowy",
    category: "Endurance",
    winner: "Team Aurora",
    podium: ["Team Aurora", "BlackFlag Racing", "Tormenta GT"],
    image: "https://images.unsplash.com/photo-1664911200744-8c3a496baa2a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    id: 2,
    date: "7 KWIETNIA 2026",
    track: "Autodrom Most",
    name: "Poland Racing Festival",
    category: "Racing",
    winner: "Nova Speed",
    podium: ["Nova Speed", "Team Aurora", "Redline PL"],
    image: "https://images.unsplash.com/photo-1638909486348-82ae8d57dfd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    id: 3,
    date: "31 MARCA 2026",
    track: "Tor Ułęż",
    name: "Mazowieckie Sprint Challenge",
    category: "Track Day",
    winner: "Redline PL",
    podium: ["Redline PL", "DriftLab", "Nova Speed"],
    image: "https://images.unsplash.com/photo-1617130644016-d318045a3958?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    id: 4,
    date: "24 MARCA 2026",
    track: "Tor Słomczyn",
    name: "Warszawski Drift Classic",
    category: "Drift",
    winner: "DriftLab",
    podium: ["DriftLab", "Sideways Crew", "SmokeHouse"],
    image: "https://images.unsplash.com/photo-1617130627248-0bf361f6556a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
];

export const gallery: GalleryItem[] = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1638909469623-4fdd7758414b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title: "Start grida MPWS",
    event: "Mistrzostwa Polski Wyścigów Samochodowych",
    date: "2025",
    category: "MPWS",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1617130644016-d318045a3958?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title: "GT w pełnym gazie",
    event: "Puchar Polski GT Racing",
    date: "2025",
    category: "GT Racing",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1638909486348-82ae8d57dfd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title: "Drift battle",
    event: "Drift Masters Polish Grand Prix",
    date: "2025",
    category: "Drift",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1752449096739-83ac1ef2c0dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title: "Paddock festivalu",
    event: "Poland Racing Festival",
    date: "2025",
    category: "Racing",
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1664911200744-8c3a496baa2a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title: "Nocny pitstop",
    event: "Śląski Wyścig Długodystansowy",
    date: "2025",
    category: "Endurance",
  },
  {
    id: 6,
    image: "https://images.unsplash.com/photo-1617130627248-0bf361f6556a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title: "Track day open",
    event: "Mazowieckie Mistrzostwa Trackday",
    date: "2025",
    category: "Track Day",
  },
  {
    id: 7,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title: "Widok z trybun",
    event: "Poland Racing Festival",
    date: "2025",
    category: "Racing",
  },
  {
    id: 8,
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title: "Detal maszyny",
    event: "Puchar Polski GT Racing",
    date: "2025",
    category: "GT Racing",
  },
];

/** Lookup mocka po id — legacy; preferuj API dla żywych danych. */
export function getEventById(id: number) {
  return events.find((event) => event.id === id);
}
