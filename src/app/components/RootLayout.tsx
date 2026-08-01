import { Outlet, Link, useNavigate, NavLink } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Flag, User, LogOut, Car, Shield, LayoutDashboard } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `${isActive ? "text-[#FFD700]" : "text-[#9ca3af] hover:text-[#FFD700]"} transition-colors text-sm md:text-base`;

export function RootLayout() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 hover:bg-[#2a2a2a]">
                    <Avatar className="w-8 h-8 border-2 border-[#FFD700]">
                      <AvatarImage src={user?.avatar ?? undefined} alt={user?.username} />
                      <AvatarFallback className="bg-[#FFD700] text-[#121212]">
                        {user?.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-white hidden sm:inline" style={{ fontWeight: 600 }}>
                      {user?.username}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-[#1a1a1a] border-[#2a2a2a]">
                  <DropdownMenuItem
                    onClick={() => navigate("/dashboard")}
                    className="cursor-pointer hover:bg-[#2a2a2a] focus:bg-[#2a2a2a]"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Mój Profil
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/garaz")}
                    className="cursor-pointer hover:bg-[#2a2a2a] focus:bg-[#2a2a2a]"
                  >
                    <Car className="mr-2 h-4 w-4" />
                    Garaż
                  </DropdownMenuItem>
                  {isOrganizer && (
                    <DropdownMenuItem
                      onClick={() => navigate("/organizer")}
                      className="cursor-pointer hover:bg-[#2a2a2a] focus:bg-[#2a2a2a]"
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Panel organizatora
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem
                      onClick={() => navigate("/admin")}
                      className="cursor-pointer hover:bg-[#2a2a2a] focus:bg-[#2a2a2a]"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Panel admina
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer hover:bg-[#2a2a2a] focus:bg-[#2a2a2a]"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Wyloguj się
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
