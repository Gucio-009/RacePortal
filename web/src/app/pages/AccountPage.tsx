import { useEffect, useState } from "react";
import { Link } from "react-router";
import { KeyRound, Loader2, Mail, Shield, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

export function AccountPage() {
  const { user, updateProfile, changePassword } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setUsername(user?.username ?? "");
    setEmail(user?.email ?? "");
    setAvatar(user?.avatar ?? "");
  }, [user]);

  const roleLabel =
    user?.role === "ADMIN" ? "ADMINISTRATOR" : user?.role === "ORGANIZER" ? "ORGANIZATOR" : "KIEROWCA";

  const saveProfile = async () => {
    if (!username.trim() || username.trim().length < 2) {
      toast.error("Nazwa użytkownika musi mieć min. 2 znaki");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Podaj poprawny adres e-mail");
      return;
    }
    setSavingProfile(true);
    const result = await updateProfile({
      username: username.trim(),
      email: email.trim(),
      avatar: avatar.trim(),
    });
    setSavingProfile(false);
    if (result.ok) {
      toast.success("Dane konta zapisane", {
        description: email.trim() !== user?.email ? "Sprawdź Mailpit, jeśli zmieniłeś e-mail." : undefined,
      });
    } else {
      toast.error(result.message || "Nie udało się zapisać");
    }
  };

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
            <p className="text-[#FFD700] font-['Orbitron'] tracking-widest text-sm mb-2">KONTO</p>
            <h1 className="font-['Orbitron'] text-white mb-2" style={{ fontSize: "36px", fontWeight: 900 }}>
              DANE KONTA
            </h1>
            <p className="text-[#9ca3af]">Zmień nazwę, e-mail, awatar lub hasło.</p>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="w-14 h-14 border-2 border-[#FFD700]">
              <AvatarImage src={user?.avatar ?? undefined} />
              <AvatarFallback className="bg-[#FFD700] text-[#121212]">
                {user?.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Badge className="bg-[#FFD700] text-[#121212]" style={{ fontWeight: 700 }}>
              <Shield className="w-3 h-3 mr-1" />
              {roleLabel}
            </Badge>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 font-['Orbitron']">
                <User className="w-5 h-5 text-[#FFD700]" />
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
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#FFD700]" />
                  E-mail
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#121212] border-[#2a2a2a] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">URL awatara</Label>
                <Input
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                  className="bg-[#121212] border-[#2a2a2a] text-white"
                />
              </div>
              <Button
                onClick={saveProfile}
                disabled={savingProfile}
                className="bg-[#FFD700] text-[#121212] hover:bg-[#ffd700]/90"
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
              <CardTitle className="text-white flex items-center gap-2 font-['Orbitron']">
                <KeyRound className="w-5 h-5 text-[#FFD700]" />
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
                className="bg-[#FFD700] text-[#121212] hover:bg-[#ffd700]/90"
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
