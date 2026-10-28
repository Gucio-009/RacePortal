/**
 * Shell BO: sidebar + top bar (link do RacePortal + wyloguj).
 */
import { NavLink, Outlet } from "react-router";
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardList,
  Bug,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apexOrigin } from "./host";
import { Button } from "../components/ui/button";

const NAV = [
  { to: "/", end: true, label: "Hub", icon: LayoutDashboard },
  { to: "/wydarzenia", end: false, label: "Wydarzenia", icon: Calendar },
  { to: "/uzytkownicy", end: false, label: "Użytkownicy", icon: Users },
  { to: "/wnioski", end: false, label: "Wnioski org.", icon: ClipboardList },
  { to: "/bledy", end: false, label: "Błędy", icon: Bug },
] as const;

export function BoLayout() {
  const { user, logout } = useAuth();
  const apex = apexOrigin();

  return (
    <div className="min-h-screen flex bg-[var(--race-bg)] text-[var(--race-fg)]">
      <aside className="w-56 shrink-0 border-r border-[var(--race-border)] bg-[var(--race-card)] flex flex-col">
        <div className="px-4 py-5 border-b border-[var(--race-border)]">
          <p className="font-display text-sm tracking-[0.14em] text-[var(--race-accent)]" style={{ fontWeight: 800 }}>
            RACEPORTAL
          </p>
          <p className="text-xs text-[var(--race-muted)] mt-0.5">Backoffice</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-[var(--race-accent)] text-[var(--race-on-accent)]"
                    : "text-[var(--race-fg)] hover:bg-[var(--race-hover)]"
                }`
              }
              style={{ fontWeight: 600 }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-[var(--race-border)] text-xs text-[var(--race-muted)] truncate">
          {user?.username}
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 shrink-0 border-b border-[var(--race-border)] bg-[var(--race-card)] px-6 flex items-center justify-between gap-4">
          <p className="text-sm text-[var(--race-muted)] truncate">
            {user?.email} · <span className="text-[var(--race-accent)]">ADMIN</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-[var(--race-border)] text-[var(--race-fg)]"
              asChild
            >
              <a href={apex} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1.5" />
                RacePortal
              </a>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-[var(--race-border)] text-[var(--race-fg)]"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Wyloguj
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
