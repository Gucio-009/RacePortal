/**
 * RegisterPage – rejestracja konta + oczekiwanie na link aktywacyjny z e-maila.
 *
 * Cel: utworzenie konta kierowcy (USER) z danymi profilu / licencji; opcjonalnie Google.
 * Wzorce: dwuetapowy UI (formularz → „sprawdź mail” gdy `requiresVerification`),
 * AuthContext (`register`, `resendCode`, `loginWithGoogle`); aktywacja przez `/verify-email/{token}` (query = legacy).
 * Auth/JWT: po kliknięciu linku AuthContext zapisuje JWT w `raceportal_token`.
 * Walidacja hasła po stronie klienta (silne hasło); regulamin wymagany też przy Google.
 * Theme: `--race-accent`, `font-display`; link aktywacyjny idzie SMTP (prod Mailbux).
 * Docker/nginx: `/register` jako deep link SPA – nginx try_files.
 *
 * Pomysł (alt): Clerk/Auth0; Zod + React Hook Form; Next.js server actions.
 */
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Lock, Eye, EyeOff, Flag, CheckCircle2, Phone, IdCard } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Switch } from "../components/ui/switch";
import { Separator } from "../components/ui/separator";
import { toast } from "sonner";
import { GoogleSignInButton, isGoogleClientConfigured } from "../components/GoogleSignInButton";
import { isStrongPassword } from "../lib/profileValidation";
import {
  clearPendingVerifyEmail,
  getPendingVerifyEmail,
  setPendingVerifyEmail,
} from "../lib/pendingVerifyEmail";
import { HERO_BG_RACE } from "../lib/types";

