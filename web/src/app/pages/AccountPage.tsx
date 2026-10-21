/**
 * AccountPage — pełna edycja danych konta, hasła i e-maila.
 *
 * Cel: profil kierowcy (imię, telefon, prawo jazdy B, PZM), awatar, username;
 * changePassword + zmiana e-maila (kod na nowy adres) przez AuthContext;
 * CTA „Zostań organizatorem” dla roli USER.
 * Wzorce: sync formularza z `user` w useEffect, JWT w wywołaniach AuthContext
 * (`raceportal_token`), badge roli.
 * Auth: wymaga zalogowania. Theme: `--race-accent`, `font-display`.
 * Docker/nginx: deep link `/konto` (lub ścieżka z routera) → SPA fallback.
 *
 * Pomysł (alt): React Hook Form + Zod; osobny endpoint PATCH /me; 2FA; Next.js.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { KeyRound, Loader2, Mail, Shield, User, Phone, IdCard } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AvatarPicker } from "../components/AvatarPicker";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { toast } from "sonner";
import { userInitials } from "../lib/types";
import {
  isStrongPassword,
  STRONG_PASSWORD_HINT,
  validateInstagramUrl,
  validatePersonName,
  validatePhone,
} from "../lib/profileValidation";

export function AccountPage() {
  const { user, updateProfile, changePassword, requestEmailChange } = useAuth();
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [hasDrivingLicenseB, setHasDrivingLicenseB] = useState(false);
  const [hasPzmLicense, setHasPzmLicense] = useState(false);
  const [pzmLicense, setPzmLicense] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  // Hydratacja formularza gdy AuthContext dostarczy / odświeży usera.
  useEffect(() => {
    setUsername(user?.username ?? "");
    setAvatar(user?.avatar ?? "");
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName ?? "");
    setPhone(user?.phone ?? "");
    setAddress(user?.address ?? "");
    setInstagramUrl(user?.instagramUrl ?? "");
    setHasDrivingLicenseB(user?.hasDrivingLicenseB ?? false);
    setHasPzmLicense(Boolean(user?.pzmLicense));
    setPzmLicense(user?.pzmLicense ?? "");
  }, [user]);

  const roleLabel =
    user?.role === "ADMIN" ? "ADMINISTRATOR" : user?.role === "ORGANIZER" ? "ORGANIZATOR" : "KIEROWCA";

  const saveProfile = async () => {
    if (!username.trim() || username.trim().length < 2) {
      toast.error("Nazwa użytkownika musi mieć min. 2 znaki");
      return;
    }
    const nameErr =
      validatePersonName(firstName, "Imię") || validatePersonName(lastName, "Nazwisko");
    if (nameErr) {
      toast.error(nameErr);
      return;
    }
    const phoneErr = validatePhone(phone);
    if (phoneErr) {
      toast.error(phoneErr);
      return;
    }
    const igErr = validateInstagramUrl(instagramUrl);
    if (igErr) {
      toast.error(igErr);
      return;
    }
    setSavingProfile(true);
    const result = await updateProfile({
      username: username.trim(),
      avatar: avatar.trim(),
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || "",
      instagramUrl: instagramUrl.trim() || "",
      hasDrivingLicenseB,
      pzmLicense: hasPzmLicense ? pzmLicense.trim() : "",
    });
    setSavingProfile(false);
    if (result.ok) {
      toast.success("Dane konta zapisane");
    } else {
      toast.error(result.message || "Nie udało się zapisać");
    }
  };

  /** Zmiana hasła — wymaga aktualnego hasła (nie OAuth-only flow). */
  const savePassword = async () => {
    if (!isStrongPassword(newPassword)) {
      toast.error(STRONG_PASSWORD_HINT);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Potwierdzenie hasła nie pasuje");
      return;
    }
    setSavingPassword(true);
    const result = await changePassword(currentPassword, newPassword);
    setSavingPassword(false);
    if (result.ok) {
      toast.success("Hasło zmienione", { description: "Możesz teraz logować się nowym hasłem." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast.error(result.message || "Nie udało się zmienić hasła");
    }
  };

  const sendEmailChangeLink = async () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      toast.error("Podaj prawidłowy nowy adres e-mail");
      return;
    }
    if (trimmed === (user?.email ?? "").toLowerCase()) {
      toast.error("Podaj adres inny niż obecny");
      return;
    }
    setSavingEmail(true);
    const result = await requestEmailChange(trimmed);
    setSavingEmail(false);
    if (result.ok) {
      setEmailLinkSent(true);
      toast.success(result.message || "Link wysłany na nowy adres");
    } else {
      toast.error(result.message || "Nie udało się wysłać linku");
    }
  };

  return (
    <div className="min-h-screen bg-[#121212]">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <p className="text-[var(--race-accent)] font-display tracking-widest text-sm mb-2">KONTO</p>
            <h1 className="font-display text-white mb-2" style={{ fontSize: "36px", fontWeight: 800 }}>
              DANE KONTA
            </h1>
            <p className="text-[#9ca3af]">Zmień nazwę, awatar, e-mail, dane kierowcy lub hasło.</p>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="w-14 h-14 border-2 border-[var(--race-accent)]">
              <AvatarImage src={user?.avatar ?? undefined} />
              <AvatarFallback className="bg-[var(--race-accent)] text-[#121212]" style={{ fontWeight: 800 }}>
                {userInitials(user ?? {})}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <Badge className="bg-[var(--race-accent)] text-[#121212]" style={{ fontWeight: 700 }}>
                <Shield className="w-3 h-3 mr-1" />
                {roleLabel}
              </Badge>
              {user?.email ? (
                <p className="text-[#9ca3af] text-sm">{user.email}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 font-display">
                <User className="w-5 h-5 text-[var(--race-accent)]" />
                Profil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Nazwa użytkownika</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-[#121212] border-[#2a2a2a] text-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="account-firstName" className="text-white">
                    Imię
                  </Label>
                  <Input
                    id="account-firstName"
                    name="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    maxLength={50}
                    autoComplete="given-name"
                    className="bg-[#121212] border-[#2a2a2a] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-lastName" className="text-white">
                    Nazwisko
                  </Label>
                  <Input
                    id="account-lastName"
                    name="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    maxLength={50}
                    autoComplete="family-name"
                    className="bg-[#121212] border-[#2a2a2a] text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-phone" className="text-white flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[var(--race-accent)]" />
                  Telefon
                </Label>
                <Input
                  id="account-phone"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={16}
                  autoComplete="tel"
                  placeholder="+48 600 100 200"
                  className="bg-[#121212] border-[#2a2a2a] text-white"
                />
                <p className="text-xs text-[#9ca3af]">9–15 cyfr (z kierunkowym), max 16 znaków w polu.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-address" className="text-white">
                  Adres zamieszkania
                </Label>
                <Input
                  id="account-address"
                  name="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ulica, kod, miasto"
                  autoComplete="street-address"
                  className="bg-[#121212] border-[#2a2a2a] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-instagram" className="text-white">
                  Instagram
                </Label>
                <Input
                  id="account-instagram"
                  name="instagramUrl"
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://www.instagram.com/nazwa/"
                  className="bg-[#121212] border-[#2a2a2a] text-white"
                />
              </div>
              <div className="space-y-3 border border-[#2a2a2a] rounded-md p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label className="text-white flex items-center gap-2">
                      <IdCard className="w-4 h-4 text-[var(--race-accent)]" />
                      Prawo jazdy kat. B
                    </Label>
                  </div>
                  <Switch checked={hasDrivingLicenseB} onCheckedChange={setHasDrivingLicenseB} />
                </div>
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#2a2a2a]">
                  <div>
                    <Label className="text-white">Licencja PZM</Label>
                    <p className="text-xs text-[#9ca3af]">Niezależnie od prawa jazdy</p>
                  </div>
                  <Switch
                    checked={hasPzmLicense}
                    onCheckedChange={(v) => {
                      setHasPzmLicense(v);
                      if (!v) setPzmLicense("");
                    }}
                  />
                </div>
                {hasPzmLicense && (
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Numer licencji PZM</Label>
                    <Input
                      value={pzmLicense}
                      onChange={(e) => setPzmLicense(e.target.value)}
                      placeholder="Numer licencji PZM"
                      className="bg-[#121212] border-[#2a2a2a] text-white"
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-white">Awatar</Label>
                <AvatarPicker
                  value={avatar}
                  onChange={setAvatar}
                  username={username}
                  firstName={firstName}
                  lastName={lastName}
                />
              </div>
              <Button
                onClick={saveProfile}
                disabled={savingProfile}
                className="bg-[var(--race-accent)] text-[#121212] hover:brightness-95"
                style={{ fontWeight: 700 }}
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ZAPISYWANIE...
                  </>
                ) : (
                  "ZAPISZ DANE"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 font-display">
                <Mail className="w-5 h-5 text-[var(--race-accent)]" />
                Zmiana e-maila
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[#9ca3af] text-sm">
                Obecny adres: <span className="text-white">{user?.email}</span>
              </p>
              <div className="space-y-2">
                <Label className="text-white">Nowy e-mail</Label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setEmailLinkSent(false);
                  }}
                  className="bg-[#121212] border-[#2a2a2a] text-white"
                  autoComplete="email"
                />
              </div>
              {emailLinkSent && (
                <p className="text-[#9ca3af] text-sm">
                  Sprawdź skrzynkę nowego adresu i kliknij link potwierdzający (ważny 60 minut).
                </p>
              )}
              <Button
                onClick={sendEmailChangeLink}
                disabled={savingEmail}
                className="bg-[var(--race-accent)] text-[#121212] hover:brightness-95"
                style={{ fontWeight: 700 }}
              >
                {savingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    WYSYŁANIE...
                  </>
                ) : emailLinkSent ? (
                  "WYŚLIJ LINK PONOWNIE"
                ) : (
                  "WYŚLIJ LINK POTWIERDZAJĄCY"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 font-display">
                <KeyRound className="w-5 h-5 text-[var(--race-accent)]" />
                Zmiana hasła
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Obecne hasło</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-[#121212] border-[#2a2a2a] text-white"
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Nowe hasło</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-[#121212] border-[#2a2a2a] text-white"
                  autoComplete="new-password"
                />
                <p className="text-[#9ca3af] text-xs">{STRONG_PASSWORD_HINT}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Potwierdź nowe hasło</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-[#121212] border-[#2a2a2a] text-white"
                  autoComplete="new-password"
                />
              </div>
              <Button
                onClick={savePassword}
                disabled={savingPassword}
                className="bg-[var(--race-accent)] text-[#121212] hover:brightness-95"
                style={{ fontWeight: 700 }}
              >
                {savingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ZMIENIANIE...
                  </>
                ) : (
                  "ZMIEŃ HASŁO"
                )}
              </Button>
            </CardContent>
          </Card>

          {user?.role === "USER" && (
            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div>
                  <p className="text-white font-semibold mb-1">Chcesz organizować wydarzenia?</p>
                  <p className="text-[#9ca3af] text-sm">Złóż wniosek o konto organizatora.</p>
                </div>
                <Link to="/zostan-organizatorem">
                  <Button
                    className="bg-[var(--race-accent)] text-[#121212] hover:brightness-95"
                    style={{ fontWeight: 700 }}
                  >
                    ZOSTAŃ ORGANIZATOREM
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap gap-3">
            <Link to="/dashboard">
              <Button variant="outline" className="border-[#2a2a2a] text-white hover:bg-[#2a2a2a]">
                Moje konto (dashboard)
              </Button>
            </Link>
            <Link to="/ustawienia">
              <Button variant="outline" className="border-[#2a2a2a] text-white hover:bg-[#2a2a2a]">
                Preferencje UI
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
