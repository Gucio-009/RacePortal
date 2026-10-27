/**
 * CompleteRegistrationPage — dokończenie rejestracji po Google Sign-In.
 */
import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Flag, IdCard } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { HERO_BG_RACE } from "../lib/types";

export function CompleteRegistrationPage() {
  const { t } = useTranslation();
  const { user, isLoading, isAuthenticated, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [hasDrivingLicenseB, setHasDrivingLicenseB] = useState(false);
  const [hasPzmLicense, setHasPzmLicense] = useState(false);
  const [pzmLicense, setPzmLicense] = useState("");
  const [saving, setSaving] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-[var(--race-muted)]">
        {t("completeReg.loading")}
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
      toast.error(t("completeReg.pzmRequired"));
      return;
    }
    setSaving(true);
    const result = await updateProfile({
      hasDrivingLicenseB,
      pzmLicense: hasPzmLicense ? pzmLicense.trim() : "",
    });
    setSaving(false);
    if (result.ok) {
      toast.success(t("completeReg.ok"));
      navigate("/dashboard", { replace: true });
    } else {
      toast.error(result.message || t("completeReg.fail"));
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
          <h1 className="font-display text-white mb-2" style={{ fontSize: "32px", fontWeight: 800 }}>
            {t("completeReg.titleBefore")}{" "}
            <span className="text-[var(--race-accent)]">{t("completeReg.titleAccent")}</span>
          </h1>
          <p className="text-[#9ca3af]" style={{ fontSize: "15px" }}>
            {t("completeReg.subtitle")}
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
                    {t("completeReg.licenseB")}
                  </Label>
                  <p className="text-xs text-[var(--race-muted)]">{t("completeReg.licenseBDesc")}</p>
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
                    {t("completeReg.pzm")}
                  </Label>
                  <p className="text-xs text-[var(--race-muted)]">{t("completeReg.pzmIndependent")}</p>
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
                    {t("completeReg.pzmNumber")}
                  </Label>
                  <Input
                    id="complete-pzmLicense"
                    type="text"
                    placeholder={t("completeReg.pzmNumber")}
                    value={pzmLicense}
                    onChange={(e) => setPzmLicense(e.target.value)}
                    className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)] focus:border-[var(--race-accent)] h-10"
                  />
                </div>
              )}
            </div>

            <p className="text-xs text-[var(--race-muted)]">{t("completeReg.hint")}</p>

            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95 h-12"
              style={{ fontSize: "16px", fontWeight: 800 }}
            >
              {saving ? t("completeReg.saving") : t("completeReg.submit")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
