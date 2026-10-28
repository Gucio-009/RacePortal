/**
 * Segmentowy przełącznik PL | EN — minimalistyczny, bez glow.
 * Widoczny bez logowania; zapis lokalny + opcjonalnie PATCH /me.
 */
import { useTranslation } from "react-i18next";
import { normalizeLocale, type Locale } from "@raceportal/i18n";
import { setAppLocale } from "../i18n";
import {
  applyUserSettings,
  loadSettings,
  persistSettings,
} from "../lib/userSettings";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

type Props = {
  className?: string;
  compact?: boolean;
};

export function LanguageSwitcher({ className = "", compact = false }: Props) {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, setUserLocale } = useAuth();
  const current = normalizeLocale(i18n.language);

  const apply = async (locale: Locale) => {
    if (locale === current) return;
    setAppLocale(locale);
    const next = { ...loadSettings(), locale };
    persistSettings(next);
    applyUserSettings(next);
    if (isAuthenticated) {
      try {
        const updated = await api.patch<{ locale?: string }>("/api/auth/me", { locale });
        setUserLocale(normalizeLocale(updated.locale ?? locale));
      } catch {
        /* lokalny wybór zostaje nawet gdy API padnie */
      }
    }
  };

  return (
    <div
      className={`lang-switch ${compact ? "lang-switch--compact" : ""} ${className}`.trim()}
      role="group"
      aria-label={t("lang.language")}
    >
      <div className="lang-switch__track">
        {(["pl", "en"] as Locale[]).map((code) => {
          const active = current === code;
          return (
            <button
              key={code}
              type="button"
              aria-pressed={active}
              aria-label={code === "pl" ? t("lang.plFull") : t("lang.enFull")}
              title={code === "pl" ? t("lang.plFull") : t("lang.enFull")}
              onClick={() => void apply(code)}
              className={`lang-switch__btn ${active ? "is-active" : ""}`}
            >
              {code.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
