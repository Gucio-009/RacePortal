/**
 * LoginPage – formularz logowania email/hasło + opcjonalnie Google OAuth.
 *
 * Cel: wejście użytkownika do konta; po sukcesie redirect na `/dashboard`.
 * Wzorce: React Router (`useNavigate`, `Link`), AuthContext (`login`, `loginWithGoogle`),
 * toast (sonner), kontrolowany formularz.
 * Auth/JWT: AuthContext po sukcesie zapisuje JWT w localStorage pod `raceportal_token`
 * (TOKEN_KEY w lib/api.ts) i dołącza go do kolejnych requestów API.
 * Google: przycisk widoczny tylko gdy `isGoogleClientConfigured()` (VITE client id);
 * idToken z GIS → backend wymienia na własny JWT.
 * Theme: `--race-accent`, `font-display` (Oxanium) w nagłówku.
 * Docker/nginx: deep link `/login` wymaga fallback SPA (try_files → index.html).
 *
 * Pomysł (alt): Next.js Auth.js / Better Auth; TanStack Form; osobna strona OAuth callback.
 */
import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, Eye, EyeOff, Flag } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { toast } from "sonner";
import { GoogleSignInButton, isGoogleClientConfigured } from "../components/GoogleSignInButton";
import { setPendingVerifyEmail } from "../lib/pendingVerifyEmail";
import { HERO_BG_TRACK } from "../lib/types";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  // Google GIS tylko gdy skonfigurowany client id w env.
  const googleEnabled = isGoogleClientConfigured();

  /** Logowanie hasłem → JWT w AuthContext → dashboard. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.ok) {
        toast.success("Zalogowano pomyślnie!");
        navigate("/dashboard");
      } else {
        const msg = result.message || "Nieprawidłowy email lub hasło";
        toast.error(msg);
        // Konto istnieje, ale bez aktywacji – wróć do ponownej wysyłki linku.
        if (/weryfikuj|zweryfikuj|kod|link|aktyw/i.test(msg) && email.includes("@")) {
          setPendingVerifyEmail(email);
          navigate(`/register?verify=1&email=${encodeURIComponent(email.trim().toLowerCase())}`);
        }
      }
    } catch (error) {
      toast.error("Wystąpił błąd podczas logowania");
    } finally {
      setIsLoading(false);
    }
  };

  /** Credential Google (idToken) → AuthContext.loginWithGoogle → ten sam JWT flow. */
  const handleGoogle = useCallback(
    async (idToken: string) => {
      setIsLoading(true);
      try {
        const result = await loginWithGoogle(idToken);
        if (result.ok) {
          toast.success("Zalogowano przez Google");
          navigate("/dashboard");
        } else {
          toast.error(result.message || "Nie udało się zalogować przez Google");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [loginWithGoogle, navigate],
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(rgba(18, 18, 18, 0.9), rgba(18, 18, 18, 0.9)), url('${HERO_BG_TRACK}')`,
      }}
    >
      <div className="w-full max-w-md" data-reveal="">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Flag className="w-16 h-16 text-[var(--race-accent)]" />
          </div>
          <h1
            className="font-display text-white mb-2"
            style={{ fontSize: '36px', fontWeight: 800 }}
          >
            WITAJ Z <span className="text-[var(--race-accent)]">POWROTEM</span>
          </h1>
          <p className="text-[#9ca3af]" style={{ fontSize: '16px' }}>
            Zaloguj się do swojego konta
          </p>
        </div>

        <div className="bg-[var(--race-card)] border border-[var(--race-border)] rounded-lg p-8 shadow-[var(--race-card-shadow)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[var(--race-fg)]" style={{ fontWeight: 600 }}>
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--race-muted)]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="twoj@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)] focus:border-[var(--race-accent)] h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[var(--race-fg)]" style={{ fontWeight: 600 }}>
                Hasło
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--race-muted)]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)] focus:border-[var(--race-accent)] h-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--race-muted)] hover:text-[var(--race-accent)]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-[var(--race-accent)] hover:underline"
                style={{ fontSize: '14px', fontWeight: 600 }}
              >
                Nie pamiętasz hasła?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95 h-12"
              style={{ fontSize: '16px', fontWeight: 800 }}
            >
              {isLoading ? "LOGOWANIE..." : "ZALOGUJ SIĘ"}
            </Button>
          </form>

          {googleEnabled ? (
            <>
              <div className="relative my-6">
                <Separator className="bg-[var(--race-muted-bg)]" />
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--race-card)] px-4 text-[var(--race-muted)]" style={{ fontSize: '14px' }}>
                  lub
                </span>
              </div>
              <GoogleSignInButton
                onCredential={handleGoogle}
                onError={(msg) => toast.error(msg)}
                disabled={isLoading}
              />
            </>
          ) : null}

          <div className="mt-6 text-center space-y-3">
            <p className="text-[var(--race-muted)]">
              Nie dostałeś linku aktywacyjnego?{" "}
              <Link
                to={
                  email.trim()
                    ? `/register?verify=1&email=${encodeURIComponent(email.trim().toLowerCase())}`
                    : "/register?verify=1"
                }
                className="text-[var(--race-accent)] hover:underline"
                style={{ fontWeight: 700 }}
                onClick={() => {
                  if (email.includes("@")) setPendingVerifyEmail(email);
                }}
              >
                Wyślij ponownie
              </Link>
            </p>
            <p className="text-[var(--race-muted)]">
              Nie masz konta?{" "}
              <Link to="/register" className="text-[var(--race-accent)] hover:underline" style={{ fontWeight: 700 }}>
                Zarejestruj się
              </Link>
            </p>
            <p className="text-[#6b7280] text-xs">
              {import.meta.env.DEV
                ? "DEV – demo: test@wp.pl / test123 · admin@raceportal.pl / admin123 · org@raceportal.pl / org123"
                : null}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
