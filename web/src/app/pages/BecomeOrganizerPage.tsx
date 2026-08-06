/**
 * BecomeOrganizerPage — wniosek USER → ORGANIZER (rozpatrywany w AdminPanel).
 *
 * Cel: zalogowany kierowca wysyła firmę + opis doświadczenia; admin zatwierdza.
 * Wzorce: formularz POST `/api/organizer/apply` z JWT; redirect do login jeśli brak sesji.
 * Auth: wymaga `isAuthenticated` (toast + navigate); API też egzekwuje JWT.
 * Theme: `--race-accent`, `font-display`. Docker/nginx: deep link → SPA try_files.
 *
 * Pomysł (alt): multi-step wizard; upload dokumentów; TanStack Form; status wniosku w dashboardzie.
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Building2, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { api, ApiError } from "../lib/api";
import { toast } from "sonner";

export function BecomeOrganizerPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Gate po stronie UI — token i tak jest wymagany przez API.
    if (!isAuthenticated) {
      toast.info("Zaloguj się, aby wysłać wniosek");
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/organizer/apply", { company: company.trim(), message: message.trim() });
      setSent(true);
      toast.success("Wniosek wysłany! Administrator rozpatrzy go wkrótce.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Nie udało się wysłać wniosku");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <section className="bg-[#1a1a1a] border-b border-[#2a2a2a] py-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="font-display text-white mb-3" style={{ fontSize: "40px", fontWeight: 800 }}>
            ZOSTAŃ <span className="text-[var(--race-accent)]">ORGANIZATOREM</span>
          </h1>
          <p className="text-[#9ca3af]">
            Organizujesz wyścigi, track daye lub eventy motorsportowe? Wyślij wniosek i zarządzaj wydarzeniami w
            RACEPORTAL.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 max-w-2xl">
        {sent ? (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 text-center space-y-4">
            <p className="text-white" style={{ fontWeight: 700 }}>
              Wniosek został wysłany
            </p>
            <p className="text-[#9ca3af]">Administrator skontaktuje się z Tobą po weryfikacji.</p>
            <Link to="/dashboard">
              <Button className="bg-[var(--race-accent)] text-[#121212]" style={{ fontWeight: 700 }}>
                Wróć do profilu
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 space-y-6">
            {!isAuthenticated && (
              <p className="text-[var(--race-accent)] text-sm">
                Musisz być zalogowany.{" "}
                <Link to="/login" className="underline">
                  Zaloguj się
                </Link>
              </p>
            )}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[var(--race-accent)]" />
                Firma / organizacja *
              </Label>
              <Input
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="bg-[#121212] border-[#2a2a2a] text-white h-12"
                placeholder="np. Tor Racing Sp. z o.o."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[var(--race-accent)]" />
                Wiadomość *
              </Label>
              <Textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="bg-[#121212] border-[#2a2a2a] text-white"
                placeholder="Opisz doświadczenie, planowane wydarzenia..."
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--race-accent)] text-[#121212] h-12"
              style={{ fontWeight: 800 }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  WYSYŁANIE...
                </>
              ) : (
                "WYŚLIJ WNIOSEK"
              )}
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
