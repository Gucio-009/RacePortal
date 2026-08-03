import { useEffect, useState } from "react";
import { Calendar, Plus, Users, Loader2, Check, X, Ban, MapPin, Pencil } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../components/ui/select";
import { LocationMapPicker } from "../components/LocationMapPicker";
import { api, ApiError } from "../lib/api";
import type { ApiEvent, Registration, RegistrationStatus } from "../lib/types";
import { eventStatusLabel, registrationStatusLabel, formatEventDate } from "../lib/types";
import { ALL_EVENT_CATEGORIES, EVENT_CATEGORY_GROUPS } from "../lib/eventCategories";
import {
  OTHER,
  VOIVODESHIPS,
  TRACK_PRESETS,
  START_TIMES,
  EVENT_IMAGE_PRESETS,
  ENTRY_FEE_PRESETS,
  PAYMENT_DEADLINE_OPTIONS,
  FREE_CANCEL_OPTIONS,
  DEMO_BANK_ACCOUNT,
} from "../lib/eventFormPresets";
import { toast } from "sonner";

interface OrganizerEvent extends ApiEvent {
  _count?: { registrations: number };
}

const emptyForm = {
  name: "",
  description: "",
  category: "",
  categoryOther: "",
  date: "",
  time: "10:00",
  timeOther: "",
  trackKey: "",
  trackOther: "",
  city: "",
  cityOther: "",
  voivodeship: "",
  imageUrl: "",
  imageCustom: false,
  lat: "",
  lng: "",
  paid: false,
  entryFee: "",
  entryFeeOther: false,
  bankAccount: "",
  paymentDeadlineHours: "72",
  freeCancelDays: "7",
  acceptRegistrations: true,
  endDate: "",
  endTime: "",
  spectatorFee: "",
  externalUrl: "",
  requireDrivingLicense: false,
  requirePzmLicense: false,
  requireOc: false,
  requirePt: false,
  requireCage: false,
  requireRegistered: false,
};

type FormState = typeof emptyForm;

function applyTrackPreset(prev: FormState, trackName: string): FormState {
  if (trackName === OTHER) {
    return { ...prev, trackKey: OTHER, city: "", cityOther: "", voivodeship: "", lat: "", lng: "" };
  }
  const preset = TRACK_PRESETS.find((t) => t.track === trackName);
  if (!preset) {
    return { ...prev, trackKey: trackName };
  }
  return {
    ...prev,
    trackKey: preset.track,
    trackOther: "",
    city: preset.city,
    cityOther: "",
    voivodeship: preset.voivodeship,
    lat: String(preset.lat),
    lng: String(preset.lng),
  };
}

function eventToForm(event: ApiEvent): FormState {
  const categoryInList = ALL_EVENT_CATEGORIES.includes(event.category);
  const trackPreset = TRACK_PRESETS.find((t) => t.track === event.track);
  const timeInList = (START_TIMES as readonly string[]).includes(event.time);
  const imagePreset = EVENT_IMAGE_PRESETS.find((img) => img.url === event.imageUrl);
  const entryFeeStr = event.entryFee != null ? String(event.entryFee) : "";
  const entryFeeOther =
    Boolean(event.paid && entryFeeStr && !(ENTRY_FEE_PRESETS as readonly string[]).includes(entryFeeStr));

  let city = event.city;
  let cityOther = "";
  if (!trackPreset) {
    const cityInList = TRACK_PRESETS.some((t) => t.city === event.city);
    if (!cityInList) {
      city = OTHER;
      cityOther = event.city;
    }
  }

  return {
    name: event.name,
    description: event.description,
    category: categoryInList ? event.category : OTHER,
    categoryOther: categoryInList ? "" : event.category,
    date: event.date.slice(0, 10),
    time: timeInList ? event.time : OTHER,
    timeOther: timeInList ? "" : event.time,
    trackKey: trackPreset ? trackPreset.track : OTHER,
    trackOther: trackPreset ? "" : event.track,
    city,
    cityOther,
    voivodeship: event.voivodeship,
    imageUrl: event.imageUrl ?? "",
    imageCustom: Boolean(event.imageUrl && !imagePreset),
    lat: event.lat != null ? String(event.lat) : "",
    lng: event.lng != null ? String(event.lng) : "",
    paid: event.paid ?? false,
    entryFee: entryFeeStr,
    entryFeeOther,
    bankAccount: event.bankAccount ?? "",
    paymentDeadlineHours: String(event.paymentDeadlineHours ?? 72),
    freeCancelDays: String(event.freeCancelDays ?? 7),
    acceptRegistrations: event.acceptRegistrations ?? true,
    endDate: event.endDate?.slice(0, 10) ?? "",
    endTime: event.endTime ?? "",
    spectatorFee: event.spectatorFee != null ? String(event.spectatorFee) : "",
    externalUrl: event.externalUrl ?? "",
    requireDrivingLicense: event.requireDrivingLicense ?? false,
    requirePzmLicense: event.requirePzmLicense ?? false,
    requireOc: event.requireOc ?? false,
    requirePt: event.requirePt ?? false,
    requireCage: event.requireCage ?? false,
    requireRegistered: event.requireRegistered ?? false,
  };
}

