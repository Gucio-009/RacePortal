/**
 * VerifyEmailPage – aktywacja konta / potwierdzenie e-maila z linku w mailu.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Flag, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { clearPendingVerifyEmail } from "../lib/pendingVerifyEmail";
import { HERO_BG_TRACK } from "../lib/types";
import { toast } from "sonner";

function readTokenFromHash(): string {
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw) return "";
  const params = new URLSearchParams(raw.includes("=") ? raw : `token=${raw}`);
  return params.get("token")?.trim() ?? "";
}

export function VerifyEmailPage() {
  const { t } = useTranslation();
  const { token: pathToken } = useParams();
  const [searchParams] = useSearchParams();
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"working" | "ok" | "error">("working");
  const [message, setMessage] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    setMessage(t("verify.workingMsg"));
  }, [t]);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const token =
      pathToken?.trim() ||
      searchParams.get("token")?.trim() ||
      readTokenFromHash() ||
      "";
    const email = searchParams.get("email")?.trim() || undefined;
    if (token.length < 20) {
      setStatus("error");
      setMessage(t("verify.badLink"));
      return;
    }

    void (async () => {
      const result = await verifyEmail(token, email);
      if (result.ok) {
        clearPendingVerifyEmail();
        setStatus("ok");
        setMessage(t("verify.okRedirect"));
        toast.success(t("verify.okToast"));
        window.setTimeout(() => navigate("/dashboard", { replace: true }), 150);
      } else {
        setStatus("error");
        setMessage(result.message || t("verify.expired"));
        toast.error(result.message || t("verify.failToast"));
      }
    })();
  }, [pathToken, searchParams, verifyEmail, navigate, t]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(rgba(18, 18, 18, 0.9), rgba(18, 18, 18, 0.9)), url('${HERO_BG_TRACK}')`,
      }}
    >
      <div
        className="w-full max-w-md bg-[var(--race-card)] border border-[var(--race-border)] rounded-lg p-8 text-center space-y-4 shadow-[var(--race-card-shadow)]"
        data-reveal=""
      >
        <Flag className="w-12 h-12 text-[var(--race-accent)] mx-auto" />
        <h1 className="font-display text-[var(--race-fg)] text-2xl font-extrabold">{t("verify.titleCaps")}</h1>
        <div className="flex items-center justify-center gap-2 text-[var(--race-muted)]">
          {status === "working" && <Loader2 className="w-5 h-5 animate-spin text-[var(--race-accent)]" />}
          <p>{message || t("verify.workingMsg")}</p>
        </div>
        {status === "error" && (
          <div className="space-y-3 pt-2">
            <Link to="/register?verify=1">
              <Button className="w-full bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95" style={{ fontWeight: 800 }}>
                {t("verify.resend")}
              </Button>
            </Link>
            <Link to="/login" className="block text-sm text-[var(--race-muted)] hover:text-[var(--race-accent)]">
              {t("verify.backLogin")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
