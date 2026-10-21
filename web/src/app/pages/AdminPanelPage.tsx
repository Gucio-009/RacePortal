/**
 * AdminPanelPage — panel roli ADMIN (AuthGate roles=["ADMIN"]).
 *
 * Cel: przegląd statystyk, akceptacja/odrzucanie wydarzeń (z powodem),
 * zmiana ról użytkowników, rozpatrywanie wniosków „zostań organizatorem”.
 * Wzorce: Promise.all na mount (stats, users, pending events, applications),
 * Tabs + mutate przez api.patch z JWT (`raceportal_token`).
 * Auth: tylko ADMIN; własnej roli nie można zmienić (disabled Select gdy me.id === user.id).
 * Theme: `--race-accent`, `font-display`.
 * Docker/nginx: deep link panelu admina → SPA try_files.
 *
 * Pomysł (alt): TanStack Query + optimistic updates; osobny admin shell; RBAC UI generator;
 * Next.js App Router z middleware ochrony roli.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Users,
  Calendar,
  ClipboardList,
  Shield,
  Loader2,
  Check,
  X,
  Archive,
  Ban,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { AdminStats, AdminUser, OrganizerApplication, ApiEvent } from "../lib/types";
import { eventStatusLabel, formatEventDate, formatEntryFee } from "../lib/types";
import { toast } from "sonner";
import { AdminBugReports } from "../components/AdminBugReports";

interface PendingEvent extends ApiEvent {
  organizer?: { id: string; username: string; email: string } | null;
}

export function AdminPanelPage() {
  const { user: me } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);
  const [approvedEvents, setApprovedEvents] = useState<PendingEvent[]>([]);
  const [applications, setApplications] = useState<OrganizerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingEvent | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  /** Równoległe załadowanie całego kokpitu admina. */
  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, u, pe, ae, apps] = await Promise.all([
        api.get<AdminStats>("/api/admin/stats"),
        api.get<AdminUser[]>("/api/admin/users"),
        api.get<PendingEvent[]>("/api/admin/events/pending"),
        api.get<PendingEvent[]>("/api/admin/events/approved"),
        api.get<OrganizerApplication[]>("/api/admin/organizer-applications"),
      ]);
      setStats(s);
      setUsers(u);
      setPendingEvents(pe);
      setApprovedEvents(ae);
      setApplications(apps);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Nie udało się załadować panelu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  /** APPROVED / REJECTED / ARCHIVED / CANCELLED. */
  const updateEventStatus = async (id: string, status: string, reason?: string) => {
    try {
      await api.patch(`/api/admin/events/${id}/status`, {
        status,
        ...(reason != null ? { reason } : {}),
      });
      toast.success(
        status === "APPROVED"
          ? "Wydarzenie zaakceptowane — organizator został powiadomiony"
          : status === "REJECTED"
            ? "Wydarzenie odrzucone — organizator został powiadomiony"
            : `Status wydarzenia: ${status}`,
      );
      setPendingEvents((prev) => prev.filter((e) => e.id !== id));
      if (status === "CANCELLED" || status === "ARCHIVED" || status === "REJECTED") {
        setApprovedEvents((prev) => prev.filter((e) => e.id !== id));
      }
      if (status === "APPROVED") {
        loadAll();
        return;
      }
      if (stats && status !== "CANCELLED") {
        setStats({ ...stats, pendingEvents: Math.max(0, stats.pendingEvents - 1) });
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Błąd aktualizacji");
      throw e;
    }
  };

  const cancelApprovedEvent = async (id: string) => {
    if (!confirm("Anulować to zatwierdzone wydarzenie? Zgłoszenia uczestników zostaną anulowane.")) return;
    await updateEventStatus(id, "CANCELLED");
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (!reason) {
      toast.error("Podaj powód odrzucenia");
      return;
    }
    setRejecting(true);
    try {
      await updateEventStatus(rejectTarget.id, "REJECTED", reason);
      setRejectTarget(null);
      setRejectReason("");
    } catch {
      /* toast already shown */
    } finally {
      setRejecting(false);
    }
  };

  /** Zmiana roli USER / ORGANIZER / ADMIN (nie dla własnego konta w UI). */
  const updateUserRole = async (id: string, role: string) => {
    try {
      const updated = await api.patch<AdminUser>(`/api/admin/users/${id}/role`, { role });
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      toast.success(`Rola użytkownika: ${role}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Błąd zmiany roli");
    }
  };

  const updateApplication = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      await api.patch(`/api/admin/organizer-applications/${id}`, { status });
      toast.success(
        status === "APPROVED"
          ? "Wniosek APPROVED — użytkownik powinien otworzyć Panel org. (sesja odświeży się automatycznie)"
          : `Wniosek: ${status}`,
      );
      setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
      if (stats && status === "APPROVED") {
        setStats({ ...stats, pendingApps: Math.max(0, stats.pendingApps - 1) });
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Błąd aktualizacji wniosku");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#9ca3af]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--race-accent)] mr-3" />
        Ładowanie panelu admina...
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <section className="bg-[#1a1a1a] border-b border-[#2a2a2a] py-12">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-white mb-2" style={{ fontSize: "40px", fontWeight: 800 }}>
            PANEL <span className="text-[var(--race-accent)]">ADMINA</span>
          </h1>
          <p className="text-[#9ca3af]">Zarządzanie użytkownikami, wydarzeniami i wnioskami organizatorów.</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 space-y-8">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Użytkownicy", value: stats.users, icon: Users },
              { label: "Wydarzenia", value: stats.events, icon: Calendar },
              { label: "Oczekujące", value: stats.pendingEvents, icon: ClipboardList },
              { label: "Zgłoszenia", value: stats.registrations, icon: Shield },
              { label: "Wnioski org.", value: stats.pendingApps, icon: Shield },
            ].map(({ label, value, icon: Icon }) => (
              <Card key={label} className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardContent className="pt-6 text-center">
                  <Icon className="w-8 h-8 text-[var(--race-accent)] mx-auto mb-2" />
                  <div className="font-display text-[var(--race-accent)]" style={{ fontSize: "28px", fontWeight: 800 }}>
                    {value}
                  </div>
                  <p className="text-[#9ca3af] text-sm">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="bg-[#1a1a1a] border border-[#2a2a2a] flex-wrap h-auto">
            <TabsTrigger value="events">Do akceptacji ({pendingEvents.length})</TabsTrigger>
            <TabsTrigger value="approved">Zatwierdzone ({approvedEvents.length})</TabsTrigger>
            <TabsTrigger value="users">Użytkownicy ({users.length})</TabsTrigger>
            <TabsTrigger value="applications">Wnioski ({applications.filter((a) => a.status === "PENDING").length})</TabsTrigger>
            <TabsTrigger value="bugs">Błędy</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            {pendingEvents.length === 0 ? (
              <p className="text-[#9ca3af] text-center py-8">Brak wydarzeń oczekujących na akceptację.</p>
            ) : (
              pendingEvents.map((event) => {
                const expanded = expandedId === event.id;
                return (
                  <Card key={event.id} className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge className="bg-[var(--race-accent)] text-[#121212]">{event.category}</Badge>
                            <Badge variant="outline" className="border-[#2a2a2a] text-white">
                              {eventStatusLabel(event.status)}
                            </Badge>
                            {event.paid && (
                              <Badge variant="outline" className="border-[var(--race-accent)] text-[var(--race-accent)]">
                                Płatne
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-display text-white" style={{ fontWeight: 800 }}>
                            {event.name}
                          </h3>
                          <p className="text-[#9ca3af] text-sm">
                            {event.track}, {event.city} · Organizator: {event.organizer?.username ?? "—"}
                          </p>
                          <p className="text-[#9ca3af] text-sm">
                            {event.dateLabel || formatEventDate(event.date)} · {event.time}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setExpandedId(expanded ? null : event.id)}
                            className="border-[#2a2a2a] text-white"
                          >
                            {expanded ? (
                              <ChevronUp className="w-4 h-4 mr-1" />
                            ) : (
                              <ChevronDown className="w-4 h-4 mr-1" />
                            )}
                            Szczegóły
                          </Button>
                          <Button size="sm" asChild variant="outline" className="border-[#2a2a2a] text-white">
                            <Link to={`/wydarzenia/${event.id}`}>
                              <Eye className="w-4 h-4 mr-1" />
                              Podgląd
                            </Link>
                          </Button>
                          <Button size="sm" onClick={() => updateEventStatus(event.id, "APPROVED")} className="bg-green-700 hover:bg-green-600">
                            <Check className="w-4 h-4 mr-1" />
                            Akceptuj
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRejectTarget(event);
                              setRejectReason("");
                            }}
                            className="border-red-800 text-red-400"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Odrzuć
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateEventStatus(event.id, "ARCHIVED")} className="border-[#2a2a2a] text-white">
                            <Archive className="w-4 h-4 mr-1" />
                            Archiwum
                          </Button>
                        </div>
                      </div>

                      {expanded && (
                        <div className="border-t border-[#2a2a2a] pt-4 space-y-3 text-sm">
                          <div>
                            <p className="text-[var(--race-accent)] font-semibold mb-1">Opis</p>
                            <p className="text-[#9ca3af] whitespace-pre-wrap">{event.description || "—"}</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#9ca3af]">
                            <p>
                              <span className="text-white">Województwo:</span> {event.voivodeship}
                            </p>
                            <p>
                              <span className="text-white">Ulica:</span> {event.street || "—"}
                            </p>
                            <p>
                              <span className="text-white">Wpisowe:</span>{" "}
                              {event.paid ? formatEntryFee(event.entryFee) ?? "—" : "Bezpłatne"}
                            </p>
                            <p>
                              <span className="text-white">Konto:</span> {event.bankAccount || "—"}
                            </p>
                            <p>
                              <span className="text-white">Koniec:</span>{" "}
                              {event.endDate ? `${event.endDate}${event.endTime ? ` ${event.endTime}` : ""}` : "—"}
                            </p>
                            <p>
                              <span className="text-white">Link:</span>{" "}
                              {event.externalUrl ? (
                                <a href={event.externalUrl} className="text-[var(--race-accent)] underline" target="_blank" rel="noreferrer">
                                  {event.externalUrl}
                                </a>
                              ) : (
                                "—"
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-white mb-1">Wymagania</p>
                            <p className="text-[#9ca3af]">
                              {[
                                event.requireDrivingLicense && "prawo jazdy B",
                                event.requirePzmLicense && "licencja PZM",
                                event.requireOc && "OC",
                                event.requirePt && "PT",
                                event.requireCage && "klatka",
                                event.requireRegistered && "pojazd zarejestrowany",
                              ]
                                .filter(Boolean)
                                .join(", ") || "brak dodatkowych wymagań"}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedEvents.length === 0 ? (
              <p className="text-[#9ca3af] text-center py-8">Brak zatwierdzonych wydarzeń.</p>
            ) : (
              approvedEvents.map((event) => (
                <Card key={event.id} className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge className="bg-[var(--race-accent)] text-[#121212]">{event.category}</Badge>
                        <Badge variant="outline" className="border-green-800 text-green-400">
                          {eventStatusLabel(event.status)}
                        </Badge>
                      </div>
                      <h3 className="font-display text-white" style={{ fontWeight: 800 }}>
                        {event.name}
                      </h3>
                      <p className="text-[#9ca3af] text-sm">
                        {event.track}, {event.city} · Organizator: {event.organizer?.username ?? "—"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" asChild variant="outline" className="border-[#2a2a2a] text-white">
                        <Link to={`/wydarzenia/${event.id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          Podgląd
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelApprovedEvent(event.id)}
                        className="border-red-900 text-red-400 hover:bg-red-950"
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        Anuluj wydarzenie
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateEventStatus(event.id, "ARCHIVED")} className="border-[#2a2a2a] text-white">
                        <Archive className="w-4 h-4 mr-1" />
                        Archiwum
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-3">
            {users.map((user) => (
              <Card key={user.id} className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-white" style={{ fontWeight: 700 }}>
                      {user.username}
                    </p>
                    <p className="text-[#9ca3af] text-sm">{user.email}</p>
                  </div>
                  <Select
                    value={user.role}
                    onValueChange={(role) => updateUserRole(user.id, role)}
                    disabled={me?.id === user.id}
                  >
                    <SelectTrigger className="w-40 bg-[#121212] border-[#2a2a2a] text-white disabled:opacity-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                      <SelectItem value="USER">USER</SelectItem>
                      <SelectItem value="ORGANIZER">ORGANIZER</SelectItem>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>
                    </SelectContent>
                  </Select>
                  {me?.id === user.id && (
                    <p className="text-xs text-[#9ca3af] sm:absolute sm:sr-only">Nie możesz zmienić własnej roli</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
            {applications.length === 0 ? (
              <p className="text-[#9ca3af] text-center py-8">Brak wniosków.</p>
            ) : (
              applications.map((app) => (
                <Card key={app.id} className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <CardHeader>
                    <CardTitle className="text-white flex flex-wrap items-center gap-2" style={{ fontWeight: 700 }}>
                      {app.company}
                      <Badge variant="outline" className="border-[#2a2a2a] text-white">
                        {app.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-[#9ca3af] text-sm">
                      {app.user?.username} ({app.user?.email})
                    </p>
                    <p className="text-[#9ca3af]">{app.message}</p>
                    {app.status === "PENDING" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateApplication(app.id, "APPROVED")} className="bg-green-700 hover:bg-green-600">
                          Zatwierdź
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateApplication(app.id, "REJECTED")} className="border-red-800 text-red-400">
                          Odrzuć
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="bugs">
            <AdminBugReports />
          </TabsContent>
        </Tabs>
      </section>

      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
          <DialogHeader>
            <DialogTitle className="font-display">Odrzuć wydarzenie</DialogTitle>
            <DialogDescription className="text-[#9ca3af]">
              {rejectTarget
                ? `Podaj powód odrzucenia „${rejectTarget.name}". Organizator otrzyma powiadomienie i e-mail.`
                : "Podaj powód odrzucenia."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason" className="text-white">
              Powód <span className="text-red-400">*</span>
            </Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Np. brak wymaganych informacji o torze, data w przeszłości, niekompletny opis…"
              className="bg-[#121212] border-[#2a2a2a] text-white min-h-[120px]"
              maxLength={2000}
            />
            <p className="text-xs text-[#9ca3af]">{rejectReason.trim().length}/2000</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-[#2a2a2a] text-white"
              onClick={() => {
                setRejectTarget(null);
                setRejectReason("");
              }}
              disabled={rejecting}
            >
              Anuluj
            </Button>
            <Button
              className="bg-red-800 hover:bg-red-700 text-white"
              onClick={submitReject}
              disabled={rejecting || !rejectReason.trim()}
            >
              {rejecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
              Odrzuć wydarzenie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
