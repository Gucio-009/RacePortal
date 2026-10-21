/**
 * VerifyEmailPage — aktywacja konta / potwierdzenie e-maila z linku w mailu.
 *
 * Deep link: `/verify-email?token=…` (opcjonalnie `&email=`).
 */
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Flag, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { clearPendingVerifyEmail } from "../lib/pendingVerifyEmail";
import { toast } from "sonner";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"working" | "ok" | "error">("working");
  const [message, setMessage] = useState("Aktywujemy konto…");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const token = searchParams.get("token")?.trim() ?? "";
    const email = searchParams.get("email")?.trim() || undefined;
    if (token.length < 20) {
      setStatus("error");
      setMessage("Brak prawidłowego linku aktywacyjnego.");
      return;
    }

    void (async () => {
      const result = await verifyEmail(token, email);
      if (result.ok) {
        clearPendingVerifyEmail();
        setStatus("ok");
        setMessage("Konto aktywowane — przekierowujemy…");
        toast.success("Konto aktywowane!");
        navigate("/dashboard", { replace: true });
      } else {
        setStatus("error");
        setMessage(result.message || "Nieprawidłowy lub wygasły link");
        toast.error(result.message || "Nie udało się aktywować konta");
      }
    })();
  }, [searchParams, verifyEmail, navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(rgba(18, 18, 18, 0.9), rgba(18, 18, 18, 0.9)), url('https://images.unsplash.com/photo-1617130644016-d318045a3958?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920')`,
      }}
    >
      <div className="w-full max-w-md bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 text-center space-y-4">
        <Flag className="w-12 h-12 text-[var(--race-accent)] mx-auto" />
        <h1 className="font-display text-white text-2xl font-extrabold">AKTYWACJA KONTA</h1>
        <div className="flex items-center justify-center gap-2 text-[#9ca3af]">
          {status === "working" && <Loader2 className="w-5 h-5 animate-spin text-[var(--race-accent)]" />}
          <p>{message}</p>
        </div>
        {status === "error" && (
          <div className="space-y-3 pt-2">
            <Link to="/register?verify=1">
              <Button className="w-full bg-[var(--race-accent)] text-[#121212] hover:brightness-95" style={{ fontWeight: 800 }}>
                Wyślij nowy link
              </Button>
            </Link>
            <Link to="/login" className="block text-sm text-[#9ca3af] hover:text-[var(--race-accent)]">
              Wróć do logowania
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
