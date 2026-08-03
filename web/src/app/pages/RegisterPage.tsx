import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Lock, Eye, EyeOff, Flag, CheckCircle2, KeyRound, Phone, IdCard } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Switch } from "../components/ui/switch";
import { Separator } from "../components/ui/separator";
import { toast } from "sonner";

function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [hasDrivingLicenseB, setHasDrivingLicenseB] = useState(false);
  const [pzmLicense, setPzmLicense] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const { register, verifyEmail, resendCode, socialLogin } = useAuth();
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

    if (password.length < 8) {
      toast.error("Hasło musi mieć minimum 8 znaków");
      return;
    }

    if (!isStrongPassword(password)) {
      toast.error("Hasło musi zawierać wielką literę, cyfrę i znak specjalny");
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(username, email, password, {
        firstName,
        lastName,
        phone,
        hasDrivingLicenseB,
        pzmLicense,
      });
      if (!result.ok) {
        toast.error(result.message || "Nie udało się utworzyć konta");
        return;
      }
      if ("requiresVerification" in result && result.requiresVerification) {
        setPendingEmail(result.email);
        toast.success(result.message || "Kod weryfikacyjny wysłany na e-mail");
        return;
      }
      toast.success("Konto utworzone pomyślnie!");
      navigate("/dashboard");
    } catch {
      toast.error("Wystąpił błąd podczas rejestracji");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingEmail) return;
    if (code.trim().length !== 6) {
      toast.error("Podaj 6-cyfrowy kod");
      return;
    }
    setIsLoading(true);
    try {
      const result = await verifyEmail(pendingEmail, code.trim());
      if (result.ok) {
        toast.success("Konto aktywowane!");
        navigate("/dashboard");
      } else {
        toast.error(result.message || "Nieprawidłowy kod");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) return;
    setIsLoading(true);
    try {
      const result = await resendCode(pendingEmail);
      if (result.ok) toast.success(result.message || "Kod wysłany ponownie");
      else toast.error(result.message || "Nie udało się wysłać kodu");
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
            style={{ fontSize: "36px", fontWeight: 900 }}
          >
            DOŁĄCZ DO <span className="text-[#FFD700]">ZESPOŁU</span>
          </h1>
          <p className="text-[#9ca3af]" style={{ fontSize: "16px" }}>
            {pendingEmail ? "Potwierdź adres e-mail kodem" : "Stwórz konto i rozpocznij wyścig"}
          </p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 shadow-2xl">
          {pendingEmail ? (
            <form onSubmit={handleVerify} className="space-y-5">
              <p className="text-[#9ca3af] text-sm">
                Wysłaliśmy 6-cyfrowy kod na <span className="text-white">{pendingEmail}</span>. Sprawdź też
                Mailpit (lokalnie :8025).
              </p>
              <div className="space-y-2">
                <Label htmlFor="code" className="text-white" style={{ fontWeight: 600 }}>
                  Kod weryfikacyjny
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                  <Input
                    id="code"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="pl-10 bg-[#121212] border-[#2a2a2a] text-white focus:border-[#FFD700] h-12 tracking-widest"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#FFD700] text-[#121212] hover:bg-[#ffd700]/90 h-12"
                style={{ fontSize: "16px", fontWeight: 800 }}
              >
                {isLoading ? "WERYFIKACJA..." : "AKTYWUJ KONTO"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={handleResend}
                className="w-full border-[#2a2a2a] text-white hover:bg-[#2a2a2a] h-12"
              >
                Wyślij nowy kod
              </Button>
            </form>
          ) : (
            <>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-white" style={{ fontWeight: 600 }}>
                      Imię
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Jan"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="bg-[#121212] border-[#2a2a2a] text-white focus:border-[#FFD700] h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-white" style={{ fontWeight: 600 }}>
                      Nazwisko
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Kowalski"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="bg-[#121212] border-[#2a2a2a] text-white focus:border-[#FFD700] h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white" style={{ fontWeight: 600 }}>
                    Telefon
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+48 600 000 000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 bg-[#121212] border-[#2a2a2a] text-white focus:border-[#FFD700] h-12"
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
                  <p className="text-xs text-[#9ca3af]">
                    Min. 8 znaków, wielka litera, cyfra i znak specjalny (np. !@#$)
                  </p>
                </div>

                <div className="space-y-3 border border-[#2a2a2a] rounded-md p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Label htmlFor="licenseB" className="text-white flex items-center gap-2" style={{ fontWeight: 600 }}>
                        <IdCard className="w-4 h-4 text-[#FFD700]" />
                        Prawo jazdy kat. B
                      </Label>
                      <p className="text-xs text-[#9ca3af]">Posiadam ważne prawo jazdy</p>
                    </div>
                    <Switch
                      id="licenseB"
                      checked={hasDrivingLicenseB}
                      onCheckedChange={setHasDrivingLicenseB}
                    />
                  </div>
                  {hasDrivingLicenseB && (
                    <div className="space-y-2">
                      <Label htmlFor="pzmLicense" className="text-white text-sm">
                        Licencja PZM (opcjonalnie)
                      </Label>
                      <Input
                        id="pzmLicense"
                        type="text"
                        placeholder="Numer licencji PZM"
                        value={pzmLicense}
                        onChange={(e) => setPzmLicense(e.target.value)}
                        className="bg-[#121212] border-[#2a2a2a] text-white focus:border-[#FFD700] h-10"
                      />
                    </div>
                  )}
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
                    style={{ fontSize: "14px" }}
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
                  style={{ fontSize: "16px", fontWeight: 800 }}
                >
                  {isLoading ? "TWORZENIE KONTA..." : "STWÓRZ KONTO"}
                </Button>
              </form>

              <div className="relative my-6">
                <Separator className="bg-[#2a2a2a]" />
                <span
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1a1a1a] px-4 text-[#9ca3af]"
                  style={{ fontSize: "14px" }}
                >
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
                  Zarejestruj przez Facebook
                </Button>
              </div>
            </>
          )}

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
