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
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Plus } from "lucide-react";
import { Reveal } from "../components/Reveal";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { UnsavedChangesDialog } from "../components/UnsavedChangesDialog";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { Registration, RegistrationStatus } from "../lib/types";
import { OTHER } from "../lib/eventFormPresets";
import { toast } from "sonner";
import { validateImageReference } from "../lib/profileValidation";
import {
  clearFormDraft,
  EVENT_DRAFT_KEY,
  isFormDirty,
  listEventDrafts,
  loadFormDraft,
  removeEventDraft,
  saveFormDraft,
  upsertEventDraft,
  type EventDraftEntry,
} from "../lib/formDraft";
import {
  emptyForm,
  eventToForm,
  type FormState,
  type OrganizerEvent,
} from "../components/organizer/organizerEventForm";
import { OrganizerEventList } from "../components/organizer/OrganizerEventList";
import { OrganizerRegistrationsList } from "../components/organizer/OrganizerRegistrationsList";
import { OrganizerRegistrationDetailDialog } from "../components/organizer/OrganizerRegistrationDetailDialog";
import { OrganizerEventFormDialog } from "../components/organizer/OrganizerEventFormDialog";
import { OrganizerEventDraftsDialog } from "../components/organizer/OrganizerEventDraftsDialog";

