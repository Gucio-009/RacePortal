import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, Eye, EyeOff, Flag } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { toast } from "sonner";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, socialLogin } = useAuth();
  const navigate = useNavigate();

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

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    if (!import.meta.env.DEV) {
      toast.error("Logowanie Google/Facebook będzie dostępne wkrótce");
      return;
    }
    setIsLoading(true);
    try {
      await socialLogin(provider);
      toast.success("Zalogowano kontem demo (tryb deweloperski)");
      navigate("/dashboard");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nie udało się zalogować");
    } finally {
      setIsLoading(false);
    }
  };

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
            <Flag className="w-16 h-16 text-[#FFD700]" />
          </div>
          <h1
            className="font-['Orbitron'] text-white mb-2"
            style={{ fontSize: '36px', fontWeight: 900 }}
          >
            WITAJ Z <span className="text-[#FFD700]">POWROTEM</span>
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
                  className="pl-10 bg-[#121212] border-[#2a2a2a] text-white focus:border-[#FFD700] h-12"
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
                  className="pl-10 pr-10 bg-[#121212] border-[#2a2a2a] text-white focus:border-[#FFD700] h-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#FFD700]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-[#FFD700] hover:underline"
                style={{ fontSize: '14px', fontWeight: 600 }}
              >
                Nie pamiętasz hasła?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#FFD700] text-[#121212] hover:bg-[#ffd700]/90 h-12"
              style={{ fontSize: '16px', fontWeight: 800 }}
            >
              {isLoading ? "LOGOWANIE..." : "ZALOGUJ SIĘ"}
            </Button>
          </form>

          <div className="relative my-6">
            <Separator className="bg-[#2a2a2a]" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1a1a1a] px-4 text-[#9ca3af]" style={{ fontSize: '14px' }}>
              lub
            </span>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLogin("google")}
              disabled={isLoading}
              className="w-full border-[#2a2a2a] text-white hover:bg-[#2a2a2a] h-12"
              style={{ fontWeight: 600 }}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Kontynuuj z Google
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLogin("facebook")}
              disabled={isLoading}
              className="w-full border-[#2a2a2a] text-white hover:bg-[#2a2a2a] h-12"
              style={{ fontWeight: 600 }}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Kontynuuj z Facebook
            </Button>
          </div>

          <div className="mt-6 text-center space-y-3">
            <p className="text-[#9ca3af]">
              Nie masz konta?{" "}
              <Link to="/register" className="text-[#FFD700] hover:underline" style={{ fontWeight: 700 }}>
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
