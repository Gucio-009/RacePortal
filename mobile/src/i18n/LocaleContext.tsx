/**
 * Locale PL/EN dla Expo — SecureStore / localStorage, słowniki z `@raceportal/i18n`.
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
import { Platform, Pressable, Text, View, StyleSheet } from "react-native";
import * as SecureStore from "expo-secure-store";
import {
  defaultLocale,
  normalizeLocale,
  translate,
  type Locale,
} from "@raceportal/i18n";
import { colors } from "../theme/colors";
import { useTheme } from "../theme/ThemeContext";

const KEY = "raceportal_locale";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

async function readLocale(): Promise<Locale> {
  try {
    const raw =
      Platform.OS === "web" && typeof localStorage !== "undefined"
        ? localStorage.getItem(KEY)
        : await SecureStore.getItemAsync(KEY);
    return normalizeLocale(raw);
  } catch {
    return defaultLocale;
  }
}

async function writeLocale(locale: Locale) {
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      localStorage.setItem(KEY, locale);
      return;
    }
    await SecureStore.setItemAsync(KEY, locale);
  } catch {
    /* ignore */
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    void readLocale().then(setLocaleState);
  }, []);

  const setLocale = useCallback(async (next: Locale) => {
    const normalized = normalizeLocale(next);
    setLocaleState(normalized);
    await writeLocale(normalized);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

/** Kompaktowy przełącznik PL | EN. */
export function LanguageToggle() {
  const { locale, setLocale } = useLocale();
  const { accentColor } = useTheme();
  return (
    <View style={styles.row}>
      {(["pl", "en"] as Locale[]).map((code) => {
        const active = locale === code;
        return (
          <Pressable
            key={code}
            onPress={() => void setLocale(code)}
            style={[
              styles.btn,
              active ? { backgroundColor: accentColor } : { borderColor: colors.border, borderWidth: 1 },
            ]}
          >
            <Text style={[styles.btnText, active ? { color: "#121212" } : { color: colors.muted }]}>
              {code.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", borderRadius: 8, overflow: "hidden", gap: 0 },
  btn: { paddingHorizontal: 10, paddingVertical: 6 },
  btnText: { fontWeight: "800", fontSize: 11, letterSpacing: 0.5 },
});
