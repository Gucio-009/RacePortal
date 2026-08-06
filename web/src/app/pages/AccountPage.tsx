/**
 * AccountPage — pełna edycja danych konta i zmiana hasła.
 *
 * Cel: profil kierowcy (imię, telefon, prawo jazdy B, PZM), awatar, username;
 * osobna sekcja changePassword przez AuthContext.
 * Wzorce: sync formularza z `user` w useEffect, JWT w wywołaniach AuthContext
 * (`raceportal_token`), badge roli.
 * Auth: wymaga zalogowania. Theme: `--race-accent`, `font-display`.
 * Docker/nginx: deep link `/konto` (lub ścieżka z routera) → SPA fallback.
 *
 * Pomysł (alt): React Hook Form + Zod; osobny endpoint PATCH /me; 2FA; Next.js.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { KeyRound, Loader2, Shield, User, Phone, IdCard } from "lucide-react";
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

export function AccountPage() {
  const { user, updateProfile, changePassword } = useAuth();
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [hasDrivingLicenseB, setHasDrivingLicenseB] = useState(false);
  const [pzmLicense, setPzmLicense] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Hydratacja formularza gdy AuthContext dostarczy / odświeży usera.
  useEffect(() => {
    setUsername(user?.username ?? "");
    setAvatar(user?.avatar ?? "");
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName ?? "");
    setPhone(user?.phone ?? "");
    setHasDrivingLicenseB(user?.hasDrivingLicenseB ?? false);
    setPzmLicense(user?.pzmLicense ?? "");
  }, [user]);

  const roleLabel =
    user?.role === "ADMIN" ? "ADMINISTRATOR" : user?.role === "ORGANIZER" ? "ORGANIZATOR" : "KIEROWCA";

  const saveProfile = async () => {
    if (!username.trim() || username.trim().length < 2) {
      toast.error("Nazwa użytkownika musi mieć min. 2 znaki");
      return;
    }
    setSavingProfile(true);
    const result = await updateProfile({
      username: username.trim(),
      avatar: avatar.trim(),
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      phone: phone.trim() || undefined,
      hasDrivingLicenseB,
      pzmLicense: pzmLicense.trim() || undefined,
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
    if (newPassword.length < 6) {
      toast.error("Nowe hasło musi mieć min. 6 znaków");
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

  return (
    <div className="min-h-screen bg-[#121212]">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <p className="text-[var(--race-accent)] font-display tracking-widest text-sm mb-2">KONTO</p>
            <h1 className="font-display text-white mb-2" style={{ fontSize: "36px", fontWeight: 800 }}>
              DANE KONTA
            </h1>
            <p className="text-[#9ca3af]">Zmień nazwę, awatar, dane kierowcy lub hasło.</p>
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
                  <Label className="text-white">Imię</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="bg-[#121212] border-[#2a2a2a] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Nazwisko</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="bg-[#121212] border-[#2a2a2a] text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[var(--race-accent)]" />
                  Telefon
                </Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                {hasDrivingLicenseB && (
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Licencja PZM</Label>
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
