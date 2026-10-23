/**
 * AdminPanelPage – panel roli ADMIN (AuthGate roles=["ADMIN"]).
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
import { Reveal } from "../components/Reveal";

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
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  /** Równoległe załadowanie całego kokpitu admina. `silent` = odświeżenie bez spinnera. */
  const loadAll = async (silent = false) => {
    if (!silent) setLoading(true);
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
      if (!silent) toast.error(e instanceof ApiError ? e.message : "Nie udało się załadować panelu");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll(false);
    const id = window.setInterval(() => void loadAll(true), 30_000);
    const onFocus = () => void loadAll(true);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount + poll
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
          ? "Wydarzenie zaakceptowane – organizator został powiadomiony"
          : status === "REJECTED"
            ? "Wydarzenie odrzucone – organizator został powiadomiony"
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
  const deleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/admin/users/${deleteTarget.id}`);
      toast.success("Użytkownik usunięty");
      setDeleteTarget(null);
      await loadAll();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Nie udało się usunąć użytkownika");
    } finally {
      setDeleting(false);
    }
  };

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
          ? "Wniosek zaakceptowany – użytkownik ma teraz rolę organizatora"
          : "Wniosek odrzucony",
      );
      setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
      if (stats) {
        setStats({ ...stats, pendingApps: Math.max(0, stats.pendingApps - 1) });
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Błąd aktualizacji wniosku");
    }
  };

  const applicationStatusLabel = (status: string) => {
    if (status === "PENDING") return "Oczekuje";
    if (status === "APPROVED") return "Zaakceptowany";
    if (status === "REJECTED") return "Odrzucony";
    return status;
  };

  const sortedApplications = [...applications].sort((a, b) => {
    if (a.status === "PENDING" && b.status !== "PENDING") return -1;
    if (b.status === "PENDING" && a.status !== "PENDING") return 1;
    return (b.createdAt || "").localeCompare(a.createdAt || "");
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--race-muted)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--race-accent)] mr-3" />
        Ładowanie panelu admina...
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <section className="bg-[var(--race-card)] border-b border-[var(--race-border)] py-12">
        <Reveal className="container mx-auto px-4">
          <h1 className="font-display text-[var(--race-fg)] mb-2" style={{ fontSize: "40px", fontWeight: 800 }}>
            PANEL <span className="text-[var(--race-accent)]">ADMINA</span>
          </h1>
          <p className="text-[var(--race-muted)]">Zarządzanie użytkownikami, wydarzeniami i wnioskami organizatorów.</p>
        </Reveal>
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
            ].map(({ label, value, icon: Icon }, index) => (
              <Reveal key={label} delay={index * 70}>
                <Card className="bg-[var(--race-card)] border-[var(--race-border)] shadow-[var(--race-card-shadow)]">
                  <CardContent className="pt-6 text-center">
                    <Icon className="w-8 h-8 text-[var(--race-accent)] mx-auto mb-2" />
                    <div className="font-display text-[var(--race-accent)]" style={{ fontSize: "28px", fontWeight: 800 }}>
                      {value}
                    </div>
                    <p className="text-[var(--race-muted)] text-sm">{label}</p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        )}

        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="bg-[var(--race-card)] border border-[var(--race-border)] flex-wrap h-auto">
            <TabsTrigger value="events">Do akceptacji ({pendingEvents.length})</TabsTrigger>
            <TabsTrigger value="approved">Zatwierdzone ({approvedEvents.length})</TabsTrigger>
            <TabsTrigger value="users">Użytkownicy ({users.length})</TabsTrigger>
            <TabsTrigger value="applications">Wnioski ({applications.filter((a) => a.status === "PENDING").length})</TabsTrigger>
            <TabsTrigger value="bugs">Błędy</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            {pendingEvents.length === 0 ? (
              <p className="text-[var(--race-muted)] text-center py-8">Brak wydarzeń oczekujących na akceptację.</p>
            ) : (
              pendingEvents.map((event) => {
                const expanded = expandedId === event.id;
                return (
                  <Card key={event.id} className="bg-[var(--race-card)] border-[var(--race-border)]">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge className="bg-[var(--race-accent)] text-[var(--race-on-accent)]">{event.category}</Badge>
                            <Badge variant="outline" className="border-[var(--race-border)] text-[var(--race-fg)]">
                              {eventStatusLabel(event.status)}
                            </Badge>
                            {event.paid && (
                              <Badge variant="outline" className="border-[var(--race-accent)] text-[var(--race-accent)]">
                                Płatne
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-display text-[var(--race-fg)]" style={{ fontWeight: 800 }}>
                            {event.name}
                          </h3>
                          <p className="text-[var(--race-muted)] text-sm">
                            {event.track}, {event.city} · Organizator: {event.organizer?.username ?? "–"}
                          </p>
                          <p className="text-[var(--race-muted)] text-sm">
                            {event.dateLabel || formatEventDate(event.date)} · {event.time}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setExpandedId(expanded ? null : event.id)}
                            className="border-[var(--race-border)] text-[var(--race-fg)]"
                          >
                            {expanded ? (
                              <ChevronUp className="w-4 h-4 mr-1" />
                            ) : (
                              <ChevronDown className="w-4 h-4 mr-1" />
                            )}
                            Szczegóły
                          </Button>
                          <Button size="sm" asChild variant="outline" className="border-[var(--race-border)] text-[var(--race-fg)]">
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
                          <Button size="sm" variant="outline" onClick={() => updateEventStatus(event.id, "ARCHIVED")} className="border-[var(--race-border)] text-[var(--race-fg)]">
                            <Archive className="w-4 h-4 mr-1" />
                            Archiwum
                          </Button>
                        </div>
                      </div>

                      {expanded && (
                        <div className="border-t border-[var(--race-border)] pt-4 space-y-3 text-sm">
                          <div>
                            <p className="text-[var(--race-accent)] font-semibold mb-1">Opis</p>
                            <p className="text-[var(--race-muted)] whitespace-pre-wrap">{event.description || "–"}</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[var(--race-muted)]">
                            <p>
                              <span className="text-[var(--race-fg)]">Województwo:</span> {event.voivodeship}
                            </p>
                            <p>
                              <span className="text-[var(--race-fg)]">Ulica:</span> {event.street || "–"}
                            </p>
                            <p>
                              <span className="text-[var(--race-fg)]">Wpisowe:</span>{" "}
                              {event.paid ? formatEntryFee(event.entryFee) ?? "–" : "Bezpłatne"}
                            </p>
                            <p>
                              <span className="text-[var(--race-fg)]">Konto:</span> {event.bankAccount || "–"}
                            </p>
                            <p>
                              <span className="text-[var(--race-fg)]">Koniec:</span>{" "}
                              {event.endDate ? `${event.endDate}${event.endTime ? ` ${event.endTime}` : ""}` : "–"}
                            </p>
                            <p>
                              <span className="text-[var(--race-fg)]">Link:</span>{" "}
                              {event.externalUrl ? (
                                <a href={event.externalUrl} className="text-[var(--race-accent)] underline" target="_blank" rel="noreferrer">
                                  {event.externalUrl}
                                </a>
                              ) : (
                                "–"
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-[var(--race-fg)] mb-1">Wymagania</p>
                            <p className="text-[var(--race-muted)]">
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
              <p className="text-[var(--race-muted)] text-center py-8">Brak zatwierdzonych wydarzeń.</p>
            ) : (
              approvedEvents.map((event) => (
                <Card key={event.id} className="bg-[var(--race-card)] border-[var(--race-border)]">
                  <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge className="bg-[var(--race-accent)] text-[var(--race-on-accent)]">{event.category}</Badge>
                        <Badge variant="outline" className="border-green-800 text-green-400">
                          {eventStatusLabel(event.status)}
                        </Badge>
                      </div>
                      <h3 className="font-display text-[var(--race-fg)]" style={{ fontWeight: 800 }}>
                        {event.name}
                      </h3>
                      <p className="text-[var(--race-muted)] text-sm">
                        {event.track}, {event.city} · Organizator: {event.organizer?.username ?? "–"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" asChild variant="outline" className="border-[var(--race-border)] text-[var(--race-fg)]">
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
                      <Button size="sm" variant="outline" onClick={() => updateEventStatus(event.id, "ARCHIVED")} className="border-[var(--race-border)] text-[var(--race-fg)]">
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
              <Card key={user.id} className="bg-[var(--race-card)] border-[var(--race-border)]">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-[var(--race-fg)]" style={{ fontWeight: 700 }}>
                      {user.username}
                    </p>
                    <p className="text-[var(--race-muted)] text-sm">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={user.role}
                      onValueChange={(role) => updateUserRole(user.id, role)}
                      disabled={me?.id === user.id}
                    >
                      <SelectTrigger className="w-40 bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)] disabled:opacity-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)]">
                        <SelectItem value="USER">USER</SelectItem>
                        <SelectItem value="ORGANIZER">ORGANIZER</SelectItem>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                      </SelectContent>
                    </Select>
                    {me?.id !== user.id && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-red-800 text-red-400"
                        onClick={() => setDeleteTarget(user)}
                      >
                        Usuń
                      </Button>
                    )}
                  </div>
                  {me?.id === user.id && (
                    <p className="text-xs text-[var(--race-muted)] sm:absolute sm:sr-only">Nie możesz zmienić własnej roli</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
            {sortedApplications.length === 0 ? (
              <p className="text-[var(--race-muted)] text-center py-8">Brak wniosków o rolę organizatora.</p>
            ) : (
              sortedApplications.map((app) => (
                <Card key={app.id} className="bg-[var(--race-card)] border-[var(--race-border)]">
                  <CardHeader>
                    <CardTitle className="text-[var(--race-fg)] flex flex-wrap items-center gap-2" style={{ fontWeight: 700 }}>
                      {app.company}
                      <Badge
                        variant="outline"
                        className={
                          app.status === "PENDING"
                            ? "border-[var(--race-accent)] text-[var(--race-accent)]"
                            : app.status === "APPROVED"
                              ? "border-green-700 text-green-400"
                              : "border-red-800 text-red-400"
                        }
                      >
                        {applicationStatusLabel(app.status)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-[var(--race-muted)] text-sm">
                      {app.user?.username} ({app.user?.email})
                      {app.businessType ? ` · ${app.businessType}` : ""}
                    </p>
                    {app.createdAt && (
                      <p className="text-[#6b7280] text-xs">
                        Złożony: {new Date(app.createdAt).toLocaleString("pl-PL")}
                      </p>
                    )}
                    <p className="text-[var(--race-muted)] whitespace-pre-wrap">{app.message}</p>
                    {app.status === "PENDING" && (
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => updateApplication(app.id, "APPROVED")}
                          className="bg-green-700 hover:bg-green-600"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Zaakceptuj
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateApplication(app.id, "REJECTED")}
                          className="border-red-800 text-red-400"
                        >
                          <X className="w-4 h-4 mr-1" />
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

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)]">
          <DialogHeader>
            <DialogTitle className="font-display">Usuń użytkownika</DialogTitle>
            <DialogDescription className="text-[var(--race-muted)]">
              {deleteTarget
                ? `Usunąć konto ${deleteTarget.username} (${deleteTarget.email})? Zgłoszenia, auta i powiadomienia tego konta znikną. Wydarzenia, których był organizatorem, zostaną przypisane do Ciebie.`
                : "Usunąć to konto?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-[var(--race-border)] text-[var(--race-fg)]"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Anuluj
            </Button>
            <Button
              className="bg-red-800 hover:bg-red-700 text-[var(--race-fg)]"
              onClick={deleteUser}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Usuń konto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)]">
          <DialogHeader>
            <DialogTitle className="font-display">Odrzuć wydarzenie</DialogTitle>
            <DialogDescription className="text-[var(--race-muted)]">
              {rejectTarget
                ? `Podaj powód odrzucenia „${rejectTarget.name}". Organizator otrzyma powiadomienie i e-mail.`
                : "Podaj powód odrzucenia."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason" className="text-[var(--race-fg)]">
              Powód <span className="text-red-400">*</span>
            </Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Np. brak wymaganych informacji o torze, data w przeszłości, niekompletny opis…"
              className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)] min-h-[120px]"
              maxLength={2000}
            />
            <p className="text-xs text-[var(--race-muted)]">{rejectReason.trim().length}/2000</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-[var(--race-border)] text-[var(--race-fg)]"
              onClick={() => {
                setRejectTarget(null);
                setRejectReason("");
              }}
              disabled={rejecting}
            >
              Anuluj
            </Button>
            <Button
              className="bg-red-800 hover:bg-red-700 text-[var(--race-fg)]"
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
