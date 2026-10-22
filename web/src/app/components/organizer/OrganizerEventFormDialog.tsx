/**
 * OrganizerEventFormDialog — dialog tworzenia / edycji wydarzenia (panel org.).
 *
 * Wzorzec UX: większość pól z Select (presety) + wartość specjalna `OTHER` („Inne…”)
 * na własne stringi. Presety: `eventFormPresets.ts` + kategorie z `eventCategories.ts`.
 *
 * Tor preset → `applyTrackPreset` wypełnia city / województwo / lat / lng.
 * Mapa: `LocationMapPicker` montowany tylko gdy `open` (invalidateSize w pickerze).
 * Płatne: wpisowe, IBAN, termin wpłaty, darmowa anulacja — widoczne przy `form.paid`.
 * Wymagania kierowcy (PJ, PZM, OC…) — tylko gdy `acceptRegistrations`.
 *
 * Stan formularza trzymany w rodzicu (`OrganizerPanelPage`); tu tylko UI + setForm.
 *
 * Pomysł (alt): multi-step wizard; draft lokalny w localStorage przed POST.
 */

import type { Dispatch, SetStateAction } from "react";
import { MapPin } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../ui/select";
import { LocationMapPicker } from "../LocationMapPicker";
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
    ? "bg-[#121212] border-red-500 text-white ring-1 ring-red-500/60"
    : "bg-[#121212] border-[#2a2a2a] text-white";
}

/** Native date picker — biała ikona kalendarza. */
const DATE_INPUT_CLASS =
  "[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer";

