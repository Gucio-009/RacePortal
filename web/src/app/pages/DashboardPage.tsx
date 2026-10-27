/**
 * DashboardPage – kokpit zalogowanego użytkownika (zgłoszenia + skrót garażu + profil).
 *
 * Cel: przegląd własnych Registration, anulowanie, dołączanie proof płatności.
 * Edycja profilu / hasła / e-maila: `/konto` (jedno miejsce zamiast dialogu na dashboardzie).
 * Wzorce: fetch on mount `/api/registrations/mine` + `/api/garage`, JWT w api client
 * (`raceportal_token`), badge roli (USER/ORGANIZER/ADMIN).
 * Auth: wymaga zalogowania (AuthGate w routerze). Theme: `--race-accent`, `font-display`.
 * Docker/nginx: `/dashboard` deep link → SPA try_files.
 *
 * Pomysł (alt): TanStack Query; osobne widgety; push notyfikacje; Next.js authenticated RSC.
 */
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { Calendar, MapPin, Clock, Car, Trophy, Loader2, Flag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { api, ApiError } from "../lib/api";
import { ImageUploadField } from "../components/ImageUploadField";
import type { Car as GarageCar, Registration } from "../lib/types";
import {
  registrationStatusLabel,
  eventDateLabel,
  isOpenRegistration,
  isPositiveRegistration,
  userInitials,
} from "../lib/types";
import { toast } from "sonner";
import { HERO_BG_RACE } from "../lib/types";
import { Reveal } from "../components/Reveal";

export function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [cars, setCars] = useState<GarageCar[]>([]);
  const [loading, setLoading] = useState(true);
  // URL potwierdzeń przelewu per registration id (lokalny draft przed POST).
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  const [googleWelcomeOpen, setGoogleWelcomeOpen] = useState(false);

  useEffect(() => {
    const state = location.state as { googleWelcome?: boolean } | null;
    if (state?.googleWelcome) {
      setGoogleWelcomeOpen(true);
      navigate(".", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const reloadRegistrations = () =>
    api
      .get<Registration[]>("/api/registrations/mine")
      .then(setRegistrations)
      .catch(() => setRegistrations([]));

  useEffect(() => {
    Promise.all([reloadRegistrations(), api.get<GarageCar[]>("/api/garage")])
      .then(([, garageCars]) => {
        setCars(garageCars);
      })
      .catch(() => {
        setRegistrations([]);
        setCars([]);
      })
      .finally(() => setLoading(false));
  }, []);

  /** Otwarte zgłoszenia na przyszłe APPROVED wydarzenia. */
  const now = new Date();
  const upcomingRegistrations = registrations.filter(
    (r) =>
      r.event &&
      r.event.status === "APPROVED" &&
      isOpenRegistration(r.status) &&
      new Date(r.event.date) >= now,
  );

  const cancelRegistration = async (id: string) => {
    try {
      const updated = await api.post<Registration>(`/api/registrations/${id}/cancel`, {});
      setRegistrations((prev) => prev.map((r) => (r.id === id ? updated : r)));
      toast.success("Zgłoszenie anulowane");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Nie udało się anulować");
    }
  };

  /** Dołącza URL dowodu wpłaty (płatne wydarzenia). */
  const attachProof = async (id: string) => {
    const url = (proofUrls[id] || "").trim();
    if (!url) {
      toast.error("Wgraj zdjęcie lub podaj URL potwierdzenia przelewu");
      return;
    }
    try {
      const updated = await api.post<Registration>(`/api/registrations/${id}/payment-proof`, {
        paymentProofUrl: url,
      });
      setRegistrations((prev) => prev.map((r) => (r.id === id ? updated : r)));
      toast.success("Potwierdzenie przelewu dołączone");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Nie udało się zapisać potwierdzenia");
    }
  };

  const roleBadge =
    user?.role === "ADMIN"
      ? "ADMIN"
      : user?.role === "ORGANIZER"
        ? "ORGANIZATOR"
        : "KIEROWCA";

  return (
    <div className="min-h-screen bg-[var(--race-bg)]">
      <div
        className="h-48 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(18, 18, 18, 0.7), rgba(18, 18, 18, 0.9)), url('${HERO_BG_RACE}')`,
        }}
      />

      <div className="container mx-auto px-4 -mt-20 pb-16">
        <Dialog open={googleWelcomeOpen} onOpenChange={setGoogleWelcomeOpen}>
          <DialogContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)]">
            <DialogHeader>
              <DialogTitle className="font-display" style={{ fontWeight: 800 }}>
                {t("authExtra.googleWelcomeTitle")}
              </DialogTitle>
              <DialogDescription className="text-[var(--race-muted)]">
                {t("authExtra.googleWelcomeBody")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                className="border-[var(--race-border)] text-[var(--race-fg)]"
                onClick={() => setGoogleWelcomeOpen(false)}
              >
                {t("authExtra.googleWelcomeLater")}
              </Button>
              <Button
                type="button"
                className="bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95"
                style={{ fontWeight: 700 }}
                onClick={() => {
                  setGoogleWelcomeOpen(false);
                  navigate("/konto");
                }}
              >
                {t("authExtra.googleWelcomeCta")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Reveal>
        <Card className="bg-[var(--race-card)] border-[var(--race-border)] mb-8 shadow-[var(--race-card-shadow)]">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="w-32 h-32 border-4 border-[var(--race-accent)]">
                <AvatarImage src={user?.avatar ?? undefined} alt={user?.username} />
                <AvatarFallback className="bg-[var(--race-accent)] text-[var(--race-on-accent)]" style={{ fontSize: "48px", fontWeight: 800 }}>
                  {userInitials(user ?? {})}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left">
                <h1 className="font-display text-[var(--race-fg)] mb-2" style={{ fontSize: "32px", fontWeight: 800 }}>
                  {user?.username}
                </h1>
                <p className="text-[var(--race-muted)] mb-4" style={{ fontSize: "16px" }}>
                  {user?.email}
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <Badge className="bg-[var(--race-accent)] text-[var(--race-on-accent)]" style={{ fontWeight: 700 }}>
                    <Trophy className="w-4 h-4 mr-1" />
                    {roleBadge}
                  </Badge>
                  <Badge variant="outline" className="border-[var(--race-border)] text-[var(--race-fg)]">
                    Członek od {user?.memberSince ?? "2026"}
                  </Badge>
                </div>
              </div>

              <Link to="/konto">
                <Button
                  className="bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95"
                  style={{ fontWeight: 700 }}
                >
                  EDYTUJ PROFIL
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        </Reveal>

        {user?.role === "USER" && (
          <Reveal delay={80}>
          <Card className="bg-[var(--race-card)] border-[var(--race-border)] mb-8 shadow-[var(--race-card-shadow)]">
            <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div className="flex items-start gap-3">
                <Flag className="w-8 h-8 text-[var(--race-accent)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[var(--race-fg)] font-semibold mb-1">Chcesz organizować wydarzenia?</p>
                  <p className="text-[var(--race-muted)] text-sm">
                    Złóż wniosek o konto organizatora – administrator rozpatrzy go w panelu.
                  </p>
                </div>
              </div>
              <Link to="/zostan-organizatorem">
                <Button
                  className="bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95 shrink-0"
                  style={{ fontWeight: 700 }}
                >
                  ZOSTAŃ ORGANIZATOREM
                </Button>
              </Link>
            </CardContent>
          </Card>
          </Reveal>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[var(--race-card)] border-[var(--race-border)]">
            <CardContent className="pt-6 text-center">
              <Calendar className="w-12 h-12 text-[var(--race-accent)] mx-auto mb-3" />
              <div className="font-display text-[var(--race-accent)] mb-1" style={{ fontSize: "36px", fontWeight: 800 }}>
                {upcomingRegistrations.length}
              </div>
              <p className="text-[var(--race-muted)]" style={{ fontWeight: 600 }}>
                Nadchodzące starty
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[var(--race-card)] border-[var(--race-border)]">
            <CardContent className="pt-6 text-center">
              <Car className="w-12 h-12 text-[var(--race-accent)] mx-auto mb-3" />
              <div className="font-display text-[var(--race-accent)] mb-1" style={{ fontSize: "36px", fontWeight: 800 }}>
                {cars.length}
              </div>
              <p className="text-[var(--race-muted)]" style={{ fontWeight: 600 }}>
                Auta w garażu
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[var(--race-card)] border-[var(--race-border)]">
            <CardContent className="pt-6 text-center">
              <Trophy className="w-12 h-12 text-[var(--race-accent)] mx-auto mb-3" />
              <div className="font-display text-[var(--race-accent)] mb-1" style={{ fontSize: "36px", fontWeight: 800 }}>
                {registrations.length}
              </div>
              <p className="text-[var(--race-muted)]" style={{ fontWeight: 600 }}>
                Wszystkie zgłoszenia
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-[var(--race-card)] border-[var(--race-border)]">
            <CardHeader>
              <CardTitle
                className="font-display text-[var(--race-fg)] flex items-center gap-2"
                style={{ fontSize: "24px", fontWeight: 800 }}
              >
                <Calendar className="w-6 h-6 text-[var(--race-accent)]" />
                Moje zgłoszenia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-[var(--race-muted)]">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--race-accent)]" />
                  Ładowanie...
                </div>
              ) : registrations.length === 0 ? (
                <p className="text-[var(--race-muted)] text-center py-8">Brak zgłoszeń. Zapisz się na wydarzenie!</p>
              ) : (
                registrations.map((reg, idx) => (
                  <div key={reg.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge
                            className={
                              isPositiveRegistration(reg.status)
                                ? "bg-[var(--race-accent)] text-[var(--race-on-accent)]"
                                : "bg-[var(--race-muted-bg)] text-[var(--race-fg)]"
                            }
                            style={{ fontWeight: 700, fontSize: "12px" }}
                          >
                            {registrationStatusLabel(reg.status)}
                          </Badge>
                          {reg.event?.paid && (
                            <Badge variant="outline" className="border-[var(--race-border)] text-[var(--race-accent)]">
                              Płatne
                              {reg.event.entryFee != null ? ` · ${reg.event.entryFee} PLN` : ""}
                            </Badge>
                          )}
                          {reg.event && (
                            <span className="text-[var(--race-muted)]" style={{ fontSize: "14px" }}>
                              {eventDateLabel(reg.event)}
                            </span>
                          )}
                        </div>
                        <h4 className="text-[var(--race-fg)] mb-1" style={{ fontWeight: 700 }}>
                          {reg.event?.name ?? "Wydarzenie"}
                        </h4>
                        {reg.event && (
                          <div className="flex items-center gap-4 text-[var(--race-muted)]" style={{ fontSize: "14px" }}>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {reg.event.track}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {reg.event.time}
                            </div>
                          </div>
                        )}
                        {reg.car && (
                          <p className="text-[var(--race-muted)] text-sm mt-1">
                            Auto: {reg.car.make} {reg.car.model}
                          </p>
                        )}
                        {reg.status === "ACCEPTED" && reg.event?.paid && (
                          <div className="mt-3 space-y-2">
                            {reg.event.bankAccount && (
                              <p className="text-sm text-[var(--race-muted)]">
                                Wpłać na konto: <span className="text-[var(--race-fg)]">{reg.event.bankAccount}</span>
                              </p>
                            )}
                            {reg.paymentProofUrl ? (
                              <p className="text-sm text-green-400">Potwierdzenie dołączone</p>
                            ) : (
                              <div className="space-y-2">
                                <ImageUploadField
                                  value={proofUrls[reg.id] || ""}
                                  onChange={(url) =>
                                    setProofUrls((prev) => ({ ...prev, [reg.id]: url }))
                                  }
                                  urlPlaceholder="https://…"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => attachProof(reg.id)}
                                  className="bg-[var(--race-accent)] text-[var(--race-on-accent)]"
                                  style={{ fontWeight: 700 }}
                                >
                                  Dołącz potwierdzenie
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {reg.event && (
                          <Link to={`/wydarzenia/${reg.event.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-[var(--race-accent)] text-[var(--race-accent)] hover:bg-[var(--race-accent)] hover:text-[var(--race-on-accent)] w-full"
                              style={{ fontWeight: 700 }}
                            >
                              SZCZEGÓŁY
                            </Button>
                          </Link>
                        )}
                        {isOpenRegistration(reg.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelRegistration(reg.id)}
                            className="border-red-900 text-red-400 hover:bg-red-950"
                          >
                            Anuluj
                          </Button>
                        )}
                      </div>
                    </div>
                    {idx < registrations.length - 1 && <Separator className="bg-[var(--race-muted-bg)] mt-4" />}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-[var(--race-card)] border-[var(--race-border)]">
            <CardHeader>
              <CardTitle
                className="font-display text-[var(--race-fg)] flex items-center gap-2"
                style={{ fontSize: "24px", fontWeight: 800 }}
              >
                <Car className="w-6 h-6 text-[var(--race-accent)]" />
                Mój garaż
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cars.length === 0 ? (
                <p className="text-[var(--race-muted)] text-center py-8">Brak aut w garażu.</p>
              ) : (
                cars.map((car, idx) => (
                  <div key={car.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-[var(--race-fg)]" style={{ fontWeight: 700 }}>
                          {car.make} {car.model}
                        </h4>
                        <p className="text-[var(--race-muted)] text-sm">
                          {car.year ?? "–"}
                          {car.className ? ` · ${car.className}` : ""}
                        </p>
                      </div>
                    </div>
                    {idx < cars.length - 1 && <Separator className="bg-[var(--race-muted-bg)] mt-4" />}
                  </div>
                ))
              )}
              <Link to="/garaz">
                <Button variant="ghost" className="w-full text-[var(--race-accent)] hover:bg-[var(--race-hover)]" style={{ fontWeight: 700 }}>
                  Zarządzaj garażem
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
