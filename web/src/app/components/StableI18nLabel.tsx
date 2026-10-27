/**
 * Etykieta i18n o stałej szerokości = max(PL, EN).
 * Zapobiega skokom layoutu w headerze przy zmianie języka.
 */
import { useTranslation } from "react-i18next";

type Props = {
  i18nKey: string;
  className?: string;
};

export function StableI18nLabel({ i18nKey, className = "" }: Props) {
  const { t } = useTranslation();
  return (
    <span className={`relative inline-grid place-items-center ${className}`}>
      <span
        className="invisible col-start-1 row-start-1 whitespace-nowrap pointer-events-none select-none"
        aria-hidden
      >
        {t(i18nKey, { lng: "pl" })}
      </span>
      <span
        className="invisible col-start-1 row-start-1 whitespace-nowrap pointer-events-none select-none"
        aria-hidden
      >
        {t(i18nKey, { lng: "en" })}
      </span>
      <span className="col-start-1 row-start-1 whitespace-nowrap">{t(i18nKey)}</span>
    </span>
  );
}
