/**
 * RootLayout — szkielet SPA: sticky header + `<Outlet />` + footer.
 *
 * Desktop (md+): pełna top-nav.
 * Mobile: kompaktowy header + `MobileBottomNav` (PWA / telefon).
 *
 * React Router: layout route w `routes.tsx` (`Component: RootLayout`);
 * dzieci (HomePage, EventsPage, …) renderują się w `<Outlet />`.
 * NavLink podświetla aktywny link kolorem `--race-accent` (theme.css / ustawienia).
 *
 * Auth: `useAuth()` — JWT w localStorage (`raceportal_token`); menu konta i linki
 * zależą od roli USER / ORGANIZER / ADMIN.
 *
 * Docker/nginx: deep linki (`/wydarzenia/123`) obsługuje SPA fallback — ten layout
 * ładuje się zawsze po wejściu w dowolną ścieżkę frontendową.
 *
 * Pomysł (alt): osobny layout dla paneli org/admin albo sidebar zamiast top-nav.
 */

import { Outlet, Link, useNavigate, NavLink } from "react-router";
import { Suspense, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useScrollReveal } from "../hooks/useScrollReveal";
import {
  Flag,
  User,
  LogOut,
  Shield,
  LayoutDashboard,
  Settings,
  ChevronDown,
  KeyRound,
  Menu,
  X,
  Archive,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { toast } from "sonner";
import { userInitials } from "../lib/types";
import { NotificationBell } from "./NotificationBell";
import { BugReportButton } from "./BugReportButton";
import { MobileBottomNav } from "./MobileBottomNav";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { StableI18nLabel } from "./StableI18nLabel";

/** Klasa NavLink: aktywny = `--race-accent`, nieaktywny = szary z hoverem. */
const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `${isActive ? "text-[var(--race-accent)]" : "text-[var(--race-muted)] hover:text-[var(--race-accent)]"} transition-colors text-sm md:text-base shrink-0`;

export function RootLayout() {
  const { t } = useTranslation();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  useScrollReveal(mainRef);

  const roleLabel = (role?: string) => {
    if (role === "ADMIN") return t("roles.ADMIN");
    if (role === "ORGANIZER") return t("roles.ORGANIZER");
    return t("roles.USER");
  };

  // Zamykanie menu konta: klik poza + Escape (bez zewnętrznej biblioteki popover).
  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  const go = (path: string) => {
    setMenuOpen(false);
    setMoreOpen(false);
    navigate(path);
  };

  /** Wylogowanie: czyści JWT (AuthContext) + toast + confetti (lazy) w kolorze akcentu. */
  const handleLogout = () => {
    setMenuOpen(false);
    setMoreOpen(false);
    logout();
    toast.success(t("auth.logoutOk"), { description: t("auth.logoutDesc") });
    void import("canvas-confetti").then(({ default: confetti }) => {
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.2, x: 0.9 },
        colors: [
          getComputedStyle(document.documentElement).getPropertyValue("--race-accent").trim() || "#FFD700",
          "#ffffff",
          "#9ca3af",
        ],
      });
    });
    navigate("/");
  };

  const isUser = user?.role === "USER";
  const isOrganizer = user?.role === "ORGANIZER" || user?.role === "ADMIN";
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="min-h-dvh min-w-[360px] bg-[var(--race-bg)] flex flex-col">
      <header className="border-b border-[var(--race-border)] bg-[var(--race-card)]/95 backdrop-blur-md sticky top-0 z-50 pt-[env(safe-area-inset-top)]">
        <nav className="container mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-3">
          {/* Brand: font-display = Oxanium (--font-family-display w theme.css) */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <Flag className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--race-accent)] shrink-0" />
            <span className="font-display tracking-wider text-lg sm:text-2xl font-extrabold truncate text-[var(--race-fg)]">
              RACEPORTAL
            </span>
          </Link>

          {/* Prawa strona: linki (md+) + jeden bell + konto / hamburger */}
          <div className="flex items-center gap-2 sm:gap-4 justify-end min-w-0 shrink-0">
            <div className="hidden md:flex items-center gap-5 flex-nowrap justify-end">
              <NavLink to="/wydarzenia" className={navLinkClass} style={{ fontWeight: 600 }}>
                <StableI18nLabel i18nKey="nav.events" />
              </NavLink>
              <NavLink to="/archiwum" className={navLinkClass} style={{ fontWeight: 600 }}>
                <StableI18nLabel i18nKey="nav.archive" />
              </NavLink>

              {isAuthenticated && isUser && (
                <NavLink to="/garaz" className={navLinkClass} style={{ fontWeight: 600 }}>
                  <StableI18nLabel i18nKey="nav.garage" />
                </NavLink>
              )}

              {isAuthenticated && isOrganizer && (
                <NavLink to="/organizer" className={navLinkClass} style={{ fontWeight: 600 }}>
                  <StableI18nLabel i18nKey="nav.organizerPanel" />
                </NavLink>
              )}

              {isAuthenticated && isAdmin && (
                <NavLink to="/admin" className={navLinkClass} style={{ fontWeight: 600 }}>
                  <StableI18nLabel i18nKey="nav.admin" />
                </NavLink>
              )}
            </div>

            <LanguageSwitcher className="shrink-0" compact />

            {/* Jeden mount — wcześniej desktop+mobile = 2× /api/notifications */}
            {isAuthenticated && <NotificationBell />}

            <div className="hidden md:block shrink-0">
              {isAuthenticated ? (
                <div className="relative" ref={menuRef}>
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label={t("nav.accountMenu")}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((v) => !v)}
                    className="flex items-center gap-2 hover:bg-[var(--race-hover)] text-[var(--race-fg)] border border-[var(--race-border)] rounded-full pl-1 pr-3 py-1 h-auto"
                  >
                    <Avatar className="w-8 h-8 border-2 border-[var(--race-accent)]">
                      <AvatarImage src={user?.avatar ?? undefined} alt={user?.username} />
                      <AvatarFallback className="bg-[var(--race-accent)] text-[var(--race-on-accent)]" style={{ fontWeight: 800 }}>
                        {userInitials(user ?? {})}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline max-w-[120px] truncate" style={{ fontWeight: 600 }}>
                      {user?.username}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[var(--race-accent)] shrink-0 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                    />
                  </Button>

                  {menuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-64 rounded-lg border border-[var(--race-border)] bg-[var(--race-card)] text-[var(--race-fg)] shadow-xl z-[200] overflow-hidden"
                    >
                      <div className="px-3 py-3 border-b border-[var(--race-border)]">
                        <div className="text-[var(--race-fg)] font-semibold truncate">{user?.username}</div>
                        <div className="text-[var(--race-muted)] text-xs truncate">{user?.email}</div>
                        <div className="text-[var(--race-accent)] text-xs mt-1 tracking-wide">{roleLabel(user?.role)}</div>
                      </div>

                      <button
                        type="button"
                        role="menuitem"
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[var(--race-hover)] hover:text-[var(--race-accent)]"
                        onClick={() => go("/dashboard")}
                      >
                        <User className="h-4 w-4 text-[var(--race-accent)]" />
                        {t("nav.myAccount")}
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[var(--race-hover)] hover:text-[var(--race-accent)]"
                        onClick={() => go("/konto")}
                      >
                        <KeyRound className="h-4 w-4 text-[var(--race-accent)]" />
                        {t("nav.accountData")}
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[var(--race-hover)] hover:text-[var(--race-accent)]"
                        onClick={() => go("/ustawienia")}
                      >
                        <Settings className="h-4 w-4 text-[var(--race-accent)]" />
                        {t("nav.settings")}
                      </button>
                      {isUser && (
                        <button
                          type="button"
                          role="menuitem"
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[var(--race-hover)] hover:text-[var(--race-accent)]"
                          onClick={() => go("/zostan-organizatorem")}
                        >
                          <Flag className="h-4 w-4 text-[var(--race-accent)]" />
                          {t("nav.becomeOrganizer")}
                        </button>
                      )}
                      {isOrganizer && (
                        <button
                          type="button"
                          role="menuitem"
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[var(--race-hover)] hover:text-[var(--race-accent)]"
                          onClick={() => go("/organizer")}
                        >
                          <LayoutDashboard className="h-4 w-4 text-[var(--race-accent)]" />
                          {t("nav.organizerPanelFull")}
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          type="button"
                          role="menuitem"
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[var(--race-hover)] hover:text-[var(--race-accent)]"
                          onClick={() => go("/admin")}
                        >
                          <Shield className="h-4 w-4 text-[var(--race-accent)]" />
                          {t("nav.adminPanelFull")}
                        </button>
                      )}

                      <div className="border-t border-[var(--race-border)]" />
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[#ff8a8a] hover:bg-[var(--race-hover)] hover:text-[#ff6b6b]"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4" />
                        {t("nav.logout")}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login">
                  <Button className="bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95" style={{ fontWeight: 700 }}>
                    <StableI18nLabel i18nKey="nav.login" />
                  </Button>
                </Link>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={moreOpen ? t("nav.closeMenu") : t("nav.more")}
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((v) => !v)}
              className="md:hidden text-[var(--race-fg)] hover:bg-[var(--race-hover)] h-10 w-10"
            >
              {moreOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </nav>

        {/* Mobile slide-down: linki drugorzędne */}
        {moreOpen && (
          <div className="md:hidden border-t border-[var(--race-border)] bg-[var(--race-card)] px-3 py-3 space-y-1 animate-in fade-in slide-in-from-top-2">
            {isAuthenticated && (
              <div className="flex items-center gap-3 px-2 py-2 mb-1 border-b border-[var(--race-border)]">
                <Avatar className="w-9 h-9 border-2 border-[var(--race-accent)]">
                  <AvatarImage src={user?.avatar ?? undefined} alt={user?.username} />
                  <AvatarFallback className="bg-[var(--race-accent)] text-[var(--race-on-accent)] font-extrabold">
                    {userInitials(user ?? {})}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-[var(--race-fg)] font-semibold truncate text-sm">{user?.username}</div>
                  <div className="text-[var(--race-accent)] text-xs">{roleLabel(user?.role)}</div>
                </div>
              </div>
            )}
            <div className="px-2 pb-2">
              <LanguageSwitcher />
            </div>
            <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-[var(--race-fg)] hover:bg-[var(--race-hover)]" onClick={() => go("/archiwum")}>
              <Archive className="w-4 h-4 text-[var(--race-accent)]" /> {t("nav.archive")}
            </button>
            {isUser && (
              <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-[var(--race-fg)] hover:bg-[var(--race-hover)]" onClick={() => go("/zostan-organizatorem")}>
                <Flag className="w-4 h-4 text-[var(--race-accent)]" /> {t("nav.becomeOrganizer")}
              </button>
            )}
            {isOrganizer && (
              <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-[var(--race-fg)] hover:bg-[var(--race-hover)]" onClick={() => go("/organizer")}>
                <LayoutDashboard className="w-4 h-4 text-[var(--race-accent)]" /> {t("nav.organizerPanelFull")}
              </button>
            )}
            {isAdmin && (
              <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-[var(--race-fg)] hover:bg-[var(--race-hover)]" onClick={() => go("/admin")}>
                <Shield className="w-4 h-4 text-[var(--race-accent)]" /> {t("nav.adminPanelFull")}
              </button>
            )}
            {isAuthenticated && (
              <>
                <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-[var(--race-fg)] hover:bg-[var(--race-hover)]" onClick={() => go("/ustawienia")}>
                  <Settings className="w-4 h-4 text-[var(--race-accent)]" /> {t("nav.settings")}
                </button>
                <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-[var(--race-fg)] hover:bg-[var(--race-hover)]" onClick={() => go("/konto")}>
                  <KeyRound className="w-4 h-4 text-[var(--race-accent)]" /> {t("nav.accountData")}
                </button>
                <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-[#ff8a8a] hover:bg-[var(--race-hover)]" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" /> {t("nav.logout")}
                </button>
              </>
            )}
            {!isAuthenticated && (
              <button
                type="button"
                className="w-full mt-2 py-3 rounded-lg bg-[var(--race-accent)] text-[var(--race-on-accent)] font-extrabold"
                onClick={() => go("/register")}
              >
                {t("auth.register")}
              </button>
            )}
          </div>
        )}
      </header>

      {/* Główna treść — Suspense dla lazy() stron (poza Home) */}
      <main ref={mainRef} className="flex-1 pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">
        <Suspense
          fallback={
            <div className="min-h-[40vh] flex items-center justify-center text-[var(--race-muted)]">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--race-accent)]" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>

      <footer className="hidden md:block border-t border-[var(--race-border)] bg-[var(--race-card)] mt-20">
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[var(--race-muted)] md:pr-40">
          <p>© 2026 RACEPORTAL. {t("footer.tagline")}</p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-end" style={{ fontSize: "14px" }}>
            <Link to="/terms" className="hover:text-[var(--race-accent)]">
              {t("footer.terms")}
            </Link>
            <Link to="/privacy" className="hover:text-[var(--race-accent)]">
              {t("footer.privacy")}
            </Link>
          </div>
        </div>
      </footer>

      <BugReportButton />
      <MobileBottomNav />
    </div>
  );
}
