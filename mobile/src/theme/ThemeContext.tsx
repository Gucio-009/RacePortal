/**
 * Motyw akcentu (gold / redline / ice / arctic / sand / blush) — lokalne ustawienia, bez API.
 * StyleSheet.create zamraża kolory, więc komponenty UI czytają accentColor w renderze.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const KEY = "raceportal_settings";

export type AccentName = "gold" | "redline" | "ice" | "arctic" | "sand" | "blush";

export const ACCENT_HEX: Record<AccentName, string> = {
  gold: "#FFD700",
  redline: "#FF3B3B",
  ice: "#7DD3FC",
  arctic: "#266CB3",
  sand: "#B78D54",
  blush: "#C56B89",
};

type ThemeContextValue = {
  accent: AccentName;
  accentColor: string;
  setAccent: (accent: AccentName) => void;
  reload: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

async function readAccent(): Promise<AccentName> {
  try {
    const raw =
      Platform.OS === "web" && typeof localStorage !== "undefined"
        ? localStorage.getItem(KEY)
        : await SecureStore.getItemAsync(KEY);
    if (!raw) return "gold";
    const parsed = JSON.parse(raw) as { accent?: string };
    if (parsed.accent && parsed.accent in ACCENT_HEX) {
      return parsed.accent as AccentName;
    }
  } catch {
    /* ignore */
  }
  return "gold";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState<AccentName>("gold");

  const reload = useCallback(async () => {
    setAccentState(await readAccent());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo(
    () => ({
      accent,
      accentColor: ACCENT_HEX[accent],
      setAccent: setAccentState,
      reload,
    }),
    [accent, reload],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
