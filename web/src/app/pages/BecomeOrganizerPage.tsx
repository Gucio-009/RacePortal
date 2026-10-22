/**
 * BecomeOrganizerPage — wniosek USER → ORGANIZER (rozpatrywany w AdminPanel).
 *
 * Cel: zalogowany kierowca wysyła firmę + opis doświadczenia; admin zatwierdza.
 * Wzorce: formularz POST `/api/organizer/apply` z JWT; status GET `/api/organizer/my-application`.
 * Auth: wymaga `isAuthenticated` (toast + navigate); API też egzekwuje JWT.
 * Theme: `--race-accent`, `font-display`. Docker/nginx: deep link → SPA try_files.
 */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Building2, MessageSquare, Loader2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { api, ApiError } from "../lib/api";
import type { OrganizerApplication } from "../lib/types";
import { toast } from "sonner";

const BUSINESS_TYPES = [
  "Osoba prywatna",
  "Firma",
  "Jednoosobowa działalność gospodarcza",
  "Stowarzyszenie",
  "Fundacja",
  "Automobilklub zrzeszony w PZM",
] as const;

export function BecomeOrganizerPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(isAuthenticated);
  const [existing, setExisting] = useState<OrganizerApplication | null>(null);
  const [sent, setSent] = useState(false);

  const alreadyOrganizer = user?.role === "ORGANIZER" || user?.role === "ADMIN";
  const showPending = sent || existing?.status === "PENDING";
  const showForm =
    !alreadyOrganizer &&
    !showPending &&
    existing?.status !== "APPROVED";

  useEffect(() => {
    if (!isAuthenticated || alreadyOrganizer) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    setChecking(true);
    api
      .get<OrganizerApplication | undefined>("/api/organizer/my-application")
      .then((app) => {
        if (!cancelled && app) setExisting(app);
      })
      .catch(() => {
        /* brak wniosku lub błąd — pokaż formularz */
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, alreadyOrganizer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info("Zaloguj się, aby wysłać wniosek");
      navigate("/login");
      return;
    }
    if (!businessType) {
      toast.error("Wybierz typ działalności");
      return;
    }
    setLoading(true);
    try {
      const created = await api.post<OrganizerApplication>("/api/organizer/apply", {
        company: company.trim(),
        businessType,
        message: message.trim(),
      });
      setExisting(created);
      setSent(true);
      toast.success("Wniosek wysłany! Administrator rozpatrzy go wkrótce.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Nie udało się wysłać wniosku");
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

      <section className="container mx-auto px-4 py-10 max-w-2xl space-y-6">
        {checking ? (
          <div className="flex items-center justify-center gap-3 text-[#9ca3af] py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--race-accent)]" />
            Sprawdzanie statusu wniosku...
          </div>
        ) : alreadyOrganizer ? (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-white" style={{ fontWeight: 700 }}>
              Masz już uprawnienia organizatora
            </p>
            <p className="text-[#9ca3af]">Możesz tworzyć i zarządzać wydarzeniami w panelu organizatora.</p>
            <Link to="/organizer">
              <Button className="bg-[var(--race-accent)] text-[#121212]" style={{ fontWeight: 700 }}>
                Panel organizatora
              </Button>
            </Link>
          </div>
        ) : showPending ? (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 text-center space-y-4">
            <Clock className="w-12 h-12 text-[var(--race-accent)] mx-auto" />
            <p className="text-white" style={{ fontWeight: 700 }}>
              Wniosek oczekuje na decyzję
            </p>
            <p className="text-[#9ca3af]">
              {existing?.company ? (
                <>
                  Firma: <span className="text-white">{existing.company}</span>
                  {existing.businessType ? ` · ${existing.businessType}` : ""}.{" "}
                </>
              ) : null}
              Administrator rozpatrzy wniosek wkrótce — dostaniesz dostęp do panelu organizatora po akceptacji.
            </p>
            <Link to="/dashboard">
              <Button className="bg-[var(--race-accent)] text-[#121212]" style={{ fontWeight: 700 }}>
                Wróć do profilu
              </Button>
            </Link>
          </div>
        ) : existing?.status === "APPROVED" ? (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-white" style={{ fontWeight: 700 }}>
              Wniosek został zaakceptowany
            </p>
            <p className="text-[#9ca3af]">
              Odśwież sesję (wyloguj i zaloguj ponownie), jeśli nie widzisz panelu organizatora.
            </p>
            <Link to="/organizer">
              <Button className="bg-[var(--race-accent)] text-[#121212]" style={{ fontWeight: 700 }}>
                Panel organizatora
              </Button>
            </Link>
          </div>
        ) : null}

        {existing?.status === "REJECTED" && showForm && (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 text-center space-y-2">
            <XCircle className="w-10 h-10 text-red-400 mx-auto" />
            <p className="text-white" style={{ fontWeight: 700 }}>
              Poprzedni wniosek został odrzucony
            </p>
            <p className="text-[#9ca3af] text-sm">Możesz złożyć nowy wniosek z aktualnymi danymi.</p>
          </div>
        )}

        {showForm && (
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
              <Label htmlFor="org-apply-company" className="text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[var(--race-accent)]" />
                Firma / organizacja *
              </Label>
              <Input
                id="org-apply-company"
                name="company"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="bg-[#121212] border-[#2a2a2a] text-white h-12"
                placeholder="np. Tor Racing Sp. z o.o."
                autoComplete="organization"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-apply-businessType" className="text-white">
                Typ działalności <span className="text-red-500 font-bold">*</span>
              </Label>
              <select
                id="org-apply-businessType"
                name="businessType"
                required
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full h-12 rounded-md bg-[#121212] border border-[#2a2a2a] text-white px-3"
              >
                <option value="">Wybierz typ…</option>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-apply-message" className="text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[var(--race-accent)]" />
                Wiadomość *
              </Label>
              <Textarea
                id="org-apply-message"
                name="message"
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
              disabled={loading || !isAuthenticated}
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
