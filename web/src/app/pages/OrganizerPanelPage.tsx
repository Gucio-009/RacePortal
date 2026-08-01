import { useEffect, useState } from "react";
import { Calendar, Plus, Users, Loader2, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { api, ApiError } from "../lib/api";
import type { ApiEvent, Registration } from "../lib/types";
import { eventStatusLabel, registrationStatusLabel, formatEventDate } from "../lib/types";
import { toast } from "sonner";

interface OrganizerEvent extends ApiEvent {
  _count?: { registrations: number };
}

const emptyForm = {
  name: "",
  description: "",
  category: "",
  date: "",
  time: "10:00",
  track: "",
  city: "",
  voivodeship: "",
  imageUrl: "",
  lat: "",
  lng: "",
};

export function OrganizerPanelPage() {
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("events");
  const [form, setForm] = useState(emptyForm);

  const loadEvents = () => {
    setLoading(true);
    api
      .get<OrganizerEvent[]>("/api/organizer/events")
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const loadRegistrations = async (eventId: string) => {
    setSelectedEventId(eventId);
    setActiveTab("registrations");
    try {
      const items = await api.get<Registration[]>(`/api/registrations/event/${eventId}`);
      setRegistrations(items);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Nie udało się załadować zgłoszeń");
      setRegistrations([]);
    }
  };

  const handleCreate = async () => {
    if (!form.name || !form.description || !form.category || !form.date || !form.track || !form.city || !form.voivodeship) {
      toast.error("Wypełnij wymagane pola");
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/events", {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        date: form.date,
        time: form.time,
        track: form.track.trim(),
        city: form.city.trim(),
        voivodeship: form.voivodeship.trim(),
        imageUrl: form.imageUrl.trim() || undefined,
        lat: form.lat ? Number(form.lat) : undefined,
        lng: form.lng ? Number(form.lng) : undefined,
      });
      toast.success("Wydarzenie utworzone — oczekuje na akceptację admina");
      setCreateOpen(false);
      setForm(emptyForm);
      loadEvents();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Nie udało się utworzyć wydarzenia");
    } finally {
      setSaving(false);
    }
  };

  const updateRegistrationStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      const updated = await api.patch<Registration>(`/api/registrations/${id}/status`, { status });
      setRegistrations((prev) => prev.map((r) => (r.id === id ? updated : r)));
      toast.success(`Zgłoszenie: ${registrationStatusLabel(status)}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Błąd aktualizacji");
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <section className="bg-[#1a1a1a] border-b border-[#2a2a2a] py-12">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-['Orbitron'] text-white mb-2" style={{ fontSize: "40px", fontWeight: 900 }}>
              PANEL <span className="text-[#FFD700]">ORGANIZATORA</span>
            </h1>
            <p className="text-[#9ca3af]">Twórz wydarzenia i zarządzaj zgłoszeniami kierowców.</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="bg-[#FFD700] text-[#121212]" style={{ fontWeight: 800 }}>
            <Plus className="w-4 h-4 mr-2" />
            NOWE WYDARZENIE
          </Button>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#1a1a1a] border border-[#2a2a2a] mb-6">
            <TabsTrigger value="events">Moje wydarzenia</TabsTrigger>
            <TabsTrigger value="registrations" disabled={!selectedEventId}>
              Zgłoszenia {selectedEventId ? "" : "(wybierz wydarzenie)"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-[#9ca3af]">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#FFD700]" />
                Ładowanie...
              </div>
            ) : events.length === 0 ? (
              <p className="text-[#9ca3af] text-center py-12">Brak wydarzeń. Utwórz pierwsze!</p>
            ) : (
              events.map((event) => (
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
                      <p className="text-[#9ca3af] text-sm flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4" />
                        {event.dateLabel || formatEventDate(event.date)} · {event.track}
                      </p>
                      <p className="text-[#9ca3af] text-sm flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {event._count?.registrations ?? event.registrationsCount ?? 0} zgłoszeń
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => loadRegistrations(event.id)}
                      className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-[#121212]"
                      style={{ fontWeight: 700 }}
                    >
                      Zobacz zgłoszenia
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="registrations" className="space-y-4">
            {registrations.length === 0 ? (
              <p className="text-[#9ca3af] text-center py-8">Brak zgłoszeń dla tego wydarzenia.</p>
            ) : (
              registrations.map((reg) => (
                <Card key={reg.id} className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-white" style={{ fontWeight: 700 }}>
                        {reg.user?.username ?? "Kierowca"}
                      </p>
                      <p className="text-[#9ca3af] text-sm">{reg.user?.email}</p>
                      {reg.car && (
                        <p className="text-[#9ca3af] text-sm">
                          Auto: {reg.car.make} {reg.car.model}
                        </p>
                      )}
                      {reg.note && <p className="text-[#9ca3af] text-sm italic">{reg.note}</p>}
                      <Badge className="mt-2 bg-[#2a2a2a] text-white">{registrationStatusLabel(reg.status)}</Badge>
                    </div>
                    {reg.status === "PENDING" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateRegistrationStatus(reg.id, "APPROVED")} className="bg-green-700 hover:bg-green-600">
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateRegistrationStatus(reg.id, "REJECTED")} className="border-red-800 text-red-400">
                          <X className="w-4 h-4" />
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#0A0A0A] border-[#2a2a2a] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Orbitron']" style={{ fontWeight: 800 }}>
              Nowe wydarzenie
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Nazwa *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#121212] border-[#2a2a2a] text-white" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Opis *</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="bg-[#121212] border-[#2a2a2a] text-white" />
            </div>
            <div className="space-y-2">
              <Label>Kategoria *</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="bg-[#121212] border-[#2a2a2a] text-white" />
            </div>
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-[#121212] border-[#2a2a2a] text-white" />
            </div>
            <div className="space-y-2">
              <Label>Godzina</Label>
              <Input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="bg-[#121212] border-[#2a2a2a] text-white" />
            </div>
            <div className="space-y-2">
              <Label>Tor *</Label>
              <Input value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })} className="bg-[#121212] border-[#2a2a2a] text-white" />
            </div>
            <div className="space-y-2">
              <Label>Miasto *</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="bg-[#121212] border-[#2a2a2a] text-white" />
            </div>
            <div className="space-y-2">
              <Label>Województwo *</Label>
              <Input value={form.voivodeship} onChange={(e) => setForm({ ...form, voivodeship: e.target.value })} className="bg-[#121212] border-[#2a2a2a] text-white" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>URL zdjęcia</Label>
              <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="bg-[#121212] border-[#2a2a2a] text-white" />
            </div>
            <div className="space-y-2">
              <Label>Szer. geogr. (lat)</Label>
              <Input value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} type="number" step="any" className="bg-[#121212] border-[#2a2a2a] text-white" />
            </div>
            <div className="space-y-2">
              <Label>Dł. geogr. (lng)</Label>
              <Input value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} type="number" step="any" className="bg-[#121212] border-[#2a2a2a] text-white" />
            </div>
            <p className="sm:col-span-2 text-xs text-[#9ca3af] leading-relaxed">
              Dodając wydarzenie, potwierdzasz, że dane organizatora i wydarzenia będą przetwarzane zgodnie z{" "}
              <a href="/privacy" className="text-[#FFD700] hover:underline">
                polityką prywatności
              </a>{" "}
              (RODO) wyłącznie w celu publikacji i obsługi zgłoszeń.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="border-[#2a2a2a] text-white">
              Anuluj
            </Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-[#FFD700] text-[#121212]" style={{ fontWeight: 700 }}>
              {saving ? "TWORZENIE..." : "Utwórz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
