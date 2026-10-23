/**
 * Lokalne preferencje UI (localStorage) + zastosowanie CSS vars na <html>.
 * Wspólne dla SettingsPage i bootstrapu w App.
 *
 * Wzorzec: Złoty tor (gold) – ciemne tło + żółty akcent. Redline/Ice zmieniają tylko
 * `--race-accent`. Motywy jasne (arctic, sand, blush) nadpisują powierzchnie
 * (`html[data-accent]`). Układ stron i Scroll Reveal są wspólne.
 */
export type AccentTheme = "gold" | "redline" | "ice" | "arctic" | "sand" | "blush";

export type UserSettings = {
  emailAlerts: boolean;
  startReminders: boolean;
  soundFx: boolean;
  pitStopMode: boolean;
  accent: AccentTheme;
  teamFlair: string;
};

export const STORAGE_KEY = "raceportal_settings";

export const ACCENTS: Record<
  AccentTheme,
  { label: string; color: string; desc: string; mode: "dark" | "light"; surface: string }
> = {
  gold: { label: "Złoty tor", color: "#FFD700", desc: "Żółto-złoty", mode: "dark", surface: "#121212" },
  redline: { label: "Redline", color: "#FF3B3B", desc: "Czerwony", mode: "dark", surface: "#121212" },
  ice: { label: "Ice cold", color: "#7DD3FC", desc: "Błękitny", mode: "dark", surface: "#121212" },
  arctic: { label: "Arctic White", color: "#266CB3", desc: "Niebieski", mode: "light", surface: "#F3F6FA" },
  sand: { label: "Desert Sand", color: "#B78D54", desc: "Piaskowo-złoty", mode: "light", surface: "#F7F3EB" },
  blush: { label: "Blush Pink", color: "#C56B89", desc: "Pudroworóżowy", mode: "light", surface: "#FFF5F7" },
};

export const ACCENT_GROUPS: { title: string; keys: AccentTheme[] }[] = [
  { title: "Tryb ciemny", keys: ["gold", "redline", "ice"] },
  { title: "Tryb jasny", keys: ["arctic", "sand", "blush"] },
];

export function isLightAccent(accent: AccentTheme): boolean {
  return ACCENTS[accent].mode === "light";
}

const ACCENT_KEYS = new Set<string>(Object.keys(ACCENTS));

export function defaultSettings(): UserSettings {
  return {
    emailAlerts: true,
    startReminders: true,
    soundFx: false,
    pitStopMode: false,
    accent: "gold",
    teamFlair: "",
  };
}

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = { ...defaultSettings(), ...JSON.parse(raw) } as UserSettings;
      if (!ACCENT_KEYS.has(parsed.accent)) parsed.accent = "gold";
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return defaultSettings();
}

/** Stosuje akcent / pit-stop do documentElement (CSS vars + data-*). */
export function applyUserSettings(settings: UserSettings) {
  const key = ACCENT_KEYS.has(settings.accent) ? settings.accent : "gold";
  const accent = ACCENTS[key]?.color ?? "#FFD700";
  const root = document.documentElement;
  root.style.setProperty("--race-accent", accent);
  root.dataset.accent = key;
  root.dataset.pitStop = settings.pitStopMode ? "on" : "off";
  if (settings.pitStopMode) {
    root.style.setProperty("--race-motion", "0.01ms");
  } else {
    root.style.removeProperty("--race-motion");
  }
  const light = isLightAccent(key);
  root.style.colorScheme = light ? "light" : "dark";
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute("content", ACCENTS[key].surface);
  const metaScheme = document.querySelector('meta[name="color-scheme"]');
  if (metaScheme) metaScheme.setAttribute("content", light ? "light" : "dark");
}