export function OrganizerPanelPage() {
  const { t } = useTranslation();
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
  /** Id wpisu w liście wersji roboczych (tylko nowe wydarzenia). */
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [drafts, setDrafts] = useState<EventDraftEntry<FormState>[]>([]);
  const [saving, setSaving] = useState(false);
  const [eventSearch, setEventSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [formBaseline, setFormBaseline] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [unsavedOpen, setUnsavedOpen] = useState(false);

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const editDraftKey = editingId ? `${EVENT_DRAFT_KEY}_${editingId}` : null;
  const formDirty = createOpen && isFormDirty(form, formBaseline);

  const refreshDrafts = useCallback(() => {
    setDrafts(listEventDrafts<FormState>());
  }, []);

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
    if (!form.name.trim()) errors.name = t("organizer.nameRequired");
    if (!form.description.trim()) errors.description = t("organizer.descRequired");
    if (!resolvedCategory) errors.category = t("organizer.categoryRequired");
    if (!form.date) {
      errors.date = t("organizer.dateRequired");
    } else if (form.date < todayIso()) {
      errors.date = t("organizer.datePast");
    }
    if (!resolvedTrack) errors.track = t("organizer.trackRequired");
    if (!resolvedCity) errors.city = t("organizer.cityRequired");
    if (!form.voivodeship.trim()) errors.voivodeship = t("organizer.voivodeshipRequired");
    if (form.endDate.trim() && form.date && form.endDate < form.date) {
      errors.endDate = t("organizer.endDateBefore");
    }
    if (form.paid && form.acceptRegistrations && !form.bankAccount.trim()) {
      errors.bankAccount = t("organizer.bankRequired");
    }
    if (form.acceptRegistrations && form.restrictAllowedTires && form.allowedTireTypes.length === 0) {
      errors.allowedTireTypes = t("organizer.allowedTiresRequired");
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
        setLoadError(e instanceof ApiError ? e.message : t("organizer.loadFail"));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refreshSession();
      if (cancelled) return;
      loadEvents();
      refreshDrafts();
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
      toast.error(e instanceof ApiError ? e.message : t("organizer.regsLoadFail"));
      setRegistrations([]);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setActiveDraftId(null);
    setForm(emptyForm);
    setFormBaseline(emptyForm);
    setFieldErrors({});
    setCreateOpen(true);
  };

  const openEdit = (event: OrganizerEvent) => {
    setEditingId(event.id);
    setActiveDraftId(null);
    const draft = loadFormDraft<FormState>(`${EVENT_DRAFT_KEY}_${event.id}`);
    const initial = { ...emptyForm, ...(draft ?? eventToForm(event)) };
    setForm(initial);
    setFormBaseline(initial);
    setFieldErrors({});
    setCreateOpen(true);
    if (draft) toast.message(t("organizer.draftRestored"));
  };

  const openDraft = (draft: EventDraftEntry<FormState>) => {
    setEditingId(null);
    setActiveDraftId(draft.id);
    const initial = { ...emptyForm, ...draft.data };
    setForm(initial);
    setFormBaseline(initial);
    setFieldErrors({});
    setDraftsOpen(false);
    setCreateOpen(true);
  };

  const closeEventFormClean = () => {
    setCreateOpen(false);
    setUnsavedOpen(false);
    setForm(emptyForm);
    setFormBaseline(emptyForm);
    setEditingId(null);
    setActiveDraftId(null);
    setFieldErrors({});
  };

  const handleSaveDraft = () => {
    if (editingId) {
      saveFormDraft(`${EVENT_DRAFT_KEY}_${editingId}`, form);
    } else {
      upsertEventDraft(form, activeDraftId);
      refreshDrafts();
    }
    toast.success(t("organizer.draftSaved"));
    closeEventFormClean();
  };

  const handleDeleteDraft = (id: string) => {
    removeEventDraft(id);
    refreshDrafts();
    toast.success(t("organizer.draftDeleted"));
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
      regulationsUrls: form.regulationsUrls.join(", ") || "",
      restrictAllowedTires: form.acceptRegistrations ? form.restrictAllowedTires : false,
      allowedTireTypes:
        form.acceptRegistrations && form.restrictAllowedTires
          ? form.allowedTireTypes.join(", ")
          : "",
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
        toast.success(t("organizer.eventUpdated"));
      } else {
        await api.post("/api/events", payload);
        toast.success(t("organizer.eventCreatedPending"));
      }
      if (editingId) {
        clearFormDraft(`${EVENT_DRAFT_KEY}_${editingId}`);
      } else if (activeDraftId) {
        removeEventDraft(activeDraftId);
        refreshDrafts();
      }
      closeEventFormClean();
      loadEvents();
    } catch (e) {
      toast.error(
        e instanceof ApiError
          ? e.message
          : editingId
            ? t("organizer.updateFail")
            : t("organizer.createFail"),
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
      toast.success(
        t("registration.statusToast", { status: t(`registration.${updated.status}`) }),
      );
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("organizer.updateStatusFail"));
    }
  };

  const cancelEvent = async (eventId: string) => {
    if (!confirm(t("organizer.cancelConfirm"))) {
      return;
    }
    try {
      await api.post(`/api/events/${eventId}/cancel`, {});
      toast.success(t("organizer.eventCancelled"));
      loadEvents();
      if (selectedEventId === eventId) {
        setRegistrations([]);
        setSelectedEventId(null);
        setRegistrationsOpen(false);
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("organizer.cancelFail"));
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm(t("organizer.deleteConfirmHard"))) {
      return;
    }
    try {
      await api.delete(`/api/events/${eventId}`);
      toast.success(t("organizer.eventDeleted"));
      loadEvents();
      if (selectedEventId === eventId) {
        setRegistrations([]);
        setSelectedEventId(null);
        setRegistrationsOpen(false);
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("organizer.deleteEventFail"));
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      if (formDirty) {
        setUnsavedOpen(true);
        return;
      }
      closeEventFormClean();
      return;
    }
    setCreateOpen(true);
  };

  return (
    <div className="min-h-screen pb-16">
      <section className="bg-[var(--race-card)] border-b border-[var(--race-border)] py-12">
        <Reveal className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-[var(--race-fg)] mb-2" style={{ fontSize: "40px", fontWeight: 800 }}>
              {t("organizer.titleBefore")}{" "}
              <span className="text-[var(--race-accent)]">{t("organizer.titleAccent")}</span>
            </h1>
            <p className="text-[var(--race-muted)]">{t("organizer.pageSubtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                refreshDrafts();
                setDraftsOpen(true);
              }}
              className="border-[var(--race-border)] text-[var(--race-fg)] bg-transparent hover:bg-[var(--race-hover)]"
              style={{ fontWeight: 700 }}
            >
              <FileText className="w-4 h-4 mr-2" />
              {t("organizer.draftsCaps")}
              {drafts.length > 0 ? (
                <span className="ml-2 inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-[var(--race-accent)] px-1.5 text-xs text-[var(--race-on-accent)]">
                  {drafts.length}
                </span>
              ) : null}
            </Button>
            <Button onClick={openCreate} className="bg-[var(--race-accent)] text-[var(--race-on-accent)]" style={{ fontWeight: 800 }}>
              <Plus className="w-4 h-4 mr-2" />
              {t("organizer.createEventCaps")}
            </Button>
          </div>
        </Reveal>
      </section>

      <section className="container mx-auto px-4 py-10">
        <h2 className="font-display text-[var(--race-fg)] mb-4" style={{ fontWeight: 800 }}>
          {t("organizer.myEvents")}
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
              {t("organizer.registrations")}
            </DialogTitle>
            <DialogDescription className="text-[var(--race-muted)]">
              {selectedEvent ? selectedEvent.name : t("organizer.selectEvent")}
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
        onSaveDraft={handleSaveDraft}
        formDirty={formDirty}
        fieldErrors={fieldErrors}
        clearFieldError={clearFieldError}
      />

      <OrganizerEventDraftsDialog
        open={draftsOpen}
        onOpenChange={setDraftsOpen}
        drafts={drafts}
        onOpenDraft={openDraft}
        onDeleteDraft={handleDeleteDraft}
      />

      <UnsavedChangesDialog
        open={unsavedOpen}
        onOpenChange={setUnsavedOpen}
        onDiscard={() => {
          if (editDraftKey) {
            clearFormDraft(editDraftKey);
          } else if (activeDraftId) {
            removeEventDraft(activeDraftId);
            refreshDrafts();
          }
          closeEventFormClean();
        }}
        onSaveDraft={handleSaveDraft}
      />
    </div>
  );
}
