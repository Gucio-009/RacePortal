/**
 * Logowanie BO — email/hasło + Google. Bez rejestracji. Tylko ADMIN przechodzi dalej.
 */
import { useCallback, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { Flag, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { GoogleSignInButton, isGoogleClientConfigured } from "../components/GoogleSignInButton";
import { apexOrigin } from "./host";

export function BoLoginPage() {
  const { login, loginWithGoogle, logout, isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const googleEnabled = isGoogleClientConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await login(email, password);
      if (!result.ok) {
        toast.error(result.message || "Nieprawidłowy email lub hasło");
        return;
      }
      toast.success("Zalogowano");
      navigate("/", { replace: true });
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = useCallback(
    async (idToken: string) => {
      setBusy(true);
      try {
        const result = await loginWithGoogle(idToken);
        if (!result.ok) {
          toast.error(result.message || "Nie udało się zalogować przez Google");
          return;
        }
        toast.success("Zalogowano przez Google");
        navigate("/", { replace: true });
      } finally {
        setBusy(false);
      }
    },
    [loginWithGoogle, navigate],
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--race-bg)] text-[var(--race-muted)]">
        Ładowanie…
      </div>
    );
  }

  if (isAuthenticated && user?.role === "ADMIN") {
    return <Navigate to="/" replace />;
  }

  if (isAuthenticated && user && user.role !== "ADMIN") {
    logout();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--race-bg)]">
      <div className="w-full max-w-md border border-[var(--race-border)] bg-[var(--race-card)] rounded-lg p-8 shadow-[var(--race-card-shadow)]">
        <div className="text-center mb-8">
          <Flag className="w-12 h-12 text-[var(--race-accent)] mx-auto mb-3" />
          <h1 className="font-display text-[var(--race-fg)] text-2xl" style={{ fontWeight: 800 }}>
            Backoffice
          </h1>
          <p className="text-sm text-[var(--race-muted)] mt-2">
            Tylko konta ADMIN z RacePortal. Brak rejestracji.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bo-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--race-muted)]" />
              <Input
                id="bo-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-[var(--race-bg)] border-[var(--race-border)]"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bo-password">Hasło</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--race-muted)]" />
              <Input
                id="bo-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-[var(--race-bg)] border-[var(--race-border)]"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--race-muted)]"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="w-full h-11 bg-[var(--race-accent)] text-[var(--race-on-accent)]"
            style={{ fontWeight: 700 }}
          >
            {busy ? "Logowanie…" : "Zaloguj"}
          </Button>
        </form>

        {googleEnabled && (
          <>
            <div className="flex items-center gap-3 my-6">
              <Separator className="flex-1" />
              <span className="text-xs text-[var(--race-muted)]">lub</span>
              <Separator className="flex-1" />
            </div>
            <GoogleSignInButton
              disabled={busy}
              label="Kontynuuj z Google"
              onCredential={handleGoogle}
              onError={(msg) => toast.error(msg)}
            />
          </>
        )}

        <p className="text-center text-xs text-[var(--race-muted)] mt-8">
          <a href={apexOrigin()} className="text-[var(--race-accent)] underline">
            Wróć do RacePortal
          </a>
        </p>
      </div>
    </div>
  );
}
