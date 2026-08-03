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

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const googleEnabled = isGoogleClientConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.ok) {
        toast.success("Zalogowano pomyślnie!");
        navigate("/dashboard");
      } else {
        toast.error(result.message || "Nieprawidłowy email lub hasło");
      }
    } catch (error) {
      toast.error("Wystąpił błąd podczas logowania");
    } finally {
      setIsLoading(false);
    }
  };

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
        backgroundImage: `linear-gradient(rgba(18, 18, 18, 0.9), rgba(18, 18, 18, 0.9)), url('https://images.unsplash.com/photo-1617130644016-d318045a3958?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920')`,
      }}
    >
      <div className="w-full max-w-md">
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

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white" style={{ fontWeight: 600 }}>
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="twoj@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-[#121212] border-[#2a2a2a] text-white focus:border-[var(--race-accent)] h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white" style={{ fontWeight: 600 }}>
                Hasło
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-[#121212] border-[#2a2a2a] text-white focus:border-[var(--race-accent)] h-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[var(--race-accent)]"
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
              className="w-full bg-[var(--race-accent)] text-[#121212] hover:brightness-95 h-12"
              style={{ fontSize: '16px', fontWeight: 800 }}
            >
              {isLoading ? "LOGOWANIE..." : "ZALOGUJ SIĘ"}
            </Button>
          </form>

          {googleEnabled ? (
            <>
              <div className="relative my-6">
                <Separator className="bg-[#2a2a2a]" />
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1a1a1a] px-4 text-[#9ca3af]" style={{ fontSize: '14px' }}>
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
            <p className="text-[#9ca3af]">
              Nie masz konta?{" "}
              <Link to="/register" className="text-[var(--race-accent)] hover:underline" style={{ fontWeight: 700 }}>
                Zarejestruj się
              </Link>
            </p>
            <p className="text-[#6b7280] text-xs">
              {import.meta.env.DEV
                ? "DEV — demo: test@wp.pl / test123 · admin@raceportal.pl / admin123 · org@raceportal.pl / org123"
                : null}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
