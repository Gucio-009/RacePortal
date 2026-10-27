/**
 * CompleteRegistrationPage — dokończenie rejestracji po Google Sign-In.
 *
 * Google nie zbiera prawa jazdy B / licencji PZM; po utworzeniu konta użytkownik
 * musi tu je potwierdzić (tak / nie). PATCH /api/auth/me z hasDrivingLicenseB
 * ustawia registrationComplete=true po stronie API.
 */
import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { Flag, IdCard } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { HERO_BG_RACE } from "../lib/types";

export function CompleteRegistrationPage() {
  const { user, isLoading, isAuthenticated, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [hasDrivingLicenseB, setHasDrivingLicenseB] = useState(false);
  const [hasPzmLicense, setHasPzmLicense] = useState(false);
  const [pzmLicense, setPzmLicense] = useState("");
  const [saving, setSaving] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-[var(--race-muted)]">
        Ładowanie…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.registrationComplete !== false) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasPzmLicense && !pzmLicense.trim()) {
      toast.error("Podaj numer licencji PZM albo wyłącz przełącznik");
      return;
    }
    setSaving(true);
    const result = await updateProfile({
      hasDrivingLicenseB,
      pzmLicense: hasPzmLicense ? pzmLicense.trim() : "",
    });
    setSaving(false);
    if (result.ok) {
      toast.success("Rejestracja dokończona");
      navigate("/dashboard", { replace: true });
    } else {
      toast.error(result.message || "Nie udało się zapisać");
    }
  };

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
            style={{ fontSize: "32px", fontWeight: 800 }}
          >
            DOKOŃCZ <span className="text-[var(--race-accent)]">REJESTRACJĘ</span>
          </h1>
          <p className="text-[#9ca3af]" style={{ fontSize: "15px" }}>
            Konto Google jest aktywne. Uzupełnij dane wymagane przy zgłoszeniach na wydarzenia.
          </p>
        </div>

        <div className="bg-[var(--race-card)] border border-[var(--race-border)] rounded-lg p-8 shadow-[var(--race-card-shadow)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-3 border border-[var(--race-border)] rounded-md p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label
                    htmlFor="complete-licenseB"
                    className="text-[var(--race-fg)] flex items-center gap-2"
                    style={{ fontWeight: 600 }}
                  >
                    <IdCard className="w-4 h-4 text-[var(--race-accent)]" />
                    Prawo jazdy kat. B
                  </Label>
                  <p className="text-xs text-[var(--race-muted)]">Posiadam ważne prawo jazdy</p>
                </div>
                <Switch
                  id="complete-licenseB"
                  checked={hasDrivingLicenseB}
                  onCheckedChange={setHasDrivingLicenseB}
                />
              </div>
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-[var(--race-border)]">
                <div>
                  <Label htmlFor="complete-hasPzm" className="text-[var(--race-fg)]" style={{ fontWeight: 600 }}>
                    Licencja PZM
                  </Label>
                  <p className="text-xs text-[var(--race-muted)]">Niezależnie od prawa jazdy</p>
                </div>
                <Switch
                  id="complete-hasPzm"
                  checked={hasPzmLicense}
                  onCheckedChange={(v) => {
                    setHasPzmLicense(v);
                    if (!v) setPzmLicense("");
                  }}
                />
              </div>
              {hasPzmLicense && (
                <div className="space-y-2">
                  <Label htmlFor="complete-pzmLicense" className="text-[var(--race-fg)] text-sm">
                    Numer licencji PZM
                  </Label>
                  <Input
                    id="complete-pzmLicense"
                    type="text"
                    placeholder="Numer licencji PZM"
                    value={pzmLicense}
                    onChange={(e) => setPzmLicense(e.target.value)}
                    className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)] focus:border-[var(--race-accent)] h-10"
                  />
                </div>
              )}
            </div>

            <p className="text-xs text-[var(--race-muted)]">
              Możesz zaznaczyć „nie” — ważne jest potwierdzenie. Dane zmienisz później w koncie.
            </p>

            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95 h-12"
              style={{ fontSize: "16px", fontWeight: 800 }}
            >
              {saving ? "ZAPISYWANIE..." : "ZAPISZ I KONTYNUUJ"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
