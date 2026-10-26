/**
 * OrganizerPanelPage – panel roli ORGANIZER (oraz ADMIN przez AuthGate).
 *
 * Cel: CRUD wydarzeń organizatora + zarządzanie statusami zgłoszeń kierowców.
 * Wzorce: fetch on mount (`/api/organizer/events`), wyszukiwarka listy, dialog zgłoszeń
 * (bez osobnej zakładki), dialog formularza (komponenty organizer/*).
 * Auth: route gated AuthGate roles=["ORGANIZER","ADMIN"] w routes.tsx; API też egzekwuje rolę.
 *
 * Pomysł (alt): TanStack Query + mutations; React Hook Form + Zod.
 */
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Reveal } from "../components/Reveal";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { Registration, RegistrationStatus } from "../lib/types";
import { registrationStatusLabel } from "../lib/types";
import { OTHER } from "../lib/eventFormPresets";
import { toast } from "sonner";
import { validateImageReference } from "../lib/profileValidation";
import {
  emptyForm,
  eventToForm,
  type OrganizerEvent,
} from "../components/organizer/organizerEventForm";
import { OrganizerEventList } from "../components/organizer/OrganizerEventList";
import { OrganizerRegistrationsList } from "../components/organizer/OrganizerRegistrationsList";
import { OrganizerRegistrationDetailDialog } from "../components/organizer/OrganizerRegistrationDetailDialog";
import { OrganizerEventFormDialog } from "../components/organizer/OrganizerEventFormDialog";

