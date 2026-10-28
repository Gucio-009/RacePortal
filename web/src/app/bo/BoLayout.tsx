/**
 * Shell BO: sidebar + top bar (link do RacePortal + wyloguj).
 * Badge’e w nawigacji pokazują kolejkę wymagającą akceptacji / otwarte bugi.
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
import { useBoQueue } from "./BoQueueContext";
import { Button } from "../components/ui/button";
import { NotificationBell } from "../components/NotificationBell";

const NAV = [
  { to: "/", end: true, label: "Hub", icon: LayoutDashboard, badgeKey: "hub" as const },
  { to: "/wydarzenia", end: false, label: "Wydarzenia", icon: Calendar, badgeKey: "pendingEvents" as const },
  { to: "/uzytkownicy", end: false, label: "Użytkownicy", icon: Users, badgeKey: null },
  { to: "/wnioski", end: false, label: "Wnioski org.", icon: ClipboardList, badgeKey: "pendingApps" as const },
  { to: "/bledy", end: false, label: "Błędy", icon: Bug, badgeKey: "openBugs" as const },
] as const;

function NavBadge({ count, active }: { count: number; active: boolean }) {
  if (count <= 0) return null;
  return (
    <span
      className={`ml-auto min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] flex items-center justify-center tabular-nums ${
        active
          ? "bg-[var(--race-on-accent)] text-[var(--race-accent)]"
          : "bg-[var(--race-accent)] text-[var(--race-on-accent)]"
      }`}
      style={{ fontWeight: 800 }}
      aria-label={`${count} do obsługi`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function BoLayout() {
  const { user, logout } = useAuth();
  const apex = apexOrigin();
  const { counts } = useBoQueue();
  const hubTotal = counts.pendingEvents + counts.pendingApps + counts.openBugs;

  const badgeFor = (key: (typeof NAV)[number]["badgeKey"]) => {
    if (key === "hub") return hubTotal;
    if (key === "pendingEvents") return counts.pendingEvents;
    if (key === "pendingApps") return counts.pendingApps;
    if (key === "openBugs") return counts.openBugs;
    return 0;
  };

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
          {NAV.map(({ to, end, label, icon: Icon, badgeKey }) => (
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
              {({ isActive }) => (
                <>
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{label}</span>
                  <NavBadge count={badgeFor(badgeKey)} active={isActive} />
                </>
              )}
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
            {hubTotal > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-[var(--race-accent)]/15 text-[var(--race-accent)] px-2 py-0.5 text-xs" style={{ fontWeight: 700 }}>
                {hubTotal} do akcji
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <NotificationBell />
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
