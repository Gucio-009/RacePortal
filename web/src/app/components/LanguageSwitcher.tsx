/**
 * Przełącznik PL | EN — widoczny bez logowania; zapis lokalny + opcjonalnie PATCH /me.
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
      className={`inline-flex items-center rounded-md border border-[var(--race-border)] overflow-hidden text-xs font-bold tracking-wide ${className}`}
      role="group"
      aria-label={t("lang.language")}
    >
      {(["pl", "en"] as Locale[]).map((code) => {
        const active = current === code;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            onClick={() => void apply(code)}
            className={`px-2 py-1.5 transition-colors ${
              active
                ? "bg-[var(--race-accent)] text-[var(--race-on-accent)]"
                : "bg-transparent text-[var(--race-muted)] hover:text-[var(--race-fg)] hover:bg-[var(--race-hover)]"
            } ${compact ? "min-w-[2rem]" : "min-w-[2.25rem]"}`}
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
