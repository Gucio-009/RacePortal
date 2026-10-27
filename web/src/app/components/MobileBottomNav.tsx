/**
 * MobileBottomNav — dolna belka jak w natywnej apce (tylko < md).
 * Publiczne: Start / Wydarzenia / Archiwum / Konto|Login.
 * Zalogowany USER: + Garaż zamiast Archiwum w środku (max 4–5 pozycji).
 */
import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { Flag, CalendarDays, Archive, Car, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { StableI18nLabel } from "./StableI18nLabel";

const itemClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[48px] py-1.5 text-[10px] font-bold tracking-wide transition-colors ${
    isActive ? "text-[var(--race-accent)]" : "text-[var(--race-muted)]"
  }`;

export function MobileBottomNav() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const isUser = user?.role === "USER";

  return (
    <nav
      aria-label={t("nav.mobileNav")}
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-[var(--race-border)] bg-[var(--race-card)]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-stretch max-w-lg mx-auto px-1">
        <NavLink to="/" end className={itemClass}>
          <Flag className="w-5 h-5" aria-hidden />
          <StableI18nLabel i18nKey="nav.home" />
        </NavLink>
        <NavLink to="/wydarzenia" className={itemClass}>
          <CalendarDays className="w-5 h-5" aria-hidden />
          <StableI18nLabel i18nKey="nav.eventsShort" />
        </NavLink>
        {isAuthenticated && isUser ? (
          <NavLink to="/garaz" className={itemClass}>
            <Car className="w-5 h-5" aria-hidden />
            <StableI18nLabel i18nKey="nav.garage" />
          </NavLink>
        ) : (
          <NavLink to="/archiwum" className={itemClass}>
            <Archive className="w-5 h-5" aria-hidden />
            <StableI18nLabel i18nKey="nav.archive" />
          </NavLink>
        )}
        {isAuthenticated ? (
          <NavLink to="/dashboard" className={itemClass}>
            <UserRound className="w-5 h-5" aria-hidden />
            <StableI18nLabel i18nKey="nav.account" />
          </NavLink>
        ) : (
          <NavLink to="/login" className={itemClass}>
            <UserRound className="w-5 h-5" aria-hidden />
            <StableI18nLabel i18nKey="nav.login" />
          </NavLink>
        )}
      </div>
    </nav>
  );
}
