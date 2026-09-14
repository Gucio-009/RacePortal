/**
 * GaragePage — CRUD pojazdów użytkownika (garaż).
 *
 * Cel: auta używane przy zgłoszeniach (klasa/kategoria, OC/PT, klatka, rejestracja).
 * Wzorce: fetch `/api/garage` on mount, Dialog create/edit, PATCH/POST/DELETE z JWT
 * (`raceportal_token`), `buildPayload` normalizuje stringi → liczby/undefined.
 * Auth: wymaga zalogowania (AuthGate). Theme: `--race-accent`, `font-display`.
 * Docker/nginx: deep link `/garaz` → SPA try_files.
 *
 * Pomysł (alt): TanStack Query mutations; upload zdjęć do S3; Zod schema formularza;
 * shared types z packages/api-types.
 */
import { useEffect, useState } from "react";
import { Car, Plus, Trash2, Loader2, Pencil } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { api, ApiError } from "../lib/api";
import type { Car as GarageCar } from "../lib/types";
import { CAR_CATEGORIES } from "../lib/carMatch";
import { toast } from "sonner";

const DRIVE_TYPES = ["FWD", "RWD", "AWD"] as const;
const REGISTRATION_TYPES = ["cywilne", "sportowe"] as const;

const emptyForm = {
  make: "",
  model: "",
  year: "",
  className: "",
  plate: "",
  imageUrl: "",
  driveType: "",
  powerHp: "",
  engineCc: "",
  weightKg: "",
  registered: true,
  registrationType: "",
  kssNumber: "",
  hasRollCage: false,
  hasOc: false,
  hasPt: false,
  socialUrl: "",
  videoUrl: "",
  modifications: "",
};

function carToForm(car: GarageCar) {
  return {
    make: car.make,
    model: car.model,
    year: car.year ? String(car.year) : "",
    className: car.className ?? "",
    plate: car.plate ?? "",
    imageUrl: car.imageUrl ?? "",
    driveType: car.driveType ?? "",
    powerHp: car.powerHp ? String(car.powerHp) : "",
    engineCc: car.engineCc ? String(car.engineCc) : "",
    weightKg: car.weightKg ? String(car.weightKg) : "",
    registered: car.registered ?? true,
    registrationType: car.registrationType ?? "",
    kssNumber: car.kssNumber ?? "",
    hasRollCage: car.hasRollCage ?? false,
    hasOc: car.hasOc ?? false,
    hasPt: car.hasPt ?? false,
    socialUrl: car.socialUrl ?? "",
    videoUrl: car.videoUrl ?? "",
    modifications: car.modifications ?? "",
  };
}

/** Cyfry-only dla pól liczbowych (rok / KM / cm³ / kg). */
function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function ReqLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <Label className="text-white">
      {children}
      {required ? <span className="text-red-500 font-bold"> *</span> : null}
    </Label>
  );
}

/** Mapuje formularz na body API. W edycji puste stringi/null czyszczą pola po stronie backendu. */
function buildPayload(form: typeof emptyForm, forUpdate: boolean) {
  const numOrUndef = (raw: string) => (raw.trim() === "" ? undefined : Number(raw));
  const numOrNull = (raw: string) => (raw.trim() === "" ? null : Number(raw));
  const strOrUndef = (raw: string) => {
    const t = raw.trim();
    return t === "" ? undefined : t;
  };
  const strClearable = (raw: string) => raw.trim(); // "" → backend blankToNull

  return {
    make: form.make.trim(),
    model: form.model.trim(),
    year: forUpdate ? numOrNull(form.year) : numOrUndef(form.year),
    className: forUpdate ? strClearable(form.className) : strOrUndef(form.className),
    plate: forUpdate ? strClearable(form.plate) : strOrUndef(form.plate),
    imageUrl: forUpdate ? strClearable(form.imageUrl) : strOrUndef(form.imageUrl),
    driveType: forUpdate ? strClearable(form.driveType) : strOrUndef(form.driveType),
    powerHp: forUpdate ? numOrNull(form.powerHp) : numOrUndef(form.powerHp),
    engineCc: forUpdate ? numOrNull(form.engineCc) : numOrUndef(form.engineCc),
    weightKg: forUpdate ? numOrNull(form.weightKg) : numOrUndef(form.weightKg),
    registered: form.registered,
    registrationType: form.registered
      ? forUpdate
        ? strClearable(form.registrationType)
        : strOrUndef(form.registrationType)
      : forUpdate
        ? ""
        : undefined,
    kssNumber:
      form.registered && form.registrationType === "sportowe"
        ? forUpdate
          ? strClearable(form.kssNumber)
          : strOrUndef(form.kssNumber)
        : forUpdate
          ? ""
          : undefined,
    hasRollCage: form.hasRollCage,
    hasOc: form.hasOc,
    hasPt: form.hasPt,
    socialUrl: forUpdate ? strClearable(form.socialUrl) : strOrUndef(form.socialUrl),
    videoUrl: forUpdate ? strClearable(form.videoUrl) : strOrUndef(form.videoUrl),
    modifications: forUpdate ? strClearable(form.modifications) : strOrUndef(form.modifications),
  };
}

