import { Outlet, Link, useNavigate, NavLink } from "react-router";
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
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { toast } from "sonner";
import confetti from "canvas-confetti";

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

  const handleLogout = () => {
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
            <NavLink to="/galeria" className={navLinkClass} style={{ fontWeight: 600 }}>
              GALERIA
            </NavLink>
            <NavLink to="/mapa" className={navLinkClass} style={{ fontWeight: 600 }}>
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
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label="Menu konta"
                    className="flex items-center gap-2 hover:bg-[#2a2a2a] text-white border border-[#2a2a2a] rounded-full pl-1 pr-3 py-1 h-auto"
                  >
                    <Avatar className="w-8 h-8 border-2 border-[#FFD700]">
                      <AvatarImage src={user?.avatar ?? undefined} alt={user?.username} />
                      <AvatarFallback className="bg-[#FFD700] text-[#121212]">
                        {user?.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline max-w-[120px] truncate" style={{ fontWeight: 600 }}>
                      {user?.username}
                    </span>
                    <ChevronDown className="w-4 h-4 text-[#FFD700] shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-64 bg-[#1a1a1a] border-[#2a2a2a] text-white z-[100] shadow-xl"
                >
                  <DropdownMenuLabel className="px-3 py-3">
                    <div className="text-white font-semibold truncate">{user?.username}</div>
                    <div className="text-[#9ca3af] text-xs truncate font-normal">{user?.email}</div>
                    <div className="text-[#FFD700] text-xs mt-1 font-normal tracking-wide">
                      {roleLabel(user?.role)}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                  <DropdownMenuItem
                    onSelect={() => navigate("/dashboard")}
                    className="cursor-pointer text-white focus:bg-[#2a2a2a] focus:text-[#FFD700]"
                  >
                    <User className="mr-2 h-4 w-4 text-[#FFD700]" />
                    Moje konto
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => navigate("/ustawienia")}
                    className="cursor-pointer text-white focus:bg-[#2a2a2a] focus:text-[#FFD700]"
                  >
                    <Settings className="mr-2 h-4 w-4 text-[#FFD700]" />
                    Ustawienia
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => navigate("/garaz")}
                    className="cursor-pointer text-white focus:bg-[#2a2a2a] focus:text-[#FFD700]"
                  >
                    <Car className="mr-2 h-4 w-4 text-[#FFD700]" />
                    Garaż
                  </DropdownMenuItem>
                  {isOrganizer && (
                    <DropdownMenuItem
                      onSelect={() => navigate("/organizer")}
                      className="cursor-pointer text-white focus:bg-[#2a2a2a] focus:text-[#FFD700]"
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4 text-[#FFD700]" />
                      Panel organizatora
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem
                      onSelect={() => navigate("/admin")}
                      className="cursor-pointer text-white focus:bg-[#2a2a2a] focus:text-[#FFD700]"
                    >
                      <Shield className="mr-2 h-4 w-4 text-[#FFD700]" />
                      Panel admina
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                  <DropdownMenuItem
                    onSelect={handleLogout}
                    className="cursor-pointer text-[#ff8a8a] focus:bg-[#2a2a2a] focus:text-[#ff6b6b]"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Wyloguj
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
