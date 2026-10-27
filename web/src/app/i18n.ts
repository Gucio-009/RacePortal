/**
 * Init i18next — słowniki z `@raceportal/i18n`, locale z localStorage (`raceportal_settings`).
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { defaultLocale, messages, normalizeLocale, type Locale } from "@raceportal/i18n";
import { loadSettings } from "./lib/userSettings";

const initial = normalizeLocale(loadSettings().locale);

void i18n.use(initReactI18next).init({
  resources: {
    pl: { translation: messages.pl },
    en: { translation: messages.en },
  },
  lng: initial,
  fallbackLng: defaultLocale,
  interpolation: { escapeValue: false },
  returnNull: false,
});

export function setAppLocale(locale: Locale) {
  const next = normalizeLocale(locale);
  if (i18n.language !== next) {
    void i18n.changeLanguage(next);
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = next;
  }
}

export function getAppLocale(): Locale {
  return normalizeLocale(i18n.language);
}

export default i18n;