function validateGarageForm(form: typeof emptyForm): string | null {
  if (!form.make.trim()) return "Marka jest wymagana";
  if (!form.model.trim()) return "Model jest wymagany";
  if (!form.year.trim()) return "Rok produkcji jest wymagany";
  const year = Number(form.year);
  const maxYear = new Date().getFullYear();
  if (!Number.isFinite(year) || year < 1900 || year > maxYear) {
    return `Rok produkcji musi być w zakresie 1900–${maxYear}`;
  }
  if (!form.driveType) return "Rodzaj napędu jest wymagany";
  if (!form.powerHp.trim() || Number(form.powerHp) <= 0) return "Moc (KM) jest wymagana";
  if (form.engineCc.trim() === "" || Number(form.engineCc) < 0) {
    return "Pojemność (cm³) jest wymagana (0 = EV)";
  }
  if (!form.weightKg.trim() || Number(form.weightKg) <= 0) return "Masa (kg) jest wymagana";
  if (!form.imageUrl.trim()) return "Zdjęcie auta (URL) jest wymagane";
  return null;
}

export function GaragePage() {
  const [cars, setCars] = useState<GarageCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadCars = () => {
    setLoading(true);
    setLoadError(null);
    api
      .get<GarageCar[]>("/api/garage")
      .then((items) => {
        setCars(items);
        setLoadError(null);
      })
      .catch((e) => {
        setCars([]);
        setLoadError(e instanceof ApiError ? e.message : "Nie udało się pobrać garażu");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCars();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (car: GarageCar) => {
    setEditingId(car.id);
    setForm(carToForm(car));
    setDialogOpen(true);
  };

  /** POST nowe / PATCH istniejące — potem reload listy. */
  const handleSave = async () => {
    const validationError = validateGarageForm(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setSaving(true);
    const payload = buildPayload(form, Boolean(editingId));
    try {
      if (editingId) {
        await api.patch(`/api/garage/${editingId}`, payload);
        toast.success("Auto zaktualizowane");
      } else {
        await api.post("/api/garage", payload);
        toast.success("Auto dodane do garażu");
      }
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      loadCars();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Nie udało się zapisać auta");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/garage/${id}`);
      toast.success("Auto usunięte");
      setCars((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Nie udało się usunąć auta");
    }
  };

  return (
    <div className="min-h-screen">
      <section className="bg-[#1a1a1a] border-b border-[#2a2a2a] py-12">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-white mb-2" style={{ fontSize: "40px", fontWeight: 800 }}>
              MÓJ <span className="text-[var(--race-accent)]">GARAŻ</span>
            </h1>
            <p className="text-[#9ca3af]">Zarządzaj autami używanymi przy zgłoszeniach na wydarzenia.</p>
          </div>
          <Button
            onClick={openAdd}
            className="bg-[var(--race-accent)] text-[#121212] hover:brightness-95"
            style={{ fontWeight: 800 }}
          >
            <Plus className="w-4 h-4 mr-2" />
            DODAJ AUTO
          </Button>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center py-16 text-[#9ca3af]">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[var(--race-accent)]" />
            Ładowanie garażu...
          </div>
        ) : loadError ? (
          <p className="text-center text-red-400 py-16">{loadError}</p>
        ) : cars.length === 0 ? (
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardContent className="py-16 text-center">
              <Car className="w-16 h-16 text-[var(--race-accent)] mx-auto mb-4" />
              <p className="text-[#9ca3af] mb-6">Twój garaż jest pusty. Dodaj pierwsze auto!</p>
              <Button onClick={openAdd} className="bg-[var(--race-accent)] text-[#121212]" style={{ fontWeight: 700 }}>
                Dodaj auto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => (
              <Card key={car.id} className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="font-display text-white flex items-center gap-2" style={{ fontWeight: 800 }}>
                    <Car className="w-5 h-5 text-[var(--race-accent)]" />
                    {car.make} {car.model}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-[#9ca3af]">
                  {car.year && <p>Rocznik: {car.year}</p>}
                  {car.driveType && <p>Napęd: {car.driveType}</p>}
                  {car.powerHp && <p>Moc: {car.powerHp} KM</p>}
                  {car.className && (
                    <p>
                      Kategoria:{" "}
                      <span className="text-[var(--race-accent)]" style={{ fontWeight: 700 }}>
                        {car.className}
                      </span>
                    </p>
                  )}
                  {car.plate && <p>Rejestracja: {car.plate}</p>}
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(car)}
                      className="border-[var(--race-accent)] text-[var(--race-accent)] hover:bg-[var(--race-accent)] hover:text-[#121212]"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edytuj
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(car.id)}
                      className="border-red-900 text-red-400 hover:bg-red-950"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Usuń
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#0A0A0A] border-[#2a2a2a] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display" style={{ fontWeight: 800 }}>
              {editingId ? "Edytuj auto" : "Dodaj auto"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <ReqLabel required>Marka</ReqLabel>
              <Input value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} className="bg-[#121212] border-[#2a2a2a] text-white" />
            </div>
            <div className="space-y-2">
              <ReqLabel required>Model</ReqLabel>
              <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="bg-[#121212] border-[#2a2a2a] text-white" />
            </div>
            <div className="space-y-2">
              <ReqLabel required>Rok produkcji</ReqLabel>
              <Input
                value={form.year}
                onChange={(e) => setForm({ ...form, year: digitsOnly(e.target.value).slice(0, 4) })}
                inputMode="numeric"
                className="bg-[#121212] border-[#2a2a2a] text-white"
              />
            </div>
            <div className="space-y-2">
              <ReqLabel required>Napęd</ReqLabel>
              <Select
                value={form.driveType || "none"}
                onValueChange={(v) => setForm({ ...form, driveType: v === "none" ? "" : v })}
              >
                <SelectTrigger className="bg-[#121212] border-[#2a2a2a] text-white">
                  <SelectValue placeholder="Wybierz napęd" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                  <SelectItem value="none">—</SelectItem>
                  {DRIVE_TYPES.map((dt) => (
                    <SelectItem key={dt} value={dt}>
                      {dt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <ReqLabel required>Moc (KM)</ReqLabel>
              <Input
                value={form.powerHp}
                onChange={(e) => setForm({ ...form, powerHp: digitsOnly(e.target.value) })}
                inputMode="numeric"
                className="bg-[#121212] border-[#2a2a2a] text-white"
              />
            </div>
            <div className="space-y-2">
              <ReqLabel required>Pojemność (cm³)</ReqLabel>
              <Input
                value={form.engineCc}
                onChange={(e) => setForm({ ...form, engineCc: digitsOnly(e.target.value) })}
                inputMode="numeric"
                className="bg-[#121212] border-[#2a2a2a] text-white"
              />
            </div>
            <div className="space-y-2">
              <ReqLabel required>Masa (kg)</ReqLabel>
              <Input
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: digitsOnly(e.target.value) })}
                inputMode="numeric"
                className="bg-[#121212] border-[#2a2a2a] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Kategoria / klasa</Label>
              <Select
                value={form.className || "none"}
                onValueChange={(v) => setForm({ ...form, className: v === "none" ? "" : v })}
              >
                <SelectTrigger className="bg-[#121212] border-[#2a2a2a] text-white">
                  <SelectValue placeholder="Wybierz kategorię" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                  <SelectItem value="none">Bez kategorii</SelectItem>
                  {CAR_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                  {form.className &&
                    !(CAR_CATEGORIES as readonly string[]).includes(form.className) && (
                      <SelectItem value={form.className}>{form.className}</SelectItem>
                    )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white">Tablica rejestracyjna</Label>
              <Input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} className="bg-[#121212] border-[#2a2a2a] text-white" />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between border border-[#2a2a2a] rounded-md p-3">
              <div>
                <ReqLabel required>Zarejestrowane</ReqLabel>
                <p className="text-xs text-[#9ca3af]">Auto posiada ważną rejestrację</p>
              </div>
              <Switch
                checked={form.registered}
                onCheckedChange={(v) =>
                  setForm({
                    ...form,
                    registered: v,
                    registrationType: v ? form.registrationType : "",
                    kssNumber: v ? form.kssNumber : "",
                  })
                }
              />
            </div>

            {form.registered && (
              <>
                <div className="space-y-2">
                  <Label className="text-white">Typ rejestracji</Label>
                  <Select
                    value={form.registrationType || "none"}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        registrationType: v === "none" ? "" : v,
                        kssNumber: v === "sportowe" ? form.kssNumber : "",
                      })
                    }
                  >
                    <SelectTrigger className="bg-[#121212] border-[#2a2a2a] text-white">
                      <SelectValue placeholder="Wybierz typ" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                      <SelectItem value="none">—</SelectItem>
                      {REGISTRATION_TYPES.map((rt) => (
                        <SelectItem key={rt} value={rt}>
                          {rt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {form.registrationType === "sportowe" && (
                  <div className="space-y-2">
                    <Label className="text-white">Numer KSS</Label>
                    <Input
                      value={form.kssNumber}
                      onChange={(e) => setForm({ ...form, kssNumber: e.target.value })}
                      placeholder="np. KSS/2024/12345"
                      className="bg-[#121212] border-[#2a2a2a] text-white"
                    />
                  </div>
                )}
              </>
            )}

            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(
                [
                  ["hasRollCage", "Klatka bezpieczeństwa"],
                  ["hasOc", "Ubezpieczenie OC"],
                  ["hasPt", "Przegląd techniczny"],
                ] as const
              ).map(([key, label]) => (
                <div
                  key={key}
                  className="flex items-center justify-between border border-[#2a2a2a] rounded-md p-3"
                >
                  <ReqLabel required>{label}</ReqLabel>
                  <Switch
                    checked={form[key]}
                    onCheckedChange={(v) => setForm({ ...form, [key]: v })}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <ReqLabel required>URL zdjęcia</ReqLabel>
              <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="bg-[#121212] border-[#2a2a2a] text-white" placeholder="https://..." />
              <p className="text-xs text-[#9ca3af]">Upload plików — w kolejnej iteracji; na razie wymagany URL JPG/PNG.</p>
            </div>
            <div className="space-y-2">
              <Label className="text-white">Profil społecznościowy</Label>
              <Input value={form.socialUrl} onChange={(e) => setForm({ ...form, socialUrl: e.target.value })} className="bg-[#121212] border-[#2a2a2a] text-white" placeholder="https://instagram.com/..." />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Link do wideo</Label>
              <Input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} className="bg-[#121212] border-[#2a2a2a] text-white" placeholder="https://youtube.com/..." />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-white">Modyfikacje</Label>
              <Textarea
                value={form.modifications}
                onChange={(e) => setForm({ ...form, modifications: e.target.value })}
                rows={3}
                placeholder="Opis modyfikacji, tuning, wyposażenie wyścigowe…"
                className="bg-[#121212] border-[#2a2a2a] text-white"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="flex-1 h-11 border-[#2a2a2a] text-white"
            >
              Anuluj
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-11 bg-[var(--race-accent)] text-[#121212]"
              style={{ fontWeight: 700 }}
            >
              {saving ? "ZAPISYWANIE..." : editingId ? "Zapisz" : "Dodaj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
