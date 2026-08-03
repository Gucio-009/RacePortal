/** Curated avatar gallery — pick by id; empty/null avatar means UI initials. */

export type AvatarPreset = {
  id: string;
  label: string;
  url: string;
};

/** Stable Dicebear seeds (no user-typed URLs). */
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

export function findAvatarPreset(url: string | null | undefined): AvatarPreset | undefined {
  if (!url) return undefined;
  return AVATAR_PRESETS.find((p) => p.url === url);
}

/** Default display: initials from name or username (when avatar is empty). */
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
