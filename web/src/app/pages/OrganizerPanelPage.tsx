import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { api, ApiError } from "../lib/api";
import type { Registration, RegistrationStatus } from "../lib/types";
import { registrationStatusLabel } from "../lib/types";
import { OTHER } from "../lib/eventFormPresets";
import { toast } from "sonner";
import {
  emptyForm,
  eventToForm,
  type OrganizerEvent,
} from "../components/organizer/organizerEventForm";
import { OrganizerEventList } from "../components/organizer/OrganizerEventList";
import { OrganizerRegistrationsList } from "../components/organizer/OrganizerRegistrationsList";
import { OrganizerEventFormDialog } from "../components/organizer/OrganizerEventFormDialog";

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

  const handleDialogOpenChange = (open: boolean) => {
    setCreateOpen(open);
    if (!open) {
      setForm(emptyForm);
      setEditingId(null);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <section className="bg-[#1a1a1a] border-b border-[#2a2a2a] py-12">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-['Orbitron'] text-white mb-2" style={{ fontSize: "40px", fontWeight: 900 }}>
              PANEL <span className="text-[var(--race-accent)]">ORGANIZATORA</span>
            </h1>
            <p className="text-[#9ca3af]">Twórz wydarzenia i zarządzaj zgłoszeniami kierowców.</p>
          </div>
          <Button onClick={openCreate} className="bg-[var(--race-accent)] text-[#121212]" style={{ fontWeight: 800 }}>
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
            <OrganizerEventList
              events={events}
              loading={loading}
              loadError={loadError}
              onEdit={openEdit}
              onLoadRegistrations={loadRegistrations}
              onCancelEvent={cancelEvent}
            />
          </TabsContent>

          <TabsContent value="registrations" className="space-y-4">
            <OrganizerRegistrationsList
              registrations={registrations}
              selectedEvent={selectedEvent}
              comments={comments}
              setComments={setComments}
              onUpdateStatus={updateRegistrationStatus}
            />
          </TabsContent>
        </Tabs>
      </section>

      <OrganizerEventFormDialog
        open={createOpen}
        onOpenChange={handleDialogOpenChange}
        editingId={editingId}
        form={form}
        setForm={setForm}
        saving={saving}
        onSave={handleSave}
      />
    </div>
  );
}