export function OrganizerPanelPage() {
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("events");
  const [form, setForm] = useState(emptyForm);
  const [comments, setComments] = useState<Record<string, string>>({});

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const resolvedCategory =
    form.category === OTHER ? form.categoryOther.trim() : form.category.trim();
  const resolvedTrack =
    form.trackKey === OTHER ? form.trackOther.trim() : form.trackKey.trim();
  const resolvedCity = form.city === OTHER ? form.cityOther.trim() : form.city.trim();
  const resolvedTime =
    form.time === OTHER ? form.timeOther.trim() : form.time.trim();
  const resolvedEntryFee = form.entryFeeOther ? form.entryFee.trim() : form.entryFee.trim();

  const loadEvents = () => {
    setLoading(true);
    setLoadError(null);
    api
      .get<OrganizerEvent[]>("/api/organizer/events")
      .then((items) => {
        setEvents(items);
        setLoadError(null);
      })
      .catch((e) => {
        setEvents([]);
        setLoadError(e instanceof ApiError ? e.message : "Nie udało się pobrać wydarzeń");
      })
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

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setCreateOpen(true);
  };

  const openEdit = (event: OrganizerEvent) => {
    setEditingId(event.id);
    setForm(eventToForm(event));
    setCreateOpen(true);
  };

  const handleSave = async () => {
    if (
      !form.name.trim() ||
      !form.description.trim() ||
      !resolvedCategory ||
      !form.date ||
      !resolvedTrack ||
      !resolvedCity ||
      !form.voivodeship.trim()
    ) {
      toast.error("Wypełnij wymagane pola (nazwa, opis, kategoria, data, tor, miasto, województwo)");
      return;
    }
    if (form.paid && !form.bankAccount.trim()) {
      toast.error("Dla płatnego wydarzenia podaj numer konta");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: resolvedCategory,
      date: form.date,
      time: resolvedTime || "10:00",
      track: resolvedTrack,
      city: resolvedCity,
      voivodeship: form.voivodeship.trim(),
      imageUrl: form.imageUrl.trim() || undefined,
      lat: form.lat ? Number(form.lat) : undefined,
      lng: form.lng ? Number(form.lng) : undefined,
      paid: form.paid,
      entryFee: form.paid && resolvedEntryFee ? Number(resolvedEntryFee) : undefined,
      bankAccount: form.paid ? form.bankAccount.trim() : undefined,
      paymentDeadlineHours: form.paid ? Number(form.paymentDeadlineHours) || 72 : undefined,
      freeCancelDays: Number(form.freeCancelDays) || 7,
      acceptRegistrations: form.acceptRegistrations,
      endDate: form.endDate.trim() || undefined,
      endTime: form.endTime.trim() || undefined,
      spectatorFee: form.spectatorFee.trim() ? Number(form.spectatorFee) : undefined,
      externalUrl: form.externalUrl.trim() || undefined,
      requireDrivingLicense: form.acceptRegistrations ? form.requireDrivingLicense : false,
      requirePzmLicense: form.acceptRegistrations ? form.requirePzmLicense : false,
      requireOc: form.acceptRegistrations ? form.requireOc : false,
      requirePt: form.acceptRegistrations ? form.requirePt : false,
      requireCage: form.acceptRegistrations ? form.requireCage : false,
      requireRegistered: form.acceptRegistrations ? form.requireRegistered : false,
    };
    try {
      if (editingId) {
        await api.patch(`/api/events/${editingId}`, payload);
        toast.success("Wydarzenie zaktualizowane");
      } else {
        await api.post("/api/events", payload);
        toast.success("Wydarzenie utworzone — oczekuje na akceptację admina");
      }
      setCreateOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      loadEvents();
    } catch (e) {
      toast.error(
        e instanceof ApiError
          ? e.message
          : editingId
            ? "Nie udało się zaktualizować wydarzenia"
            : "Nie udało się utworzyć wydarzenia",
      );
    } finally {
      setSaving(false);
    }
  };

  const updateRegistrationStatus = async (id: string, status: RegistrationStatus) => {
    try {
      const updated = await api.patch<Registration>(`/api/registrations/${id}/status`, {
        status,
        comment: comments[id]?.trim() || undefined,
      });
      setRegistrations((prev) => prev.map((r) => (r.id === id ? updated : r)));
      toast.success(`Zgłoszenie: ${registrationStatusLabel(updated.status)}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Błąd aktualizacji");
    }
  };

  const cancelEvent = async (eventId: string) => {
    if (!confirm("Na pewno anulować wydarzenie? Wszystkie otwarte zgłoszenia zostaną anulowane.")) {
      return;
    }
    try {
      await api.post(`/api/events/${eventId}/cancel`, {});
      toast.success("Wydarzenie anulowane");
      loadEvents();
      if (selectedEventId === eventId) {
        setRegistrations([]);
        setSelectedEventId(null);
        setActiveTab("events");
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Nie udało się anulować wydarzenia");
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
          <Button onClick={openCreate} className="bg-[#FFD700] text-[#121212]" style={{ fontWeight: 800 }}>
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
            ) : loadError ? (
              <p className="text-red-400 text-center py-12">{loadError}</p>
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
                        {event.paid && (
                          <Badge variant="outline" className="border-[#FFD700] text-[#FFD700]">
                            Płatne
                          </Badge>
                        )}
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
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => openEdit(event)}
                        className="border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edytuj
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => loadRegistrations(event.id)}
                        className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-[#121212]"
                        style={{ fontWeight: 700 }}
                      >
                        Zobacz zgłoszenia
                      </Button>
                      {event.status !== "CANCELLED" && event.status !== "ARCHIVED" && (
                        <Button
                          variant="outline"
                          onClick={() => cancelEvent(event.id)}
                          className="border-red-900 text-red-400 hover:bg-red-950"
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          Anuluj
                        </Button>
                      )}
                    </div>
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
                  <CardContent className="p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <p className="text-white" style={{ fontWeight: 700 }}>
                          {reg.user?.username ?? "Kierowca"}
                        </p>
                        <p className="text-[#9ca3af] text-sm">{reg.user?.email}</p>
                        {reg.car && (
                          <p className="text-[#9ca3af] text-sm">
                            Auto: {reg.car.make} {reg.car.model}
                            {reg.car.className ? ` · ${reg.car.className}` : ""}
                          </p>
                        )}
                        {reg.note && <p className="text-[#9ca3af] text-sm italic">{reg.note}</p>}
                        {reg.paymentProofUrl && (
                          <a
                            href={reg.paymentProofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#FFD700] text-sm underline"
                          >
                            Potwierdzenie przelewu
                          </a>
                        )}
                        {reg.organizerComment && (
                          <p className="text-sm text-[#9ca3af] mt-1">Komentarz: {reg.organizerComment}</p>
                        )}
                        <Badge className="mt-2 bg-[#2a2a2a] text-white">{registrationStatusLabel(reg.status)}</Badge>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <Input
                          placeholder="Komentarz (opcjonalnie)"
                          value={comments[reg.id] || ""}
                          onChange={(e) => setComments((prev) => ({ ...prev, [reg.id]: e.target.value }))}
                          className="bg-[#121212] border-[#2a2a2a] text-white"
                        />
                        {reg.status === "PENDING" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                updateRegistrationStatus(
                                  reg.id,
                                  selectedEvent?.paid ? "ACCEPTED" : "CONFIRMED",
                                )
                              }
                              className="bg-green-700 hover:bg-green-600 flex-1"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              {selectedEvent?.paid ? "Akceptuj" : "Potwierdź"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateRegistrationStatus(reg.id, "CANCELED")}
                              className="border-red-800 text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        {reg.status === "ACCEPTED" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              disabled={!reg.paymentProofUrl}
                              onClick={() => updateRegistrationStatus(reg.id, "CONFIRMED")}
                              className="bg-green-700 hover:bg-green-600 flex-1 disabled:opacity-40"
                            >
                              Potwierdź wpłatę
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateRegistrationStatus(reg.id, "CANCELED")}
                              className="border-red-800 text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </section>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            setForm(emptyForm);
            setEditingId(null);
          }
        }}
      >
        <DialogContent className="bg-[#0A0A0A] border-[#2a2a2a] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Orbitron']" style={{ fontWeight: 800 }}>
              {editingId ? "Edytuj wydarzenie" : "Nowe wydarzenie"}
            </DialogTitle>
            <p className="text-sm text-[#9ca3af]">
              Większość pól wybierasz z listy — „Inne…” tylko gdy potrzebujesz własnej wartości.
            </p>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Nazwa *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="np. Drift Masters Polish Grand Prix"
                className="bg-[#121212] border-[#2a2a2a] text-white"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Opis *</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Krótki opis rundy, klas i atrakcji…"
                className="bg-[#121212] border-[#2a2a2a] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label>Kategoria *</Label>
              <Select
                value={form.category || undefined}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    category: v,
                    categoryOther: v === OTHER ? form.categoryOther : "",
                  })
                }
              >
                <SelectTrigger className="bg-[#121212] border-[#2a2a2a] text-white">
                  <SelectValue placeholder="Wybierz kategorię" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white max-h-72">
                  {EVENT_CATEGORY_GROUPS.map((g) => (
                    <SelectGroup key={g.group}>
                      <SelectLabel className="text-[#FFD700]">{g.group}</SelectLabel>
                      {g.items.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                  <SelectItem value={OTHER}>Inne…</SelectItem>
                </SelectContent>
              </Select>
              {form.category === OTHER && (
                <Input
                  value={form.categoryOther}
                  onChange={(e) => setForm({ ...form, categoryOther: e.target.value })}
                  placeholder="Własna kategoria"
                  className="bg-[#121212] border-[#2a2a2a] text-white"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Data *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="bg-[#121212] border-[#2a2a2a] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label>Godzina startu</Label>
              <Select
                value={form.time || undefined}
                onValueChange={(v) =>
                  setForm({ ...form, time: v, timeOther: v === OTHER ? form.timeOther : "" })
                }
              >
                <SelectTrigger className="bg-[#121212] border-[#2a2a2a] text-white">
                  <SelectValue placeholder="Wybierz godzinę" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                  {START_TIMES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                  <SelectItem value={OTHER}>Inna godzina…</SelectItem>
                </SelectContent>
              </Select>
              {form.time === OTHER && (
                <Input
                  type="time"
                  value={form.timeOther}
                  onChange={(e) => setForm({ ...form, timeOther: e.target.value })}
                  className="bg-[#121212] border-[#2a2a2a] text-white"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Tor / lokalizacja *</Label>
              <Select
                value={form.trackKey || undefined}
                onValueChange={(v) => setForm((prev) => applyTrackPreset(prev, v))}
              >
                <SelectTrigger className="bg-[#121212] border-[#2a2a2a] text-white">
                  <SelectValue placeholder="Wybierz tor" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                  {TRACK_PRESETS.map((t) => (
                    <SelectItem key={t.track} value={t.track}>
                      {t.track}
                    </SelectItem>
                  ))}
                  <SelectItem value={OTHER}>Inny tor…</SelectItem>
                </SelectContent>
              </Select>
              {form.trackKey === OTHER && (
                <Input
                  value={form.trackOther}
                  onChange={(e) => setForm({ ...form, trackOther: e.target.value })}
                  placeholder="Nazwa toru"
                  className="bg-[#121212] border-[#2a2a2a] text-white"
                />
              )}
              {form.trackKey && form.trackKey !== OTHER && (
                <p className="text-xs text-[#9ca3af]">
                  Auto: {form.city}, {form.voivodeship}
                  {form.lat && form.lng ? ` · mapa ${form.lat}, ${form.lng}` : ""}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Miasto *</Label>
              {form.trackKey === OTHER || !form.trackKey ? (
                <>
                  <Select
                    value={form.city || undefined}
                    onValueChange={(v) => {
                      if (v === OTHER) {
                        setForm({ ...form, city: OTHER, cityOther: "" });
                        return;
                      }
                      const match = TRACK_PRESETS.find((t) => t.city === v);
                      setForm({
                        ...form,
                        city: v,
                        cityOther: "",
                        voivodeship: match?.voivodeship ?? form.voivodeship,
                        lat: match ? String(match.lat) : form.lat,
                        lng: match ? String(match.lng) : form.lng,
                      });
                    }}
                  >
                    <SelectTrigger className="bg-[#121212] border-[#2a2a2a] text-white">
                      <SelectValue placeholder="Wybierz miasto" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                      {Array.from(new Set(TRACK_PRESETS.map((t) => t.city)))
                        .sort((a, b) => a.localeCompare(b, "pl"))
                        .map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      <SelectItem value={OTHER}>Inne miasto…</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.city === OTHER && (
                    <Input
                      value={form.cityOther}
                      onChange={(e) => setForm({ ...form, cityOther: e.target.value })}
                      placeholder="Nazwa miasta"
                      className="bg-[#121212] border-[#2a2a2a] text-white"
                    />
                  )}
                </>
              ) : (
                <Input
                  value={form.city}
                  readOnly
                  className="bg-[#121212]/60 border-[#2a2a2a] text-[#9ca3af]"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Województwo *</Label>
              <Select
                value={form.voivodeship || undefined}
                onValueChange={(v) => setForm({ ...form, voivodeship: v })}
                disabled={Boolean(form.trackKey && form.trackKey !== OTHER)}
              >
                <SelectTrigger className="bg-[#121212] border-[#2a2a2a] text-white disabled:opacity-60">
                  <SelectValue placeholder="Wybierz województwo" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                  {VOIVODESHIPS.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#FFD700]" />
                  Lokalizacja na mapie
                </Label>
                {form.lat && form.lng ? (
                  <span className="text-xs text-[#9ca3af] font-mono">
                    {form.lat}, {form.lng}
                  </span>
                ) : (
                  <span className="text-xs text-[#9ca3af]">Kliknij mapę lub wybierz tor</span>
                )}
              </div>
              <p className="text-xs text-[#9ca3af]">
                Wybór toru ustawia pinezkę automatycznie. Możesz też kliknąć mapę albo przeciągnąć marker.
              </p>
              {createOpen && (
                <LocationMapPicker
                  key="event-location-picker"
                  lat={form.lat ? Number(form.lat) : null}
                  lng={form.lng ? Number(form.lng) : null}
                  onChange={(lat, lng) => setForm((prev) => ({ ...prev, lat: String(lat), lng: String(lng) }))}
                  height="280px"
                />
              )}
              {(form.lat || form.lng) && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-[#2a2a2a] text-[#9ca3af]"
                  onClick={() => setForm({ ...form, lat: "", lng: "" })}
                >
                  Usuń pinezkę
                </Button>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Zdjęcie wydarzenia</Label>
              <div className="grid grid-cols-4 gap-2">
                {EVENT_IMAGE_PRESETS.map((img) => {
                  const selected = !form.imageCustom && form.imageUrl === img.url;
                  return (
                    <button
                      key={img.url}
                      type="button"
                      onClick={() => setForm({ ...form, imageUrl: img.url, imageCustom: false })}
                      className={`relative aspect-video overflow-hidden rounded border transition ${
                        selected
                          ? "border-[#FFD700] ring-1 ring-[#FFD700]"
                          : "border-[#2a2a2a] hover:border-[#FFD700]/50"
                      }`}
                      title={img.label}
                    >
                      <img src={img.url} alt={img.label} className="h-full w-full object-cover" />
                    </button>
                  );
                })}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 border-[#2a2a2a] text-white"
                onClick={() => setForm({ ...form, imageCustom: true, imageUrl: form.imageCustom ? form.imageUrl : "" })}
              >
                Własny URL zdjęcia…
              </Button>
              {form.imageCustom && (
                <Input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value, imageCustom: true })}
                  placeholder="https://…"
                  className="bg-[#121212] border-[#2a2a2a] text-white mt-2"
                />
              )}
            </div>

            <div className="sm:col-span-2 flex items-center justify-between border border-[#2a2a2a] rounded-md p-3">
              <div>
                <Label className="text-white">Przyjmuj zgłoszenia na stronie</Label>
                <p className="text-xs text-[#9ca3af]">Kierowcy mogą zapisywać się od razu po akceptacji admina</p>
              </div>
              <Switch
                checked={form.acceptRegistrations}
                onCheckedChange={(v) => setForm({ ...form, acceptRegistrations: v })}
              />
            </div>

            {form.acceptRegistrations && (
              <div className="sm:col-span-2 space-y-3 border border-[#2a2a2a] rounded-md p-3">
                <p className="text-sm text-[#FFD700]" style={{ fontWeight: 700 }}>
                  Wymagania dla kierowców
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(
                    [
                      ["requireDrivingLicense", "Prawo jazdy kat. B"],
                      ["requirePzmLicense", "Licencja PZM"],
                      ["requireOc", "Ubezpieczenie OC"],
                      ["requirePt", "Przegląd techniczny (PT)"],
                      ["requireCage", "Klatka bezpieczeństwa"],
                      ["requireRegistered", "Zarejestrowane auto"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between gap-2 rounded border border-[#2a2a2a] px-3 py-2">
                      <Label className="text-white text-sm">{label}</Label>
                      <Switch
                        checked={form[key]}
                        onCheckedChange={(v) => setForm({ ...form, [key]: v })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Data zakończenia (opcj.)</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="bg-[#121212] border-[#2a2a2a] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Godzina zakończenia (opcj.)</Label>
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="bg-[#121212] border-[#2a2a2a] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Bilet widza (PLN, opcj.)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.spectatorFee}
                onChange={(e) => setForm({ ...form, spectatorFee: e.target.value })}
                placeholder="np. 50"
                className="bg-[#121212] border-[#2a2a2a] text-white"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Link zewnętrzny (opcj.)</Label>
              <Input
                value={form.externalUrl}
                onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
                placeholder="https://organizator.pl/wydarzenie"
                className="bg-[#121212] border-[#2a2a2a] text-white"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between border border-[#2a2a2a] rounded-md p-3">
              <div>
                <Label className="text-white">Wydarzenie płatne</Label>
                <p className="text-xs text-[#9ca3af]">Wpisowe + weryfikacja przelewu</p>
              </div>
              <Switch checked={form.paid} onCheckedChange={(v) => setForm({ ...form, paid: v })} />
            </div>

            {form.paid && (
              <>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Wpisowe (PLN)</Label>
                  <div className="flex flex-wrap gap-2">
                    {ENTRY_FEE_PRESETS.map((fee) => (
                      <Button
                        key={fee}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setForm({ ...form, entryFee: fee, entryFeeOther: false })}
                        className={
                          !form.entryFeeOther && form.entryFee === fee
                            ? "border-[#FFD700] bg-[#FFD700]/15 text-[#FFD700]"
                            : "border-[#2a2a2a] text-white"
                        }
                      >
                        {fee} zł
                      </Button>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setForm({ ...form, entryFeeOther: true, entryFee: "" })}
                      className={
                        form.entryFeeOther
                          ? "border-[#FFD700] bg-[#FFD700]/15 text-[#FFD700]"
                          : "border-[#2a2a2a] text-white"
                      }
                    >
                      Inna kwota…
                    </Button>
                  </div>
                  {form.entryFeeOther && (
                    <Input
                      type="number"
                      value={form.entryFee}
                      onChange={(e) => setForm({ ...form, entryFee: e.target.value })}
                      placeholder="Kwota w PLN"
                      className="bg-[#121212] border-[#2a2a2a] text-white mt-2"
                    />
                  )}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Numer konta *</Label>
                  <Input
                    value={form.bankAccount}
                    onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
                    placeholder="PL…"
                    className="bg-[#121212] border-[#2a2a2a] text-white"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-[#2a2a2a] text-[#FFD700]"
                    onClick={() => setForm({ ...form, bankAccount: DEMO_BANK_ACCOUNT })}
                  >
                    Wstaw konto demo
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Termin wpłaty</Label>
                  <Select
                    value={form.paymentDeadlineHours}
                    onValueChange={(v) => setForm({ ...form, paymentDeadlineHours: v })}
                  >
                    <SelectTrigger className="bg-[#121212] border-[#2a2a2a] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                      {PAYMENT_DEADLINE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Darmowa anulacja</Label>
                  <Select
                    value={form.freeCancelDays}
                    onValueChange={(v) => setForm({ ...form, freeCancelDays: v })}
                  >
                    <SelectTrigger className="bg-[#121212] border-[#2a2a2a] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                      {FREE_CANCEL_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

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
            <Button onClick={handleSave} disabled={saving} className="bg-[#FFD700] text-[#121212]" style={{ fontWeight: 700 }}>
              {saving ? "ZAPISYWANIE..." : editingId ? "Zapisz" : "Utwórz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
