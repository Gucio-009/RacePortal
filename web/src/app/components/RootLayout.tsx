import { Outlet, Link, useNavigate, NavLink } from "react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Flag,
  User,
  LogOut,
  Car,
  Shield,
  LayoutDashboard,
  Settings,
  ChevronDown,
  KeyRound,
} from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { userInitials } from "../lib/types";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `${isActive ? "text-[#FFD700]" : "text-[#9ca3af] hover:text-[#FFD700]"} transition-colors text-sm md:text-base`;

function roleLabel(role?: string) {
  if (role === "ADMIN") return "Administrator";
  if (role === "ORGANIZER") return "Organizator";
  return "Kierowca";
}

export function RootLayout() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const go = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    toast.success("Wylogowano", { description: "Do zobaczenia na torze 🏁" });
    confetti({
      particleCount: 60,
      spread: 50,
      origin: { y: 0.2, x: 0.9 },
      colors: ["#FFD700", "#ffffff", "#9ca3af"],
    });
    navigate("/");
  };

  const isUser = user?.role === "USER";
  const isOrganizer = user?.role === "ORGANIZER" || user?.role === "ADMIN";
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="min-h-screen bg-[#121212]">
      <header className="border-b border-[#2a2a2a] bg-[#1a1a1a] sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <Flag className="w-8 h-8 text-[#FFD700]" />
            <span className="font-['Orbitron'] tracking-wider" style={{ fontSize: "24px", fontWeight: 800 }}>
              RACEPORTAL
            </span>
          </Link>

          <div className="flex items-center gap-3 md:gap-5 flex-wrap justify-end max-w-[calc(100%-180px)]">
            <NavLink to="/wydarzenia" className={navLinkClass} style={{ fontWeight: 600 }}>
              WYDARZENIA
            </NavLink>
            <NavLink to="/archiwum" className={navLinkClass} style={{ fontWeight: 600 }}>
              ARCHIWUM
            </NavLink>
            <NavLink to="/galeria" className={navLinkClass} style={{ fontWeight: 600 }} title="Galeria odłożona na późniejszy etap">
              GALERIA <span className="text-[#9ca3af] text-[10px]">(później)</span>
            </NavLink>
            <NavLink to="/wydarzenia" className={navLinkClass} style={{ fontWeight: 600 }}>
              MAPA
            </NavLink>

            {isAuthenticated && isUser && (
              <>
                <NavLink to="/garaz" className={navLinkClass} style={{ fontWeight: 600 }}>
                  GARAŻ
                </NavLink>
                <NavLink to="/zostan-organizatorem" className={navLinkClass} style={{ fontWeight: 600 }}>
                  ZOSTAŃ ORG.
                </NavLink>
              </>
            )}

            {isAuthenticated && isOrganizer && (
              <NavLink to="/organizer" className={navLinkClass} style={{ fontWeight: 600 }}>
                PANEL ORG.
              </NavLink>
            )}

            {isAuthenticated && isAdmin && (
              <NavLink to="/admin" className={navLinkClass} style={{ fontWeight: 600 }}>
                ADMIN
              </NavLink>
            )}

            {isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <Button
                  type="button"
                  variant="ghost"
                  aria-label="Menu konta"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 hover:bg-[#2a2a2a] text-white border border-[#2a2a2a] rounded-full pl-1 pr-3 py-1 h-auto"
                >
                  <Avatar className="w-8 h-8 border-2 border-[#FFD700]">
                    <AvatarImage src={user?.avatar ?? undefined} alt={user?.username} />
                    <AvatarFallback className="bg-[#FFD700] text-[#121212]" style={{ fontWeight: 800 }}>
                      {userInitials(user ?? {})}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline max-w-[120px] truncate" style={{ fontWeight: 600 }}>
                    {user?.username}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#FFD700] shrink-0 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                  />
                </Button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-64 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] text-white shadow-xl z-[200] overflow-hidden"
                  >
                    <div className="px-3 py-3 border-b border-[#2a2a2a]">
                      <div className="text-white font-semibold truncate">{user?.username}</div>
                      <div className="text-[#9ca3af] text-xs truncate">{user?.email}</div>
                      <div className="text-[#FFD700] text-xs mt-1 tracking-wide">{roleLabel(user?.role)}</div>
                    </div>

                    <button
                      type="button"
                      role="menuitem"
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[#2a2a2a] hover:text-[#FFD700]"
                      onClick={() => go("/dashboard")}
                    >
                      <User className="h-4 w-4 text-[#FFD700]" />
                      Moje konto
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[#2a2a2a] hover:text-[#FFD700]"
                      onClick={() => go("/konto")}
                    >
                      <KeyRound className="h-4 w-4 text-[#FFD700]" />
                      Dane konta (email / hasło)
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[#2a2a2a] hover:text-[#FFD700]"
                      onClick={() => go("/ustawienia")}
                    >
                      <Settings className="h-4 w-4 text-[#FFD700]" />
                      Ustawienia
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[#2a2a2a] hover:text-[#FFD700]"
                      onClick={() => go("/garaz")}
                    >
                      <Car className="h-4 w-4 text-[#FFD700]" />
                      Garaż
                    </button>
                    {isOrganizer && (
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[#2a2a2a] hover:text-[#FFD700]"
                        onClick={() => go("/organizer")}
                      >
                        <LayoutDashboard className="h-4 w-4 text-[#FFD700]" />
                        Panel organizatora
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[#2a2a2a] hover:text-[#FFD700]"
                        onClick={() => go("/admin")}
                      >
                        <Shield className="h-4 w-4 text-[#FFD700]" />
                        Panel admina
                      </button>
                    )}

                    <div className="border-t border-[#2a2a2a]" />
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[#ff8a8a] hover:bg-[#2a2a2a] hover:text-[#ff6b6b]"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Wyloguj
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login">
                <Button className="bg-[#FFD700] text-[#121212] hover:bg-[#ffd700]/90" style={{ fontWeight: 700 }}>
                  ZALOGUJ SIĘ
                </Button>
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-[#2a2a2a] bg-[#1a1a1a] mt-20">
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[#9ca3af]">
          <p>© 2026 RACEPORTAL. Wszystkie prawa zastrzeżone.</p>
          <div className="flex flex-wrap gap-4 justify-center" style={{ fontSize: "14px" }}>
            <Link to="/terms" className="hover:text-[#FFD700]">
              Regulamin
            </Link>
            <Link to="/privacy" className="hover:text-[#FFD700]">
              Polityka prywatności
            </Link>
            <Link to="/wydarzenia" className="hover:text-[#FFD700]">
              Wydarzenia
            </Link>
            <Link to="/archiwum" className="hover:text-[#FFD700]">
              Archiwum
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