export function OrganizerPanelPage() {
  const { refreshSession } = useAuth();
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [registrationsOpen, setRegistrationsOpen] = useState(false);
  const [detailReg, setDetailReg] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [eventSearch, setEventSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const filteredEvents = useMemo(() => {
    const q = eventSearch.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => {
      const hay = [e.name, e.category, e.track, e.city, e.voivodeship, e.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [events, eventSearch]);

  const resolvedCategory =
    form.category === OTHER ? form.categoryOther.trim() : form.category.trim();
  const resolvedTrack =
    form.trackKey === OTHER ? form.trackOther.trim() : form.trackKey.trim();
  const resolvedCity = form.city === OTHER ? form.cityOther.trim() : form.city.trim();
  const resolvedTime =
    form.time === OTHER ? form.timeOther.trim() : form.time.trim();
  const resolvedEntryFee = form.entryFeeOther ? form.entryFee.trim() : form.entryFee.trim();

  const clearFieldError = (key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const todayIso = () => new Date().toISOString().slice(0, 10);

  const validateEventForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Nazwa jest wymagana";
    if (!form.description.trim()) errors.description = "Opis jest wymagany";
    if (!resolvedCategory) errors.category = "Kategoria jest wymagana";
    if (!form.date) {
      errors.date = "Data jest wymagana";
    } else if (form.date < todayIso()) {
      errors.date = "Data wydarzenia nie może być z przeszłości";
    }
    if (!resolvedTrack) errors.track = "Tor / lokalizacja jest wymagana";
    if (!resolvedCity) errors.city = "Miasto jest wymagane";
    if (!form.voivodeship.trim()) errors.voivodeship = "Województwo jest wymagane";
    if (form.endDate.trim() && form.date && form.endDate < form.date) {
      errors.endDate = "Data zakończenia nie może być wcześniejsza niż data startu";
    }
    if (form.paid && form.acceptRegistrations && !form.bankAccount.trim()) {
      errors.bankAccount = "Dla płatnego wydarzenia ze zgłoszeniami online podaj numer konta";
    }
    const imageErr = validateImageReference(form.imageUrl, false);
    if (imageErr) errors.imageUrl = imageErr;
    return errors;
  };

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
    let cancelled = false;
    (async () => {
      await refreshSession();
      if (cancelled) return;
      loadEvents();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount
  }, []);

  /** Pobiera zgłoszenia wybranego wydarzenia i otwiera dialog (bez osobnej zakładki). */
  const loadRegistrations = async (eventId: string) => {
    setSelectedEventId(eventId);
    setRegistrationsOpen(true);
    setComments({});
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
    setFieldErrors({});
    setCreateOpen(true);
  };

  const openEdit = (event: OrganizerEvent) => {
    setEditingId(event.id);
    setForm(eventToForm(event));
    setFieldErrors({});
    setCreateOpen(true);
  };

  const handleSave = async () => {
    const errors = validateEventForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      Object.values(errors).forEach((msg) => toast.error(msg));
      return;
    }
    setFieldErrors({});
    setSaving(true);
    const onlinePaid = form.paid && form.acceptRegistrations;
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
      bankAccount: onlinePaid ? form.bankAccount.trim() : undefined,
      paymentDeadlineHours: onlinePaid ? Number(form.paymentDeadlineHours) || 72 : undefined,
      freeCancelDays: onlinePaid ? Number(form.freeCancelDays) || 7 : undefined,
      acceptRegistrations: form.acceptRegistrations,
      endDate: form.endDate.trim() || undefined,
      endTime: form.endTime.trim() || undefined,
      spectatorFee: form.spectatorFee.trim() ? Number(form.spectatorFee) : undefined,
      externalUrl: form.externalUrl.trim() || undefined,
      requireDrivingLicense: form.acceptRegistrations ? form.requireDrivingLicense : false,
      requirePzmLicense: form.acceptRegistrations ? form.requirePzmLicense : false,
      requireDrivingLicenseOrPzm: form.acceptRegistrations ? form.requireDrivingLicenseOrPzm : false,
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
        toast.success("Wydarzenie utworzone – oczekuje na akceptację admina");
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
      setDetailReg((prev) => (prev?.id === id ? updated : prev));
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
        setRegistrationsOpen(false);
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Nie udało się anulować wydarzenia");
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm("Na pewno trwale usunąć wydarzenie? Tej operacji nie można cofnąć.")) {
      return;
    }
    try {
      await api.delete(`/api/events/${eventId}`);
      toast.success("Wydarzenie usunięte");
      loadEvents();
      if (selectedEventId === eventId) {
        setRegistrations([]);
        setSelectedEventId(null);
        setRegistrationsOpen(false);
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Nie udało się usunąć wydarzenia");
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setCreateOpen(open);
    if (!open) {
      setForm(emptyForm);
      setEditingId(null);
      setFieldErrors({});
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <section className="bg-[var(--race-card)] border-b border-[var(--race-border)] py-12">
        <Reveal className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-[var(--race-fg)] mb-2" style={{ fontSize: "40px", fontWeight: 800 }}>
              PANEL <span className="text-[var(--race-accent)]">ORGANIZATORA</span>
            </h1>
            <p className="text-[var(--race-muted)]">Twórz wydarzenia i zarządzaj zgłoszeniami kierowców.</p>
          </div>
          <Button onClick={openCreate} className="bg-[var(--race-accent)] text-[var(--race-on-accent)]" style={{ fontWeight: 800 }}>
            <Plus className="w-4 h-4 mr-2" />
            NOWE WYDARZENIE
          </Button>
        </Reveal>
      </section>

      <section className="container mx-auto px-4 py-10">
        <h2 className="font-display text-[var(--race-fg)] mb-4" style={{ fontWeight: 800 }}>
          Moje wydarzenia
        </h2>
        <OrganizerEventList
          events={filteredEvents}
          loading={loading}
          loadError={loadError}
          searchQuery={eventSearch}
          onSearchQueryChange={setEventSearch}
          onEdit={openEdit}
          onLoadRegistrations={loadRegistrations}
          onCancelEvent={cancelEvent}
          onDeleteEvent={deleteEvent}
        />
      </section>

      <Dialog
        open={registrationsOpen}
        onOpenChange={(open) => {
          setRegistrationsOpen(open);
          if (!open) setDetailReg(null);
        }}
      >
        <DialogContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)] max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display" style={{ fontWeight: 800 }}>
              Zgłoszenia
            </DialogTitle>
            <DialogDescription className="text-[var(--race-muted)]">
              {selectedEvent ? selectedEvent.name : "Wybierz wydarzenie"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <OrganizerRegistrationsList
              registrations={registrations}
              selectedEvent={selectedEvent}
              comments={comments}
              setComments={setComments}
              onUpdateStatus={updateRegistrationStatus}
              onOpenDetail={setDetailReg}
            />
          </div>
        </DialogContent>
      </Dialog>

      <OrganizerRegistrationDetailDialog
        registration={detailReg}
        open={detailReg != null}
        onOpenChange={(open) => {
          if (!open) setDetailReg(null);
        }}
      />

      <OrganizerEventFormDialog
        open={createOpen}
        onOpenChange={handleDialogOpenChange}
        editingId={editingId}
        form={form}
        setForm={setForm}
        saving={saving}
        onSave={handleSave}
        fieldErrors={fieldErrors}
        clearFieldError={clearFieldError}
      />
    </div>
  );
}
