/**
 * Kuratorowana galeria awatarów użytkownika.
 *
 * Zamiast dowolnych URL-i od użytkownika (XSS / hotlink) — stałe ID presetów
 * z Dicebear (SVG). Pusty/null avatar w profilu = UI pokazuje inicjały (userInitials).
 *
 * Style Dicebear: avataaars, bottts, lorelei, notionists, shapes — różne seed-y
 * RacePortal* dają powtarzalne twarze/roboty bez lokalnych assetów.
 *
 * Pomysł (alt): własne pliki w /public/avatars lub upload do S3 z walidacją MIME;
 * albo Gravatar po hashu e-maila.
 */

export type AvatarPreset = {
  id: string;
  label: string;
  url: string;
};

/** Stabilne seedy Dicebear (bez URL-i wpisywanych przez użytkownika). */
export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: "racer",
    label: "Racer",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=RacePortalRacer&backgroundColor=ffdfbf",
  },
  {
    id: "pilot",
    label: "Pilot",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=RacePortalPilot&backgroundColor=c0aede",
  },
  {
    id: "mechanic",
    label: "Mechanik",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=RacePortalMechanic&backgroundColor=b6e3f4",
  },
  {
    id: "drift",
    label: "Drift",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=RacePortalDrift&backgroundColor=ffd5dc",
  },
  {
    id: "rally",
    label: "Rajd",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=RacePortalRally&backgroundColor=d1d4f9",
  },
  {
    id: "gt",
    label: "GT",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=RacePortalGT&backgroundColor=b6e3f4",
  },
  {
    id: "cup",
    label: "Cup",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=RacePortalCup&backgroundColor=ffdfbf",
  },
  {
    id: "night",
    label: "Night",
    url: "https://api.dicebear.com/7.x/lorelei/svg?seed=RacePortalNight&backgroundColor=c0aede",
  },
  {
    id: "grid",
    label: "Grid",
    url: "https://api.dicebear.com/7.x/lorelei/svg?seed=RacePortalGrid&backgroundColor=ffd5dc",
  },
  {
    id: "pace",
    label: "Pace",
    url: "https://api.dicebear.com/7.x/notionists/svg?seed=RacePortalPace&backgroundColor=d1d4f9",
  },
  {
    id: "crew",
    label: "Crew",
    url: "https://api.dicebear.com/7.x/notionists/svg?seed=RacePortalCrew&backgroundColor=b6e3f4",
  },
  {
    id: "flag",
    label: "Flag",
    url: "https://api.dicebear.com/7.x/shapes/svg?seed=RacePortalFlag&backgroundColor=ffdfbf",
  },
];

/** Szuka presetu po dokładnym URL (to zapisujemy w polu user.avatar). */
export function findAvatarPreset(url: string | null | undefined): AvatarPreset | undefined {
  if (!url) return undefined;
  return AVATAR_PRESETS.find((p) => p.url === url);
}

/**
 * Domyślny wyświetlany tekst: inicjały z imienia+nazwiska, inaczej 2 znaki imienia
 * lub username; brak danych → „?”.
 */
export function userInitials(user: {
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}): string {
  const first = user.firstName?.trim();
  const last = user.lastName?.trim();
  if (first && last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  }
  if (first && first.length >= 2) {
    return first.slice(0, 2).toUpperCase();
  }
  const u = user.username?.trim() || "?";
  return u.slice(0, Math.min(2, u.length)).toUpperCase();
}
