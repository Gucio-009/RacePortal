import { useEffect, useState } from "react";
import { Users, Calendar, ClipboardList, Shield, Loader2, Check, X, Archive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { AdminStats, AdminUser, OrganizerApplication, ApiEvent } from "../lib/types";
import { eventStatusLabel } from "../lib/types";
import { toast } from "sonner";

interface PendingEvent extends ApiEvent {
  organizer?: { id: string; username: string; email: string } | null;
}

export function AdminPanelPage() {
  const { user: me } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);
  const [applications, setApplications] = useState<OrganizerApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, u, pe, apps] = await Promise.all([
        api.get<AdminStats>("/api/admin/stats"),
        api.get<AdminUser[]>("/api/admin/users"),
        api.get<PendingEvent[]>("/api/admin/events/pending"),
        api.get<OrganizerApplication[]>("/api/admin/organizer-applications"),
      ]);
      setStats(s);
      setUsers(u);
      setPendingEvents(pe);
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

  const updateEventStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/api/admin/events/${id}/status`, { status });
      toast.success(`Status wydarzenia: ${status}`);
      setPendingEvents((prev) => prev.filter((e) => e.id !== id));
      if (stats) setStats({ ...stats, pendingEvents: Math.max(0, stats.pendingEvents - 1) });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Błąd aktualizacji");
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
      toast.success(`Wniosek: ${status}`);
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
        <Loader2 className="w-8 h-8 animate-spin text-[#FFD700] mr-3" />
        Ładowanie panelu admina...
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <section className="bg-[#1a1a1a] border-b border-[#2a2a2a] py-12">
        <div className="container mx-auto px-4">
          <h1 className="font-['Orbitron'] text-white mb-2" style={{ fontSize: "40px", fontWeight: 900 }}>
            PANEL <span className="text-[#FFD700]">ADMINA</span>
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
                  <Icon className="w-8 h-8 text-[#FFD700] mx-auto mb-2" />
                  <div className="font-['Orbitron'] text-[#FFD700]" style={{ fontSize: "28px", fontWeight: 900 }}>
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
            <TabsTrigger value="events">Wydarzenia ({pendingEvents.length})</TabsTrigger>
            <TabsTrigger value="users">Użytkownicy ({users.length})</TabsTrigger>
            <TabsTrigger value="applications">Wnioski ({applications.filter((a) => a.status === "PENDING").length})</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            {pendingEvents.length === 0 ? (
              <p className="text-[#9ca3af] text-center py-8">Brak wydarzeń oczekujących na akceptację.</p>
            ) : (
              pendingEvents.map((event) => (
                <Card key={event.id} className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge className="bg-[#FFD700] text-[#121212]">{event.category}</Badge>
                        <Badge variant="outline" className="border-[#2a2a2a] text-white">
                          {eventStatusLabel(event.status)}
                        </Badge>
                      </div>
                      <h3 className="font-['Orbitron'] text-white" style={{ fontWeight: 800 }}>
                        {event.name}
                      </h3>
                      <p className="text-[#9ca3af] text-sm">
                        {event.track}, {event.city} · Organizator: {event.organizer?.username ?? "—"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => updateEventStatus(event.id, "APPROVED")} className="bg-green-700 hover:bg-green-600">
                        <Check className="w-4 h-4 mr-1" />
                        Akceptuj
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateEventStatus(event.id, "REJECTED")} className="border-red-800 text-red-400">
                        <X className="w-4 h-4 mr-1" />
                        Odrzuć
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
        </Tabs>
      </section>
    </div>
  );
}
