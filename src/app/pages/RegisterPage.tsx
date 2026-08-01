import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Lock, Eye, EyeOff, Flag, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Separator } from "../components/ui/separator";
import { toast } from "sonner";

export function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, socialLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Hasła nie są identyczne");
      return;
    }

    if (!acceptTerms) {
      toast.error("Musisz zaakceptować regulamin");
      return;
    }

    if (password.length < 6) {
      toast.error("Hasło musi mieć minimum 6 znaków");
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(username, email, password);
      if (result.ok) {
        toast.success("Konto utworzone pomyślnie!");
        navigate("/dashboard");
      } else {
        toast.error(result.message || "Nie udało się utworzyć konta");
      }
    } catch (error) {
      toast.error("Wystąpił błąd podczas rejestracji");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialRegister = async (provider: "google" | "facebook") => {
    if (!acceptTerms) {
      toast.error("Zaakceptuj regulamin przed kontynuacją");
      return;
    }
    setIsLoading(true);
    try {
      await socialLogin(provider);
      toast.success(`Konto utworzone przez ${provider === "google" ? "Google" : "Facebook"}`);
      navigate("/dashboard");
    } catch {
      toast.error("Nie udało się zarejestrować");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(rgba(18, 18, 18, 0.9), rgba(18, 18, 18, 0.9)), url('https://images.unsplash.com/photo-1638909469623-4fdd7758414b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920')`,
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
            DOŁĄCZ DO <span className="text-[#FFD700]">ZESPOŁU</span>
          </h1>
          <p className="text-[#9ca3af]" style={{ fontSize: '16px' }}>
            Stwórz konto i rozpocznij wyścig
          </p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white" style={{ fontWeight: 600 }}>
                Nazwa użytkownika
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                <Input
                  id="username"
                  type="text"
                  placeholder="twoja_nazwa"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-[#121212] border-[#2a2a2a] text-white focus:border-[#FFD700] h-12"
                  required
                />
              </div>
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white" style={{ fontWeight: 600 }}>
                Powtórz hasło
              </Label>
              <div className="relative">
                <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 bg-[#121212] border-[#2a2a2a] text-white focus:border-[#FFD700] h-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#FFD700]"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 py-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                className="mt-1 border-[#2a2a2a] data-[state=checked]:bg-[#FFD700] data-[state=checked]:border-[#FFD700]"
              />
              <Label
                htmlFor="terms"
                className="text-[#9ca3af] cursor-pointer leading-relaxed"
                style={{ fontSize: '14px' }}
              >
                Akceptuję{" "}
                <Link to="/terms" className="text-[#FFD700] hover:underline">
                  regulamin
                </Link>{" "}
                i{" "}
                <Link to="/privacy" className="text-[#FFD700] hover:underline">
                  politykę prywatności
                </Link>
              </Label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#FFD700] text-[#121212] hover:bg-[#ffd700]/90 h-12"
              style={{ fontSize: '16px', fontWeight: 800 }}
            >
              {isLoading ? "TWORZENIE KONTA..." : "STWÓRZ KONTO"}
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
              onClick={() => handleSocialRegister("google")}
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
              Zarejestruj przez Google
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialRegister("facebook")}
              disabled={isLoading}
              className="w-full border-[#2a2a2a] text-white hover:bg-[#2a2a2a] h-12"
              style={{ fontWeight: 600 }}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Zarejestruj przez Facebook
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-[#9ca3af]">
              Masz już konto?{" "}
              <Link to="/login" className="text-[#FFD700] hover:underline" style={{ fontWeight: 700 }}>
                Zaloguj się
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
