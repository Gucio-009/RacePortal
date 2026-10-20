/**
 * Lokalne preferencje UI (localStorage) + zastosowanie CSS vars na <html>.
 * Wspólne dla SettingsPage i bootstrapu w App.
 */
export type AccentTheme = "gold" | "redline" | "ice";

export type UserSettings = {
  emailAlerts: boolean;
  startReminders: boolean;
  soundFx: boolean;
  pitStopMode: boolean;
  accent: AccentTheme;
  teamFlair: string;
};

export const STORAGE_KEY = "raceportal_settings";

export const ACCENTS: Record<AccentTheme, { label: string; color: string; desc: string }> = {
  gold: { label: "Złoty tor", color: "#FFD700", desc: "Klasyczny look RACEPORTAL" },
  redline: { label: "Redline", color: "#FF3B3B", desc: "Agresywny akcent wyścigowy" },
  ice: { label: "Ice cold", color: "#7DD3FC", desc: "Chłodny, nocny pit-lane" },
};

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
    if (raw) return { ...defaultSettings(), ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return defaultSettings();
}

/** Stosuje akcent / pit-stop do documentElement (CSS vars + data-*). */
export function applyUserSettings(settings: UserSettings) {
  const accent = ACCENTS[settings.accent]?.color ?? "#FFD700";
  const root = document.documentElement;
  root.style.setProperty("--race-accent", accent);
  root.dataset.accent = settings.accent;
  root.dataset.pitStop = settings.pitStopMode ? "on" : "off";
  if (settings.pitStopMode) {
    root.style.setProperty("--race-motion", "0.01ms");
  } else {
    root.style.removeProperty("--race-motion");
  }
}
