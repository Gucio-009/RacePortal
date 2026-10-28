/**
 * AdminPanelPage – panel roli ADMIN (AuthGate roles=["ADMIN"]).
 *
 * Cel: przegląd statystyk, akceptacja/odrzucanie wydarzeń (z powodem),
 * zmiana ról użytkowników (szukaj nazwa/e-mail + filtr roli), zatwierdzone eventy
 * (szukaj nazwa/org/tor + filtr kategorii), wnioski „zostań organizatorem”.
 * Wzorce: Promise.all na mount (stats, users, pending events, applications),
 * Tabs + mutate przez api.patch; filtry userów/zatwierdzonych client-side.
 * Auth: tylko ADMIN; własnej roli nie można zmienić (disabled Select gdy me.id === user.id).
 * Theme: `--race-accent`, `font-display`.
 * Docker/nginx: deep link panelu admina → SPA try_files.
 *
 * Pomysł (alt): TanStack Query + optimistic updates; osobny admin shell; RBAC UI generator;
 * Next.js App Router z middleware ochrony roli.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
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
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../components/ui/select";
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
import { formatEventDate, formatEntryFee } from "../lib/types";
import { EVENT_CATEGORY_GROUPS } from "../lib/eventCategories";
import { toast } from "sonner";
import { AdminBugReports } from "../components/AdminBugReports";
import { Reveal } from "../components/Reveal";

interface PendingEvent extends ApiEvent {
  organizer?: { id: string; username: string; email: string; verified?: boolean } | null;
}

export function AdminPanelPage() {
  const { t, i18n } = useTranslation();
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
  const [userQuery, setUserQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "USER" | "ORGANIZER" | "ADMIN">("all");
  const [approvedQuery, setApprovedQuery] = useState("");
  const [approvedCategory, setApprovedCategory] = useState("all");

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
      if (!silent) toast.error(e instanceof ApiError ? e.message : t("admin.loadFail"));
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
          ? t("admin.eventApproved")
          : status === "REJECTED"
            ? t("admin.eventRejected")
            : t("admin.eventStatusChanged", { status }),
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
      toast.error(e instanceof ApiError ? e.message : t("admin.updateFail"));
      throw e;
    }
  };

  const cancelApprovedEvent = async (id: string) => {
    if (!confirm(t("admin.cancelEventConfirm"))) return;
    await updateEventStatus(id, "CANCELLED");
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (!reason) {
      toast.error(t("admin.rejectReasonRequired"));
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
      toast.success(t("admin.userDeleted"));
      setDeleteTarget(null);
      await loadAll();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("admin.userDeleteFail"));
    } finally {
      setDeleting(false);
    }
  };

  const updateUserRole = async (id: string, role: string) => {
    try {
      const updated = await api.patch<AdminUser>(`/api/admin/users/${id}/role`, { role });
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      toast.success(t("admin.roleChanged", { role }));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("admin.roleChangeFail"));
    }
  };

  const updateApplication = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      await api.patch(`/api/admin/organizer-applications/${id}`, { status });
      toast.success(
        status === "APPROVED"
          ? t("admin.appApproved")
          : t("admin.appRejected"),
      );
      setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
      if (stats) {
        setStats({ ...stats, pendingApps: Math.max(0, stats.pendingApps - 1) });
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("admin.appUpdateFail"));
    }
  };

  const applicationStatusLabel = (status: string) => {
    if (status === "PENDING") return t("admin.appStatusPending");
    if (status === "APPROVED") return t("admin.appStatusApproved");
    if (status === "REJECTED") return t("admin.appStatusRejected");
    return status;
  };

  const sortedApplications = [...applications].sort((a, b) => {
    if (a.status === "PENDING" && b.status !== "PENDING") return -1;
    if (b.status === "PENDING" && a.status !== "PENDING") return 1;
    return (b.createdAt || "").localeCompare(a.createdAt || "");
  });

  const q = userQuery.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    const matchesQuery =
      !q ||
      user.username.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q);
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesQuery && matchesRole;
  });

  const aq = approvedQuery.trim().toLowerCase();
  const filteredApprovedEvents = approvedEvents.filter((event) => {
    const matchesQuery =
      !aq ||
      event.name.toLowerCase().includes(aq) ||
      (event.organizer?.username ?? "").toLowerCase().includes(aq) ||
      (event.track ?? "").toLowerCase().includes(aq);
    const matchesCategory = approvedCategory === "all" || event.category === approvedCategory;
    return matchesQuery && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--race-muted)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--race-accent)] mr-3" />
        {t("admin.loading")}
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <section className="bg-[var(--race-card)] border-b border-[var(--race-border)] py-12">
        <Reveal className="container mx-auto px-4">
          <h1 className="font-display text-[var(--race-fg)] mb-2" style={{ fontSize: "40px", fontWeight: 800 }}>
            {t("admin.titleBefore")} <span className="text-[var(--race-accent)]">{t("admin.titleAccent")}</span>
          </h1>
          <p className="text-[var(--race-muted)]">{t("admin.subtitle")}</p>
        </Reveal>
      </section>

      <section className="container mx-auto px-4 py-10 space-y-8">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: t("admin.users"), value: stats.users, icon: Users },
              { label: t("admin.events"), value: stats.events, icon: Calendar },
              { label: t("admin.pending"), value: stats.pendingEvents, icon: ClipboardList },
              { label: t("admin.registrations"), value: stats.registrations, icon: Shield },
              { label: t("admin.applications"), value: stats.pendingApps, icon: Shield },
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
            <TabsTrigger value="events">{t("admin.tabPending", { count: pendingEvents.length })}</TabsTrigger>
            <TabsTrigger value="approved">{t("admin.tabApproved", { count: approvedEvents.length })}</TabsTrigger>
            <TabsTrigger value="users">{t("admin.tabUsers", { count: users.length })}</TabsTrigger>
            <TabsTrigger value="applications">{t("admin.tabApplications", { count: applications.filter((a) => a.status === "PENDING").length })}</TabsTrigger>
            <TabsTrigger value="bugs">{t("admin.bugs")}</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            {pendingEvents.length === 0 ? (
              <p className="text-[var(--race-muted)] text-center py-8">{t("admin.noPendingEvents")}</p>
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
                              {t(`eventStatus.${event.status}`, { defaultValue: event.status })}
                            </Badge>
                            {event.paid && (
                              <Badge variant="outline" className="border-[var(--race-accent)] text-[var(--race-accent)]">
                                {t("common.paid")}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-display text-[var(--race-fg)]" style={{ fontWeight: 800 }}>
                            {event.name}
                          </h3>
                          <p className="text-[var(--race-muted)] text-sm">
                            {event.track}, {event.city} · {t("admin.organizerLabel", { name: event.organizer?.username ?? "–" })}
                            {event.organizer?.verified ? " ✓" : ""}
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
                            {t("events.details")}
                          </Button>
                          <Button size="sm" asChild variant="outline" className="border-[var(--race-border)] text-[var(--race-fg)]">
                            <Link to={`/wydarzenia/${event.id}`}>
                              <Eye className="w-4 h-4 mr-1" />
                              {t("admin.preview")}
                            </Link>
                          </Button>
                          <Button size="sm" onClick={() => updateEventStatus(event.id, "APPROVED")} className="bg-green-700 hover:bg-green-600">
                            <Check className="w-4 h-4 mr-1" />
                            {t("admin.accept")}
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
                            {t("admin.reject")}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateEventStatus(event.id, "ARCHIVED")} className="border-[var(--race-border)] text-[var(--race-fg)]">
                            <Archive className="w-4 h-4 mr-1" />
                            {t("admin.archive")}
                          </Button>
                        </div>
                      </div>

                      {expanded && (
                        <div className="border-t border-[var(--race-border)] pt-4 space-y-3 text-sm">
                          <div>
                            <p className="text-[var(--race-accent)] font-semibold mb-1">{t("events.description")}</p>
                            <p className="text-[var(--race-muted)] whitespace-pre-wrap">{event.description || "–"}</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[var(--race-muted)]">
                            <p>
                              <span className="text-[var(--race-fg)]">{t("events.voivodeship")}:</span> {event.voivodeship}
                            </p>
                            <p>
                              <span className="text-[var(--race-fg)]">{t("events.street")}:</span> {event.street || "–"}
                            </p>
                            <p>
                              <span className="text-[var(--race-fg)]">{t("events.entryFee")}:</span>{" "}
                              {event.paid ? formatEntryFee(event.entryFee) ?? "–" : t("events.freeEntry")}
                            </p>
                            <p>
                              <span className="text-[var(--race-fg)]">{t("events.bankAccount")}:</span> {event.bankAccount || "–"}
                            </p>
                            <p>
                              <span className="text-[var(--race-fg)]">{t("events.end")}:</span>{" "}
                              {event.endDate ? `${event.endDate}${event.endTime ? ` ${event.endTime}` : ""}` : "–"}
                            </p>
                            <p>
                              <span className="text-[var(--race-fg)]">{t("events.link")}:</span>{" "}
                              {event.externalUrl && /^https?:\/\//i.test(event.externalUrl) ? (
                                <a href={event.externalUrl} className="text-[var(--race-accent)] underline" target="_blank" rel="noopener noreferrer">
                                  {event.externalUrl}
                                </a>
                              ) : (
                                "–"
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-[var(--race-fg)] mb-1">{t("events.requirements")}</p>
                            <p className="text-[var(--race-muted)]">
                              {[
                                event.requireDrivingLicense && t("events.reqLicenseB"),
                                event.requirePzmLicense && t("events.reqPzm"),
                                event.requireDrivingLicenseOrPzm && t("events.reqLicenseOrPzm"),
                                event.requireOc && t("events.reqOc"),
                                event.requirePt && t("events.reqPt"),
                                event.requireCage && t("events.reqCage"),
                                event.requireRegistered && t("events.reqRegistered"),
                              ]
                                .filter(Boolean)
                                .join(", ") || t("events.reqNone")}
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
            {approvedEvents.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--race-muted)]" />
                  <Input
                    value={approvedQuery}
                    onChange={(e) => setApprovedQuery(e.target.value)}
                    placeholder={t("admin.searchApprovedEvents")}
                    className="pl-10 bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)]"
                  />
                </div>
                <Select value={approvedCategory} onValueChange={setApprovedCategory}>
                  <SelectTrigger className="w-full sm:w-56 bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)]">
                    <SelectValue placeholder={t("events.category")} />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)] max-h-72">
                    <SelectItem value="all">{t("events.allCategories")}</SelectItem>
                    {EVENT_CATEGORY_GROUPS.map((g) => (
                      <SelectGroup key={g.group}>
                        <SelectLabel className="text-[var(--race-accent)]">{g.group}</SelectLabel>
                        {g.items.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {approvedEvents.length === 0 ? (
              <p className="text-[var(--race-muted)] text-center py-8">{t("admin.noApprovedEvents")}</p>
            ) : filteredApprovedEvents.length === 0 ? (
              <p className="text-[var(--race-muted)] text-center py-8">{t("admin.noApprovedMatch")}</p>
            ) : (
              filteredApprovedEvents.map((event) => (
                <Card key={event.id} className="bg-[var(--race-card)] border-[var(--race-border)]">
                  <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge className="bg-[var(--race-accent)] text-[var(--race-on-accent)]">{event.category}</Badge>
                        <Badge variant="outline" className="border-green-800 text-green-400">
                          {t(`eventStatus.${event.status}`, { defaultValue: event.status })}
                        </Badge>
                      </div>
                      <h3 className="font-display text-[var(--race-fg)]" style={{ fontWeight: 800 }}>
                        {event.name}
                      </h3>
                      <p className="text-[var(--race-muted)] text-sm">
                        {event.track}, {event.city} · {t("admin.organizerLabel", { name: event.organizer?.username ?? "–" })}
                        {event.organizer?.verified ? " ✓" : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" asChild variant="outline" className="border-[var(--race-border)] text-[var(--race-fg)]">
                        <Link to={`/wydarzenia/${event.id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          {t("admin.preview")}
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelApprovedEvent(event.id)}
                        className="border-red-900 text-red-400 hover:bg-red-950"
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        {t("admin.cancelEvent")}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateEventStatus(event.id, "ARCHIVED")} className="border-[var(--race-border)] text-[var(--race-fg)]">
                        <Archive className="w-4 h-4 mr-1" />
                        {t("admin.archive")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 mb-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--race-muted)]" />
                <Input
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder={t("admin.searchUsers")}
                  className="pl-10 bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)]"
                />
              </div>
              <Select
                value={roleFilter}
                onValueChange={(value) =>
                  setRoleFilter(value as "all" | "USER" | "ORGANIZER" | "ADMIN")
                }
              >
                <SelectTrigger className="w-full sm:w-48 bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)]">
                  <SelectItem value="all">{t("admin.allRoles")}</SelectItem>
                  <SelectItem value="USER">user</SelectItem>
                  <SelectItem value="ORGANIZER">organizer</SelectItem>
                  <SelectItem value="ADMIN">admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {filteredUsers.length === 0 ? (
              <p className="text-[var(--race-muted)] text-center py-8">{t("admin.noUsersMatch")}</p>
            ) : (
              filteredUsers.map((user) => (
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
                          {t("admin.deleteUser")}
                        </Button>
                      )}
                    </div>
                    {me?.id === user.id && (
                      <p className="text-xs text-[var(--race-muted)] sm:absolute sm:sr-only">{t("admin.cannotChangeOwnRole")}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
            {sortedApplications.length === 0 ? (
              <p className="text-[var(--race-muted)] text-center py-8">{t("admin.noApplications")}</p>
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
                        {t("admin.submittedAt", { date: new Date(app.createdAt).toLocaleString(i18n.language === "en" ? "en-GB" : "pl-PL") })}
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
                          {t("admin.accept")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateApplication(app.id, "REJECTED")}
                          className="border-red-800 text-red-400"
                        >
                          <X className="w-4 h-4 mr-1" />
                          {t("admin.reject")}
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
            <DialogTitle className="font-display">{t("admin.deleteUserTitle")}</DialogTitle>
            <DialogDescription className="text-[var(--race-muted)]">
              {deleteTarget
                ? t("admin.deleteUserDesc", { username: deleteTarget.username, email: deleteTarget.email })
                : t("admin.deleteUserFallback")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-[var(--race-border)] text-[var(--race-fg)]"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="bg-red-800 hover:bg-red-700 text-[var(--race-fg)]"
              onClick={deleteUser}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {t("admin.deleteAccount")}
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
            <DialogTitle className="font-display">{t("admin.rejectEventTitle")}</DialogTitle>
            <DialogDescription className="text-[var(--race-muted)]">
              {rejectTarget
                ? t("admin.rejectEventDesc", { name: rejectTarget.name })
                : t("admin.rejectEventDescFallback")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason" className="text-[var(--race-fg)]">
              {t("admin.reason")} <span className="text-red-400">*</span>
            </Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t("admin.rejectPlaceholder")}
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
              {t("common.cancel")}
            </Button>
            <Button
              className="bg-red-800 hover:bg-red-700 text-[var(--race-fg)]"
              onClick={submitReject}
              disabled={rejecting || !rejectReason.trim()}
            >
              {rejecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
              {t("admin.rejectSubmit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
