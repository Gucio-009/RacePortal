/**
 * OrganizerEventFormDialog – dialog tworzenia / edycji wydarzenia (panel org.).
 *
 * Wzorzec UX: większość pól z Select (presety) + wartość specjalna `OTHER` („Inne…”)
 * na własne stringi. Presety: `eventFormPresets.ts` + kategorie z `eventCategories.ts`.
 *
 * Tor preset → `applyTrackPreset` wypełnia city / województwo / lat / lng.
 * Mapa: `LocationMapPicker` montowany tylko gdy `open` (invalidateSize w pickerze).
 * Płatne: cena zawsze przy `form.paid`; IBAN/termin/anulacja tylko gdy też `acceptRegistrations`.
 * Wymagania kierowcy (PJ, PZM, OC…) – tylko gdy `acceptRegistrations`.
 *
 * Stan formularza trzymany w rodzicu (`OrganizerPanelPage`); tu tylko UI + setForm.
 *
 * Pomysł (alt): multi-step wizard; draft lokalny w localStorage przed POST.
 */

import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../ui/select";
import { LocationMapPicker } from "../LocationMapPicker";
import { ImageUploadField } from "../ImageUploadField";
import { EVENT_CATEGORY_GROUPS } from "../../lib/eventCategories";
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
} from "../../lib/eventFormPresets";
import { applyTrackPreset, type FormState } from "./organizerEventForm";

function fieldClass(hasError: boolean) {
  return hasError
    ? "bg-[var(--race-bg)] border-red-500 text-[var(--race-fg)] ring-1 ring-red-500/60"
    : "bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]";
}

/** Native date picker – biała ikona kalendarza. */
const DATE_INPUT_CLASS =
  "[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer";

const DEADLINE_LABEL_KEYS: Record<string, string> = {
  "24": "organizer.deadline24",
  "48": "organizer.deadline48",
  "72": "organizer.deadline72",
  "168": "organizer.deadline168",
};

const CANCEL_LABEL_KEYS: Record<string, string> = {
  "3": "organizer.cancelBefore3",
  "7": "organizer.cancelBefore7",
  "14": "organizer.cancelBefore14",
  "30": "organizer.cancelBefore30",
};

const REQUIREMENT_KEYS = [
  ["requireDrivingLicense", "organizer.reqLicenseB"],
  ["requirePzmLicense", "organizer.reqPzm"],
  ["requireDrivingLicenseOrPzm", "organizer.reqLicenseOrPzm"],
  ["requireOc", "organizer.reqOc"],
  ["requirePt", "organizer.reqPt"],
  ["requireCage", "organizer.reqCage"],
  ["requireRegistered", "organizer.reqRegistered"],
] as const;

interface OrganizerEventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = tworzenie; string = edycja istniejącego eventId */
  editingId: string | null;
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
  saving: boolean;
  onSave: () => void;
  onSaveDraft: () => void;
  formDirty?: boolean;
  fieldErrors?: Record<string, string>;
  clearFieldError?: (key: string) => void;
}

