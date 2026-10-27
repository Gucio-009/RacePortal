/**
 * ForgotPasswordPage — prośba o link resetujący hasło.
 */
import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { Flag, Mail, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { HERO_BG_TRACK } from "../lib/types";

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await forgotPassword(email);
      if (result.ok) {
        setSent(true);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(rgba(18, 18, 18, 0.9), rgba(18, 18, 18, 0.9)), url('${HERO_BG_TRACK}')`,
      }}
    >
      <div className="w-full max-w-md" data-reveal="">
        <div className="text-center mb-8">
          <Flag className="w-16 h-16 text-[var(--race-accent)] mx-auto mb-4" />
          <h1 className="font-display text-white mb-2" style={{ fontSize: "32px", fontWeight: 800 }}>
            {t("forgot.titleBefore")} <span className="text-[var(--race-accent)]">{t("forgot.titleAccent")}</span>
          </h1>
          <p className="text-[#9ca3af]">{t("forgot.subtitle")}</p>
        </div>

        <div className="bg-[var(--race-card)] border border-[var(--race-border)] rounded-lg p-8 shadow-[var(--race-card-shadow)]">
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-[var(--race-fg)]" style={{ fontWeight: 600 }}>
                {t("forgot.checkInbox")}
              </p>
              <p className="text-[var(--race-muted)]" style={{ fontSize: "14px" }}>
                {t("forgot.sentBody", { email })}
              </p>
              <Link to="/login">
                <Button
                  className="w-full bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95 h-12"
                  style={{ fontWeight: 800 }}
                >
                  {t("forgot.backLogin")}
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[var(--race-fg)]" style={{ fontWeight: 600 }}>
                  {t("auth.email")}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--race-muted)]" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="twoj@email.com"
                    className="pl-10 bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)] h-12"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95 h-12"
                style={{ fontWeight: 800 }}
              >
                {isLoading ? t("forgot.sending") : t("forgot.sendLink")}
              </Button>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-[var(--race-muted)] hover:text-[var(--race-accent)]"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("forgot.backLogin")}
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