export function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [hasDrivingLicenseB, setHasDrivingLicenseB] = useState(false);
  const [hasPzmLicense, setHasPzmLicense] = useState(false);
  const [pzmLicense, setPzmLicense] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Gdy backend wymaga weryfikacji – przełączamy UI na formularz kodu (też po powrocie z sessionStorage / ?verify=).
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  /** Tryb „czekam na link” / ponowna wysyłka (np. po logowaniu bez aktywacji). */
  const [verifyMode, setVerifyMode] = useState(false);
  const { register, resendCode, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const googleEnabled = isGoogleClientConfigured();

  useEffect(() => {
    const fromQuery = searchParams.get("email")?.trim().toLowerCase() ?? "";
    const wantVerify = searchParams.get("verify") === "1" || searchParams.get("verify") === "true";
    const stored = getPendingVerifyEmail();
    const resume = fromQuery.includes("@") ? fromQuery : stored;
    if (resume) {
      setPendingEmail(resume);
      setPendingVerifyEmail(resume);
      setEmail(resume);
      setVerifyMode(true);
      return;
    }
    if (wantVerify) {
      setVerifyMode(true);
    }
  }, [searchParams]);

  const enterVerifyStep = (addr: string) => {
    const normalized = addr.trim().toLowerCase();
    setPendingEmail(normalized);
    setPendingVerifyEmail(normalized);
    setEmail(normalized);
    setVerifyMode(true);
  };

  const leaveVerifyStep = () => {
    clearPendingVerifyEmail();
    setPendingEmail(null);
    setVerifyMode(false);
  };

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
        address,
        instagramUrl,
        hasDrivingLicenseB,
        pzmLicense: hasPzmLicense ? pzmLicense : "",
      });
      if (!result.ok) {
        toast.error(result.message || "Nie udało się utworzyć konta");
        return;
      }
      // Etap 2: link w mailu zamiast od razu JWT.
      if ("requiresVerification" in result && result.requiresVerification) {
        enterVerifyStep(result.email);
        toast.success(result.message || "Link aktywacyjny wysłany na e-mail");
        return;
      }
      clearPendingVerifyEmail();
      toast.success("Konto utworzone pomyślnie!");
      navigate("/dashboard");
    } catch {
      toast.error("Wystąpił błąd podczas rejestracji");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const target = (pendingEmail || email).trim().toLowerCase();
    if (!target.includes("@")) {
      toast.error("Podaj adres e-mail, na który wysłać link");
      return;
    }
    setIsLoading(true);
    try {
      const result = await resendCode(target);
      if (result.ok) {
        enterVerifyStep(target);
        toast.success(result.message || "Link wysłany ponownie");
      } else toast.error(result.message || "Nie udało się wysłać linku");
    } finally {
      setIsLoading(false);
    }
  };

  /** Google: od razu dashboard; przy nowym koncie — popup o uzupełnieniu licencji. */
  const handleGoogle = useCallback(
    async (idToken: string) => {
      if (!acceptTerms) {
        toast.error("Zaakceptuj regulamin przed kontynuacją");
        return;
      }
      setIsLoading(true);
      try {
        const result = await loginWithGoogle(idToken);
        if (result.ok) {
          const isNew = result.registrationComplete === false;
          toast.success(isNew ? "Konto Google utworzone" : "Zalogowano przez Google");
          navigate("/dashboard", { state: isNew ? { googleWelcome: true } : undefined });
        } else {
          toast.error(result.message || "Nie udało się kontynuować z Google");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [acceptTerms, loginWithGoogle, navigate],
  );

  return (
    <div
      className="min-h-screen flex items-start justify-center px-4 py-12 bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(rgba(18, 18, 18, 0.9), rgba(18, 18, 18, 0.9)), url('${HERO_BG_RACE}')`,
      }}
    >
      <div className="w-full max-w-md" data-reveal="">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Flag className="w-16 h-16 text-[var(--race-accent)]" />
          </div>
          <h1
            className="font-display text-white mb-2"
            style={{ fontSize: "36px", fontWeight: 800 }}
          >
            DOŁĄCZ DO <span className="text-[var(--race-accent)]">ZESPOŁU</span>
          </h1>
          <p className="text-[#9ca3af]" style={{ fontSize: "16px" }}>
            {verifyMode ? "Aktywuj konto linkiem z maila" : "Stwórz konto i rozpocznij wyścig"}
          </p>
        </div>

        <div className="bg-[var(--race-card)] border border-[var(--race-border)] rounded-lg p-8 shadow-[var(--race-card-shadow)]">
          {verifyMode ? (
            <form onSubmit={handleResend} className="space-y-5">
              <p className="text-[var(--race-muted)] text-sm">
                {pendingEmail ? (
                  <>
                    Wysłaliśmy link aktywacyjny na <span className="text-[var(--race-fg)]">{pendingEmail}</span>.
                    Otwórz wiadomość i kliknij przycisk (sprawdź też spam). Link jest ważny 60 minut.
                  </>
                ) : (
                  <>Podaj e-mail z rejestracji – wyślemy nowy link aktywacyjny.</>
                )}
              </p>
              <div className="space-y-2">
                <Label htmlFor="verify-email" className="text-[var(--race-fg)]" style={{ fontWeight: 600 }}>
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--race-muted)]" />
                  <Input
                    id="verify-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setPendingEmail(null);
                    }}
                    className="pl-10 bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)] focus:border-[var(--race-accent)] h-12"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95 h-12"
                style={{ fontSize: "16px", fontWeight: 800 }}
              >
                {isLoading ? "WYSYŁANIE..." : "WYŚLIJ PONOWNIE LINK"}
              </Button>
              <Link to="/login">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-[var(--race-border)] text-[var(--race-fg)] hover:bg-[var(--race-hover)] h-12"
                >
                  Mam już aktywne konto – logowanie
                </Button>
              </Link>
              <button
                type="button"
                className="w-full text-sm text-[var(--race-muted)] hover:text-[var(--race-accent)]"
                onClick={leaveVerifyStep}
              >
                Wróć do rejestracji
              </button>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-[var(--race-fg)]" style={{ fontWeight: 600 }}>
                    Nazwa użytkownika
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--race-muted)]" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="twoja_nazwa"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)] focus:border-[var(--race-accent)] h-12"
                      required
                    />
                  </div>
                </div>

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-[var(--race-fg)]" style={{ fontWeight: 600 }}>
                      Imię
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Jan"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)] focus:border-[var(--race-accent)] h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-[var(--race-fg)]" style={{ fontWeight: 600 }}>
                      Nazwisko
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Kowalski"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)] focus:border-[var(--race-accent)] h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[var(--race-fg)]" style={{ fontWeight: 600 }}>
                    Telefon
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--race-muted)]" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+48 600 000 000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)] focus:border-[var(--race-accent)] h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-[var(--race-fg)]" style={{ fontWeight: 600 }}>
                    Adres zamieszkania
                  </Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="Ulica, kod, miasto"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)] focus:border-[var(--race-accent)] h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram" className="text-[var(--race-fg)]" style={{ fontWeight: 600 }}>
                    Instagram (opcjonalnie)
                  </Label>
                  <Input
                    id="instagram"
                    type="url"
                    placeholder="https://instagram.com/..."
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)] focus:border-[var(--race-accent)] h-12"
                  />
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
                  <p className="text-xs text-[var(--race-muted)]">
                    Min. 8 znaków, wielka litera, cyfra i znak specjalny (np. !@#$)
                  </p>
                </div>

                <div className="space-y-3 border border-[var(--race-border)] rounded-md p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Label htmlFor="licenseB" className="text-[var(--race-fg)] flex items-center gap-2" style={{ fontWeight: 600 }}>
                        <IdCard className="w-4 h-4 text-[var(--race-accent)]" />
                        Prawo jazdy kat. B
                      </Label>
                      <p className="text-xs text-[var(--race-muted)]">Posiadam ważne prawo jazdy</p>
                    </div>
                    <Switch
                      id="licenseB"
                      checked={hasDrivingLicenseB}
                      onCheckedChange={setHasDrivingLicenseB}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-[var(--race-border)]">
                    <div>
                      <Label htmlFor="hasPzm" className="text-[var(--race-fg)]" style={{ fontWeight: 600 }}>
                        Licencja PZM
                      </Label>
                      <p className="text-xs text-[var(--race-muted)]">Niezależnie od prawa jazdy</p>
                    </div>
                    <Switch
                      id="hasPzm"
                      checked={hasPzmLicense}
                      onCheckedChange={(v) => {
                        setHasPzmLicense(v);
                        if (!v) setPzmLicense("");
                      }}
                    />
                  </div>
                  {hasPzmLicense && (
                    <div className="space-y-2">
                      <Label htmlFor="pzmLicense" className="text-[var(--race-fg)] text-sm">
                        Numer licencji PZM
                      </Label>
                      <Input
                        id="pzmLicense"
                        type="text"
                        placeholder="Numer licencji PZM"
                        value={pzmLicense}
                        onChange={(e) => setPzmLicense(e.target.value)}
                        className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)] focus:border-[var(--race-accent)] h-10"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-[var(--race-fg)]" style={{ fontWeight: 600 }}>
                    Powtórz hasło
                  </Label>
                  <div className="relative">
                    <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--race-muted)]" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10 bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)] focus:border-[var(--race-accent)] h-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--race-muted)] hover:text-[var(--race-accent)]"
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
                    className="mt-1 border-[var(--race-border)] data-[state=checked]:bg-[var(--race-accent)] data-[state=checked]:border-[var(--race-accent)]"
                  />
                  <Label
                    htmlFor="terms"
                    className="text-[var(--race-muted)] cursor-pointer leading-relaxed"
                    style={{ fontSize: "14px" }}
                  >
                    Akceptuję{" "}
                    <Link to="/terms" className="text-[var(--race-accent)] hover:underline">
                      regulamin
                    </Link>{" "}
                    i{" "}
                    <Link to="/privacy" className="text-[var(--race-accent)] hover:underline">
                      politykę prywatności
                    </Link>
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95 h-12"
                  style={{ fontSize: "16px", fontWeight: 800 }}
                >
                  {isLoading ? "TWORZENIE KONTA..." : "STWÓRZ KONTO"}
                </Button>
              </form>

              {googleEnabled ? (
                <div className="space-y-4 mt-6">
                  <div className="relative">
                    <Separator className="bg-[var(--race-muted-bg)]" />
                    <span
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--race-card)] px-4 text-[var(--race-muted)] whitespace-nowrap"
                      style={{ fontSize: "14px" }}
                    >
                      lub zarejestruj przez Google
                    </span>
                  </div>
                  <GoogleSignInButton
                    onCredential={handleGoogle}
                    onError={(msg) => toast.error(msg)}
                    disabled={isLoading || !acceptTerms}
                    label="Zarejestruj się przez Google"
                  />
                  {!acceptTerms ? (
                    <p className="text-[#6b7280] text-xs text-center">
                      Zaznacz regulamin powyżej, aby utworzyć konto przez Google
                    </p>
                  ) : null}
                </div>
              ) : null}
            </>
          )}

          <div className="mt-6 text-center space-y-2">
            {!verifyMode && (
              <p className="text-[var(--race-muted)]">
                Nie dostałeś linku aktywacyjnego?{" "}
                <button
                  type="button"
                  className="text-[var(--race-accent)] hover:underline font-bold"
                  onClick={() => setVerifyMode(true)}
                >
                  Wyślij ponownie
                </button>
              </p>
            )}
            <p className="text-[var(--race-muted)]">
              Masz już konto?{" "}
              <Link to="/login" className="text-[var(--race-accent)] hover:underline" style={{ fontWeight: 700 }}>
                Zaloguj się
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