export function OrganizerEventFormDialog({
  open,
  onOpenChange,
  editingId,
  form,
  setForm,
  saving,
  onSave,
  onSaveDraft,
  formDirty = false,
  fieldErrors = {},
  clearFieldError,
}: OrganizerEventFormDialogProps) {
  const { t, i18n } = useTranslation();

  const patch = (partial: Partial<FormState>, clearKey?: string) => {
    setForm({ ...form, ...partial });
    if (clearKey) clearFieldError?.(clearKey);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display" style={{ fontWeight: 800 }}>
            {editingId ? t("organizer.editEvent") : t("organizer.createEvent")}
          </DialogTitle>
          <DialogDescription className="text-[var(--race-muted)]">
            {t("organizer.formHint")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div className="space-y-2 sm:col-span-2">
            <Label className="inline-flex items-baseline gap-0.5">
              {t("organizer.name")}
              <span className="text-red-500 font-bold">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => patch({ name: e.target.value }, "name")}
              placeholder={t("organizer.namePlaceholder")}
              className={fieldClass(!!fieldErrors.name)}
            />
            {fieldErrors.name && <p className="text-xs text-red-400">{fieldErrors.name}</p>}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="inline-flex items-baseline gap-0.5">
              {t("organizer.description")}
              <span className="text-red-500 font-bold">*</span>
            </Label>
            <Textarea
              value={form.description}
              onChange={(e) => patch({ description: e.target.value }, "description")}
              rows={3}
              placeholder={t("organizer.descPlaceholder")}
              className={fieldClass(!!fieldErrors.description)}
            />
            {fieldErrors.description && (
              <p className="text-xs text-red-400">{fieldErrors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="inline-flex items-baseline gap-0.5">
              {t("events.category")}
              <span className="text-red-500 font-bold">*</span>
            </Label>
            <Select
              value={form.category || undefined}
              onValueChange={(v) => {
                patch(
                  {
                    category: v,
                    categoryOther: v === OTHER ? form.categoryOther : "",
                  },
                  "category",
                );
              }}
            >
              <SelectTrigger className={fieldClass(!!fieldErrors.category)}>
                <SelectValue placeholder={t("organizer.selectCategory")} />
              </SelectTrigger>
              <SelectContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)] max-h-72">
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
                <SelectItem value={OTHER}>{t("organizer.other")}</SelectItem>
              </SelectContent>
            </Select>
            {form.category === OTHER && (
              <Input
                value={form.categoryOther}
                onChange={(e) => patch({ categoryOther: e.target.value }, "category")}
                placeholder={t("organizer.customCategory")}
                className={fieldClass(!!fieldErrors.category)}
              />
            )}
            {fieldErrors.category && <p className="text-xs text-red-400">{fieldErrors.category}</p>}
          </div>

          <div className="space-y-2">
            <Label className="inline-flex items-baseline gap-0.5">
              {t("organizer.startDate")}
              <span className="text-red-500 font-bold">*</span>
            </Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => patch({ date: e.target.value }, "date")}
              className={`${fieldClass(!!fieldErrors.date)} ${DATE_INPUT_CLASS}`}
            />
            {fieldErrors.date && <p className="text-xs text-red-400">{fieldErrors.date}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t("organizer.startTime")}</Label>
            <Select
              value={form.time || undefined}
              onValueChange={(v) =>
                setForm({ ...form, time: v, timeOther: v === OTHER ? form.timeOther : "" })
              }
            >
              <SelectTrigger className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]">
                <SelectValue placeholder={t("organizer.selectTime")} />
              </SelectTrigger>
              <SelectContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)]">
                {START_TIMES.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
                <SelectItem value={OTHER}>{t("organizer.otherTime")}</SelectItem>
              </SelectContent>
            </Select>
            {form.time === OTHER && (
              <Input
                type="time"
                value={form.timeOther}
                onChange={(e) => setForm({ ...form, timeOther: e.target.value })}
                className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label className="inline-flex items-baseline gap-0.5">
              {t("organizer.trackLocation")}
              <span className="text-red-500 font-bold">*</span>
            </Label>
            <Select
              value={form.trackKey || undefined}
              onValueChange={(v) => {
                setForm((prev) => applyTrackPreset(prev, v));
                clearFieldError?.("track");
              }}
            >
              <SelectTrigger className={fieldClass(!!fieldErrors.track)}>
                <SelectValue placeholder={t("organizer.selectTrack")} />
              </SelectTrigger>
              <SelectContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)]">
                {TRACK_PRESETS.map((track) => (
                  <SelectItem key={track.track} value={track.track}>
                    {track.track}
                  </SelectItem>
                ))}
                <SelectItem value={OTHER}>{t("organizer.otherTrack")}</SelectItem>
              </SelectContent>
            </Select>
            {form.trackKey === OTHER && (
              <Input
                value={form.trackOther}
                onChange={(e) => patch({ trackOther: e.target.value }, "track")}
                placeholder={t("organizer.trackName")}
                className={fieldClass(!!fieldErrors.track)}
              />
            )}
            {fieldErrors.track && <p className="text-xs text-red-400">{fieldErrors.track}</p>}
            {form.trackKey && form.trackKey !== OTHER && (
              <p className="text-xs text-[var(--race-muted)]">
                {t("organizer.trackAutoFill", { city: form.city, region: form.voivodeship })}
                {form.lat && form.lng
                  ? t("organizer.trackAutoFillMap", { lat: form.lat, lng: form.lng })
                  : ""}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="inline-flex items-baseline gap-0.5">
              {t("events.city")}
              <span className="text-red-500 font-bold">*</span>
            </Label>
            {form.trackKey === OTHER || !form.trackKey ? (
              <>
                <Select
                  value={form.city || undefined}
                  onValueChange={(v) => {
                    if (v === OTHER) {
                      patch({ city: OTHER, cityOther: "" }, "city");
                      return;
                    }
                    const match = TRACK_PRESETS.find((track) => track.city === v);
                    patch(
                      {
                        city: v,
                        cityOther: "",
                        voivodeship: match?.voivodeship ?? form.voivodeship,
                        lat: match ? String(match.lat) : form.lat,
                        lng: match ? String(match.lng) : form.lng,
                      },
                      "city",
                    );
                    if (match?.voivodeship) clearFieldError?.("voivodeship");
                  }}
                >
                  <SelectTrigger className={fieldClass(!!fieldErrors.city)}>
                    <SelectValue placeholder={t("organizer.selectCity")} />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)]">
                    {Array.from(new Set(TRACK_PRESETS.map((track) => track.city)))
                      .sort((a, b) => a.localeCompare(b, i18n.language))
                      .map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    <SelectItem value={OTHER}>{t("organizer.otherCity")}</SelectItem>
                  </SelectContent>
                </Select>
                {form.city === OTHER && (
                  <Input
                    value={form.cityOther}
                    onChange={(e) => patch({ cityOther: e.target.value }, "city")}
                    placeholder={t("organizer.cityName")}
                    className={fieldClass(!!fieldErrors.city)}
                  />
                )}
              </>
            ) : (
              <Input
                value={form.city}
                readOnly
                className="bg-[var(--race-bg)]/60 border-[var(--race-border)] text-[var(--race-muted)]"
              />
            )}
            {fieldErrors.city && <p className="text-xs text-red-400">{fieldErrors.city}</p>}
          </div>

          <div className="space-y-2">
            <Label className="inline-flex items-baseline gap-0.5">
              {t("organizer.voivodeship")}
              <span className="text-red-500 font-bold">*</span>
            </Label>
            <Select
              value={form.voivodeship || undefined}
              onValueChange={(v) => patch({ voivodeship: v }, "voivodeship")}
              disabled={Boolean(form.trackKey && form.trackKey !== OTHER)}
            >
              <SelectTrigger className={`${fieldClass(!!fieldErrors.voivodeship)} disabled:opacity-60`}>
                <SelectValue placeholder={t("organizer.selectVoivodeship")} />
              </SelectTrigger>
              <SelectContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)]">
                {VOIVODESHIPS.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.voivodeship && (
              <p className="text-xs text-red-400">{fieldErrors.voivodeship}</p>
            )}
          </div>

          {/* Mapa tylko przy open – unika Leaflet w ukrytym dialogu (zerowy size). */}
          <div className="space-y-2 sm:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--race-accent)]" />
                {t("organizer.mapLocation")}
              </Label>
              {form.lat && form.lng ? (
                <span className="text-xs text-[var(--race-muted)] font-mono">
                  {form.lat}, {form.lng}
                </span>
              ) : (
                <span className="text-xs text-[var(--race-muted)]">{t("organizer.mapHintShort")}</span>
              )}
            </div>
            <p className="text-xs text-[var(--race-muted)]">{t("organizer.mapHint")}</p>
            {open && (
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
                className="border-[var(--race-border)] text-[var(--race-muted)]"
                onClick={() => setForm({ ...form, lat: "", lng: "" })}
              >
                {t("organizer.removePin")}
              </Button>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>{t("organizer.eventPhoto")}</Label>
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
                        ? "border-[var(--race-accent)] ring-1 ring-[var(--race-accent)]"
                        : "border-[var(--race-border)] hover:border-[var(--race-accent)]/50"
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
              className="mt-2 border-[var(--race-border)] text-[var(--race-fg)]"
              onClick={() => setForm({ ...form, imageCustom: true, imageUrl: form.imageCustom ? form.imageUrl : "" })}
            >
              {t("organizer.customPhoto")}
            </Button>
            {form.imageCustom && (
              <ImageUploadField
                value={form.imageUrl}
                onChange={(url) => {
                  setForm({ ...form, imageUrl: url, imageCustom: true });
                  clearFieldError?.("imageUrl");
                }}
                className="mt-2 space-y-2"
                error={fieldErrors.imageUrl}
              />
            )}
          </div>

          <div className="sm:col-span-2 flex items-center gap-3 border border-[var(--race-border)] rounded-md px-3 py-2.5 box-border overflow-hidden">
            <div className="flex-1 min-w-0 pr-1">
              <Label className="text-[var(--race-fg)]">{t("organizer.acceptRegs")}</Label>
              <p className="text-xs text-[var(--race-muted)] truncate">{t("organizer.acceptRegsHint")}</p>
            </div>
            <Switch
              className="shrink-0"
              checked={form.acceptRegistrations}
              onCheckedChange={(v) =>
                setForm({
                  ...form,
                  acceptRegistrations: v,
                  bankAccount: v ? form.bankAccount : "",
                })
              }
            />
          </div>

          {form.acceptRegistrations && (
            <div className="sm:col-span-2 space-y-3 border border-[var(--race-border)] rounded-md p-3">
              <p className="text-sm text-[var(--race-accent)]" style={{ fontWeight: 700 }}>
                {t("organizer.driverReqs")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {REQUIREMENT_KEYS.map(([key, labelKey]) => (
                  <div key={key} className="flex items-center gap-3 rounded border border-[var(--race-border)] px-3 py-2 box-border overflow-hidden">
                    <Label className="text-[var(--race-fg)] text-sm flex-1 min-w-0 pr-1 leading-snug">
                      {t(labelKey)}
                    </Label>
                    <Switch
                      className="shrink-0"
                      checked={form[key]}
                      onCheckedChange={(v) => setForm({ ...form, [key]: v })}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t("organizer.endDateOptional")}</Label>
            <Input
              type="date"
              value={form.endDate}
              onChange={(e) => patch({ endDate: e.target.value }, "endDate")}
              className={`${fieldClass(!!fieldErrors.endDate)} ${DATE_INPUT_CLASS}`}
            />
            {fieldErrors.endDate && <p className="text-xs text-red-400">{fieldErrors.endDate}</p>}
          </div>
          <div className="space-y-2">
            <Label>{t("organizer.endTimeOptional")}</Label>
            <Input
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("organizer.spectatorFee")}</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.spectatorFee}
              onChange={(e) => setForm({ ...form, spectatorFee: e.target.value })}
              placeholder={t("organizer.spectatorFeeExample")}
              className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>{t("organizer.externalUrl")}</Label>
            <Input
              value={form.externalUrl}
              onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
              placeholder={t("organizer.externalUrlExample")}
              className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
            />
          </div>

          {/* Płatne: pełny flow przelewu tylko przy online zgłoszeniach; inaczej sama cena informacyjna. */}
          <div className="sm:col-span-2 flex items-center gap-3 border border-[var(--race-border)] rounded-md px-3 py-2.5 box-border overflow-hidden">
            <div className="flex-1 min-w-0 pr-1">
              <Label className="text-[var(--race-fg)]">{t("organizer.paidEvent")}</Label>
              <p className="text-xs text-[var(--race-muted)] truncate">
                {form.acceptRegistrations
                  ? t("organizer.paidTransfer")
                  : t("organizer.priceInfoOnly")}
              </p>
            </div>
            <Switch
              className="shrink-0"
              checked={form.paid}
              onCheckedChange={(v) => setForm({ ...form, paid: v })}
            />
          </div>

          {form.paid && (
            <>
              <div className="space-y-2 sm:col-span-2">
                <Label>
                  {form.acceptRegistrations ? t("organizer.entryFee") : t("organizer.priceInfoPln")}
                </Label>
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
                          ? "border-[var(--race-accent)] bg-[color-mix(in_srgb,var(--race-accent)_15%,transparent)] text-[var(--race-accent)]"
                          : "border-[var(--race-border)] text-[var(--race-fg)]"
                      }
                    >
                      {t("organizer.feePln", { amount: fee })}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setForm({ ...form, entryFeeOther: true, entryFee: "" })}
                    className={
                      form.entryFeeOther
                        ? "border-[var(--race-accent)] bg-[color-mix(in_srgb,var(--race-accent)_15%,transparent)] text-[var(--race-accent)]"
                        : "border-[var(--race-border)] text-[var(--race-fg)]"
                    }
                  >
                    {t("organizer.otherAmount")}
                  </Button>
                </div>
                {form.entryFeeOther && (
                  <Input
                    type="number"
                    value={form.entryFee}
                    onChange={(e) => setForm({ ...form, entryFee: e.target.value })}
                    placeholder={t("organizer.amountPln")}
                    className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)] mt-2"
                  />
                )}
              </div>
              {form.acceptRegistrations && (
                <>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="inline-flex items-baseline gap-0.5">
                      {t("organizer.bankAccountNumber")}
                      <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      value={form.bankAccount}
                      onChange={(e) => patch({ bankAccount: e.target.value }, "bankAccount")}
                      placeholder="PL…"
                      className={fieldClass(!!fieldErrors.bankAccount)}
                    />
                    {fieldErrors.bankAccount && (
                      <p className="text-xs text-red-400">{fieldErrors.bankAccount}</p>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-[var(--race-border)] text-[var(--race-accent)]"
                      onClick={() => patch({ bankAccount: DEMO_BANK_ACCOUNT }, "bankAccount")}
                    >
                      {t("organizer.insertDemoAccount")}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("organizer.paymentDeadlineLabel")}</Label>
                    <Select
                      value={form.paymentDeadlineHours}
                      onValueChange={(v) => setForm({ ...form, paymentDeadlineHours: v })}
                    >
                      <SelectTrigger className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)]">
                        {PAYMENT_DEADLINE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {t(DEADLINE_LABEL_KEYS[o.value] ?? o.label)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("organizer.freeCancelLabel")}</Label>
                    <Select
                      value={form.freeCancelDays}
                      onValueChange={(v) => setForm({ ...form, freeCancelDays: v })}
                    >
                      <SelectTrigger className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)]">
                        {FREE_CANCEL_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {t(CANCEL_LABEL_KEYS[o.value] ?? o.label)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </>
          )}

          <p className="sm:col-span-2 text-xs text-[var(--race-muted)] leading-relaxed">
            {t("organizer.privacyNoticeBefore")}
            <a href="/privacy" className="text-[var(--race-accent)] hover:underline">
              {t("organizer.privacyNoticeLink")}
            </a>
            {t("organizer.privacyNoticeAfter")}
          </p>
        </div>
        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[var(--race-border)] text-[var(--race-fg)]">
            {t("common.cancel")}
          </Button>
          <Button
            variant="outline"
            onClick={onSaveDraft}
            disabled={saving || !formDirty}
            className="border-[var(--race-accent)] text-[var(--race-accent)]"
          >
            {t("common.saveDraft")}
          </Button>
          <Button onClick={onSave} disabled={saving} className="bg-[var(--race-accent)] text-[var(--race-on-accent)]" style={{ fontWeight: 700 }}>
            {saving ? t("organizer.saving") : editingId ? t("common.save") : t("common.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