interface OrganizerEventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = tworzenie; string = edycja istniejącego eventId */
  editingId: string | null;
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
  saving: boolean;
  onSave: () => void;
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
  fieldErrors = {},
  clearFieldError,
}: OrganizerEventFormDialogProps) {
  const patch = (partial: Partial<FormState>, clearKey?: string) => {
    setForm({ ...form, ...partial });
    if (clearKey) clearFieldError?.(clearKey);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0A0A0A] border-[#2a2a2a] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display" style={{ fontWeight: 800 }}>
            {editingId ? "Edytuj wydarzenie" : "Nowe wydarzenie"}
          </DialogTitle>
          <DialogDescription className="text-[#9ca3af]">
            Większość pól wybierasz z listy — „Inne…” tylko gdy potrzebujesz własnej wartości.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div className="space-y-2 sm:col-span-2">
            <Label className="inline-flex items-baseline gap-0.5">
              Nazwa<span className="text-red-500 font-bold">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => patch({ name: e.target.value }, "name")}
              placeholder="np. Drift Masters Polish Grand Prix"
              className={fieldClass(!!fieldErrors.name)}
            />
            {fieldErrors.name && <p className="text-xs text-red-400">{fieldErrors.name}</p>}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="inline-flex items-baseline gap-0.5">
              Opis<span className="text-red-500 font-bold">*</span>
            </Label>
            <Textarea
              value={form.description}
              onChange={(e) => patch({ description: e.target.value }, "description")}
              rows={3}
              placeholder="Krótki opis rundy, klas i atrakcji…"
              className={fieldClass(!!fieldErrors.description)}
            />
            {fieldErrors.description && (
              <p className="text-xs text-red-400">{fieldErrors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="inline-flex items-baseline gap-0.5">
              Kategoria<span className="text-red-500 font-bold">*</span>
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
                <SelectValue placeholder="Wybierz kategorię" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white max-h-72">
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
                <SelectItem value={OTHER}>Inne…</SelectItem>
              </SelectContent>
            </Select>
            {form.category === OTHER && (
              <Input
                value={form.categoryOther}
                onChange={(e) => patch({ categoryOther: e.target.value }, "category")}
                placeholder="Własna kategoria"
                className={fieldClass(!!fieldErrors.category)}
              />
            )}
            {fieldErrors.category && <p className="text-xs text-red-400">{fieldErrors.category}</p>}
          </div>

          <div className="space-y-2">
            <Label className="inline-flex items-baseline gap-0.5">
              Data rozpoczęcia<span className="text-red-500 font-bold">*</span>
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
            <Label className="inline-flex items-baseline gap-0.5">
              Tor / lokalizacja<span className="text-red-500 font-bold">*</span>
            </Label>
            <Select
              value={form.trackKey || undefined}
              onValueChange={(v) => {
                setForm((prev) => applyTrackPreset(prev, v));
                clearFieldError?.("track");
              }}
            >
              <SelectTrigger className={fieldClass(!!fieldErrors.track)}>
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
                onChange={(e) => patch({ trackOther: e.target.value }, "track")}
                placeholder="Nazwa toru"
                className={fieldClass(!!fieldErrors.track)}
              />
            )}
            {fieldErrors.track && <p className="text-xs text-red-400">{fieldErrors.track}</p>}
            {form.trackKey && form.trackKey !== OTHER && (
              <p className="text-xs text-[#9ca3af]">
                Auto: {form.city}, {form.voivodeship}
                {form.lat && form.lng ? ` · mapa ${form.lat}, ${form.lng}` : ""}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="inline-flex items-baseline gap-0.5">
              Miasto<span className="text-red-500 font-bold">*</span>
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
                    const match = TRACK_PRESETS.find((t) => t.city === v);
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
                    onChange={(e) => patch({ cityOther: e.target.value }, "city")}
                    placeholder="Nazwa miasta"
                    className={fieldClass(!!fieldErrors.city)}
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
            {fieldErrors.city && <p className="text-xs text-red-400">{fieldErrors.city}</p>}
          </div>

          <div className="space-y-2">
            <Label className="inline-flex items-baseline gap-0.5">
              Województwo<span className="text-red-500 font-bold">*</span>
            </Label>
            <Select
              value={form.voivodeship || undefined}
              onValueChange={(v) => patch({ voivodeship: v }, "voivodeship")}
              disabled={Boolean(form.trackKey && form.trackKey !== OTHER)}
            >
              <SelectTrigger className={`${fieldClass(!!fieldErrors.voivodeship)} disabled:opacity-60`}>
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
            {fieldErrors.voivodeship && (
              <p className="text-xs text-red-400">{fieldErrors.voivodeship}</p>
            )}
          </div>

          {/* Mapa tylko przy open — unika Leaflet w ukrytym dialogu (zerowy size). */}
          <div className="space-y-2 sm:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--race-accent)]" />
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
                        ? "border-[var(--race-accent)] ring-1 ring-[var(--race-accent)]"
                        : "border-[#2a2a2a] hover:border-[var(--race-accent)]/50"
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

          <div className="sm:col-span-2 flex items-center gap-3 border border-[#2a2a2a] rounded-md px-3 py-2.5 box-border overflow-hidden">
            <div className="flex-1 min-w-0 pr-1">
              <Label className="text-white">Przyjmuj zgłoszenia na stronie</Label>
              <p className="text-xs text-[#9ca3af] truncate">Kierowcy mogą zapisywać się od razu po akceptacji admina</p>
            </div>
            <Switch
              className="shrink-0"
              checked={form.acceptRegistrations}
              onCheckedChange={(v) => setForm({ ...form, acceptRegistrations: v })}
            />
          </div>

          {form.acceptRegistrations && (
            <div className="sm:col-span-2 space-y-3 border border-[#2a2a2a] rounded-md p-3">
              <p className="text-sm text-[var(--race-accent)]" style={{ fontWeight: 700 }}>
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
                  <div key={key} className="flex items-center gap-3 rounded border border-[#2a2a2a] px-3 py-2 box-border overflow-hidden">
                    <Label className="text-white text-sm flex-1 min-w-0 truncate pr-1">{label}</Label>
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
            <Label>Data zakończenia (opcj.)</Label>
            <Input
              type="date"
              value={form.endDate}
              onChange={(e) => patch({ endDate: e.target.value }, "endDate")}
              className={`${fieldClass(!!fieldErrors.endDate)} ${DATE_INPUT_CLASS}`}
            />
            {fieldErrors.endDate && <p className="text-xs text-red-400">{fieldErrors.endDate}</p>}
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

          {/* Płatne: flow ACCEPTED → proof → CONFIRMED (patrz OrganizerRegistrationsList). */}
          <div className="sm:col-span-2 flex items-center gap-3 border border-[#2a2a2a] rounded-md px-3 py-2.5 box-border overflow-hidden">
            <div className="flex-1 min-w-0 pr-1">
              <Label className="text-white">Wydarzenie płatne</Label>
              <p className="text-xs text-[#9ca3af] truncate">Wpisowe + weryfikacja przelewu</p>
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
                          ? "border-[var(--race-accent)] bg-[color-mix(in_srgb,var(--race-accent)_15%,transparent)] text-[var(--race-accent)]"
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
                        ? "border-[var(--race-accent)] bg-[color-mix(in_srgb,var(--race-accent)_15%,transparent)] text-[var(--race-accent)]"
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
                <Label className="inline-flex items-baseline gap-0.5">
                  Numer konta<span className="text-red-500 font-bold">*</span>
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
                  className="border-[#2a2a2a] text-[var(--race-accent)]"
                  onClick={() => patch({ bankAccount: DEMO_BANK_ACCOUNT }, "bankAccount")}
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
            <a href="/privacy" className="text-[var(--race-accent)] hover:underline">
              polityką prywatności
            </a>{" "}
            (RODO) wyłącznie w celu publikacji i obsługi zgłoszeń.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[#2a2a2a] text-white">
            Anuluj
          </Button>
          <Button onClick={onSave} disabled={saving} className="bg-[var(--race-accent)] text-[#121212]" style={{ fontWeight: 700 }}>
            {saving ? "ZAPISYWANIE..." : editingId ? "Zapisz" : "Utwórz"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
