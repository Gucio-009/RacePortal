import type { Dispatch, SetStateAction } from "react";
import { MapPin } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
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

interface OrganizerEventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId: string | null;
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
  saving: boolean;
  onSave: () => void;
}

export function OrganizerEventFormDialog({
  open,
  onOpenChange,
  editingId,
  form,
  setForm,
  saving,
  onSave,
}: OrganizerEventFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0A0A0A] border-[#2a2a2a] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display" style={{ fontWeight: 800 }}>
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
                  className="border-[#2a2a2a] text-[var(--race-accent)]"
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
