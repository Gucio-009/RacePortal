/**
 * GaragePage – CRUD pojazdów użytkownika (garaż).
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { UnsavedChangesDialog } from "../components/UnsavedChangesDialog";
import { api, ApiError } from "../lib/api";
import type { Car as GarageCar } from "../lib/types";
import { CAR_CATEGORIES, parseCarClasses, serializeCarClasses } from "../lib/carMatch";
import { validateImageReference } from "../lib/profileValidation";
import { ImageUploadField } from "../components/ImageUploadField";
import { Reveal } from "../components/Reveal";
import {
  clearFormDraft,
  GARAGE_DRAFT_KEY,
  isFormDirty,
  loadFormDraft,
  saveFormDraft,
} from "../lib/formDraft";
import { toast } from "sonner";

const DRIVE_TYPES = ["FWD", "RWD", "AWD"] as const;
const REGISTRATION_TYPES = ["cywilne", "sportowe"] as const;

const emptyForm = {
  make: "",
  model: "",
  year: "",
  classNames: [] as string[],
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
    year: car.year != null ? String(car.year) : "",
    classNames: parseCarClasses(car.className),
    plate: car.plate ?? "",
    imageUrl: car.imageUrl ?? "",
    driveType: car.driveType ?? "",
    powerHp: car.powerHp != null ? String(car.powerHp) : "",
    engineCc: car.engineCc != null ? String(car.engineCc) : "",
    weightKg: car.weightKg != null ? String(car.weightKg) : "",
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
    <Label className="text-[var(--race-fg)] inline-flex items-baseline gap-0.5 max-w-full">
      <span className="truncate">{children}</span>
      {required ? (
        <span className="text-red-500 font-bold shrink-0 leading-none" aria-hidden>
          *
        </span>
      ) : null}
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

  const classNameSerialized = serializeCarClasses(form.classNames);

  return {
    make: form.make.trim(),
    model: form.model.trim(),
    year: forUpdate ? numOrNull(form.year) : numOrUndef(form.year),
    className: forUpdate ? classNameSerialized : strOrUndef(classNameSerialized),
    plate: form.registered
      ? forUpdate
        ? strClearable(form.plate)
        : strOrUndef(form.plate)
      : forUpdate
        ? ""
        : undefined,
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

const GARAGE_FIELD_LABELS: Record<string, string> = {
  make: "Marka",
  model: "Model",
  year: "Rok produkcji",
  driveType: "Rodzaj napędu",
  powerHp: "Moc (KM)",
  engineCc: "Pojemność (cm³)",
  weightKg: "Masa (kg)",
  imageUrl: "URL zdjęcia",
};

/** 0 albo wiodące zero (np. 01, 00) – osobna walidacja od pustego pola. */
function isZeroOrLeadingZero(raw: string): boolean {
  const t = raw.trim();
  if (!t) return false;
  if (/^0\d*/.test(t) && Number(t) === 0) return true;
  if (/^0\d+/.test(t)) return true;
  return Number(t) === 0;
}

function zeroFieldMessage(label: string) {
  return `Wartość w polu „${label}” nie może zaczynać się od cyfry 0 ani wynosić zero.`;
}

function validateGarageForm(form: typeof emptyForm, requireImage: boolean): Record<string, string> {
  const errors: Record<string, string> = {};
  const maxYear = new Date().getFullYear();

  if (!form.make.trim()) errors.make = "Marka jest wymagana";
  if (!form.model.trim()) errors.model = "Model jest wymagany";

  if (!form.year.trim()) {
    errors.year = "Rok produkcji jest wymagany";
  } else if (isZeroOrLeadingZero(form.year)) {
    errors.year = zeroFieldMessage("Rok produkcji");
  } else {
    const year = Number(form.year);
    if (!Number.isFinite(year) || year < 1900 || year > maxYear) {
      errors.year = `„Rok produkcji” musi być w zakresie 1900–${maxYear}`;
    }
  }

  if (!form.driveType) errors.driveType = "Rodzaj napędu jest wymagany";

  if (!form.powerHp.trim()) {
    errors.powerHp = "Moc (KM) jest wymagana";
  } else if (isZeroOrLeadingZero(form.powerHp)) {
    errors.powerHp = zeroFieldMessage("Moc (KM)");
  } else if (Number(form.powerHp) > 5000) {
    errors.powerHp = "„Moc (KM)” nie może być większe niż 5000";
  }

  if (!form.engineCc.trim()) {
    errors.engineCc = "Pojemność (cm³) jest wymagana";
  } else if (form.engineCc.trim() === "0") {
    // 0 dozwolone — auta elektryczne (informacja w UI pod polem)
  } else if (isZeroOrLeadingZero(form.engineCc)) {
    errors.engineCc = zeroFieldMessage("Pojemność (cm³)");
  } else if (Number(form.engineCc) > 20000) {
    errors.engineCc = "„Pojemność (cm³)” nie może być większe niż 20000";
  }

  if (!form.weightKg.trim()) {
    errors.weightKg = "Masa (kg) jest wymagana";
  } else if (isZeroOrLeadingZero(form.weightKg)) {
    errors.weightKg = zeroFieldMessage("Masa (kg)");
  } else if (Number(form.weightKg) > 10000) {
    errors.weightKg = "„Masa (kg)” nie może być większe niż 10000";
  }

  const imageErr = validateImageReference(form.imageUrl, requireImage);
  if (imageErr) errors.imageUrl = imageErr;

  return errors;
}

/** Osobny toast na każde pole – jeden pod drugim (prawy górny róg). */
function toastAllFieldErrors(errors: Record<string, string>) {
  Object.values(errors).forEach((msg) => toast.error(msg));
}

function formatGarageApiError(e: ApiError): { message: string; fields: Record<string, string> } {
  const fields: Record<string, string> = {};
  if (e.details) {
    for (const [key, raw] of Object.entries(e.details)) {
      const label = GARAGE_FIELD_LABELS[key] || key;
      const maxMatch = raw.match(/(?:mniejsze od|less than or equal to|<=)\s*(\d+)/i)
        || raw.match(/(\d+)\s*$/);
      if (/mniejsze|less than or equal|Max/i.test(raw) && maxMatch) {
        fields[key] = `„${label}” nie może być większe niż ${maxMatch[1]}`;
      } else if (/większe|greater|Min|zero|0/i.test(raw)) {
        fields[key] =
          `Wartość w polu „${label}” nie może zaczynać się od cyfry 0 ani wynosić zero.`;
      } else {
        fields[key] = `„${label}”: ${raw}`;
      }
    }
  }
  const unique = [...new Set(Object.values(fields))];
  const message = unique.length
    ? `Nieprawidłowe dane. ${unique.join(" ")}`
    : e.message.startsWith("Nieprawidłowe")
      ? e.message
      : `Nieprawidłowe dane. ${e.message}`;
  return { message, fields };
}

function fieldClass(hasError: boolean) {
  return hasError
    ? "bg-[var(--race-bg)] border-red-500 text-[var(--race-fg)] ring-1 ring-red-500/60"
    : "bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]";
}

export function GaragePage() {
  const [cars, setCars] = useState<GarageCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<GarageCar | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formBaseline, setFormBaseline] = useState(emptyForm);
  const [unsavedOpen, setUnsavedOpen] = useState(false);

  const garageDraftKey = editingId ? `${GARAGE_DRAFT_KEY}_${editingId}` : GARAGE_DRAFT_KEY;
  const formDirty = dialogOpen && isFormDirty(form, formBaseline);

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
    const draft = loadFormDraft<typeof emptyForm>(GARAGE_DRAFT_KEY);
    const initial = draft ?? emptyForm;
    setForm(initial);
    setFormBaseline(initial);
    setFieldErrors({});
    setDialogOpen(true);
    if (draft) toast.message("Przywrócono zapis roboczy auta");
  };

  const openEdit = (car: GarageCar) => {
    setEditingId(car.id);
    const draft = loadFormDraft<typeof emptyForm>(`${GARAGE_DRAFT_KEY}_${car.id}`);
    const initial = draft ?? carToForm(car);
    setForm(initial);
    setFormBaseline(initial);
    setFieldErrors({});
    setDialogOpen(true);
    if (draft) toast.message("Przywrócono zapis roboczy auta");
  };

  const closeFormClean = () => {
    setDialogOpen(false);
    setUnsavedOpen(false);
    setForm(emptyForm);
    setFormBaseline(emptyForm);
    setEditingId(null);
    setFieldErrors({});
  };

  const requestCloseForm = () => {
    if (formDirty) {
      setUnsavedOpen(true);
      return;
    }
    closeFormClean();
  };

  const handleSaveDraft = () => {
    saveFormDraft(garageDraftKey, form);
    toast.success("Zapisano wersję roboczą lokalnie");
    closeFormClean();
  };

  const setFormField = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  /** POST nowe / PATCH istniejące – potem reload listy. */
  const handleSave = async () => {
    const errors = validateGarageForm(form, !editingId);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toastAllFieldErrors(errors);
      return;
    }
    setFieldErrors({});
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
      clearFormDraft(garageDraftKey);
      closeFormClean();
      loadCars();
    } catch (e) {
      if (e instanceof ApiError) {
        const formatted = formatGarageApiError(e);
        setFieldErrors(formatted.fields);
        if (Object.keys(formatted.fields).length > 0) {
          toastAllFieldErrors(formatted.fields);
        } else {
          toast.error(formatted.message);
        }
      } else {
        toast.error("Nie udało się zapisać auta");
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleClassName = (cat: string) => {
    setForm((prev) => {
      const selected = prev.classNames.includes(cat)
        ? prev.classNames.filter((c) => c !== cat)
        : [...prev.classNames, cat];
      return { ...prev, classNames: selected };
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/garage/${deleteTarget.id}`);
      toast.success("Auto usunięte");
      setCars((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Nie udało się usunąć auta");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <section className="bg-[var(--race-card)] border-b border-[var(--race-border)] py-12">
        <Reveal className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-[var(--race-fg)] mb-2" style={{ fontSize: "40px", fontWeight: 800 }}>
              MÓJ <span className="text-[var(--race-accent)]">GARAŻ</span>
            </h1>
            <p className="text-[var(--race-muted)]">Zarządzaj autami używanymi przy zgłoszeniach na wydarzenia.</p>
          </div>
          <Button
            onClick={openAdd}
            className="bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95"
            style={{ fontWeight: 800 }}
          >
            <Plus className="w-4 h-4 mr-2" />
            DODAJ AUTO
          </Button>
        </Reveal>
      </section>

      <section className="container mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center py-16 text-[var(--race-muted)]">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[var(--race-accent)]" />
            Ładowanie garażu...
          </div>
        ) : loadError ? (
          <p className="text-center text-red-400 py-16">{loadError}</p>
        ) : cars.length === 0 ? (
          <Card className="bg-[var(--race-card)] border-[var(--race-border)]">
            <CardContent className="py-16 text-center">
              <Car className="w-16 h-16 text-[var(--race-accent)] mx-auto mb-4" />
              <p className="text-[var(--race-muted)] mb-6">Twój garaż jest pusty. Dodaj pierwsze auto!</p>
              <Button onClick={openAdd} className="bg-[var(--race-accent)] text-[var(--race-on-accent)]" style={{ fontWeight: 700 }}>
                Dodaj auto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car, index) => (
              <Reveal key={car.id} delay={Math.min(index * 100, 400)}>
              <Card className="event-card-lift bg-[var(--race-card)] border-[var(--race-border)] shadow-[var(--race-card-shadow)] overflow-hidden">
                {car.imageUrl && (
                  <img
                    src={car.imageUrl}
                    alt={`${car.make} ${car.model}`}
                    className="h-44 w-full object-cover"
                  />
                )}
                <CardHeader>
                  <CardTitle className="font-display text-[var(--race-fg)] flex items-center gap-2" style={{ fontWeight: 800 }}>
                    <Car className="w-5 h-5 text-[var(--race-accent)]" />
                    {car.make} {car.model}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-[var(--race-muted)]">
                  {car.year && <p>Rocznik: {car.year}</p>}
                  {car.driveType && <p>Napęd: {car.driveType}</p>}
                  {car.powerHp && <p>Moc: {car.powerHp} KM</p>}
                  {parseCarClasses(car.className).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {parseCarClasses(car.className).map((tag) => (
                        <Badge
                          key={tag}
                          className="bg-[var(--race-accent)]/15 text-[var(--race-accent)] border border-[var(--race-accent)]/40"
                          style={{ fontWeight: 700 }}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {car.registered && car.plate && <p>Rejestracja: {car.plate}</p>}
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(car)}
                      className="border-[var(--race-accent)] text-[var(--race-accent)] hover:bg-[var(--race-accent)] hover:text-[var(--race-on-accent)]"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edytuj
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteTarget(car)}
                      className="border-red-900 text-red-400 hover:bg-red-950"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Usuń
                    </Button>
                  </div>
                </CardContent>
              </Card>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) requestCloseForm();
          else setDialogOpen(true);
        }}
      >
        <DialogContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display" style={{ fontWeight: 800 }}>
              {editingId ? "Edytuj auto" : "Dodaj auto"}
            </DialogTitle>
            <DialogDescription className="text-[var(--race-muted)]">
              Wypełnij wymagane pola pojazdu. Zdjęcie jest opcjonalne – wgraj plik z dysku (max 5 MB).
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <ReqLabel required>Marka</ReqLabel>
              <Input value={form.make} onChange={(e) => setFormField("make", e.target.value)} className={fieldClass(!!fieldErrors.make)} />
              {fieldErrors.make && <p className="text-xs text-red-400">{fieldErrors.make}</p>}
            </div>
            <div className="space-y-2">
              <ReqLabel required>Model</ReqLabel>
              <Input value={form.model} onChange={(e) => setFormField("model", e.target.value)} className={fieldClass(!!fieldErrors.model)} />
              {fieldErrors.model && <p className="text-xs text-red-400">{fieldErrors.model}</p>}
            </div>
            <div className="space-y-2">
              <ReqLabel required>Rok produkcji</ReqLabel>
              <Input
                value={form.year}
                onChange={(e) => setFormField("year", digitsOnly(e.target.value).slice(0, 4))}
                inputMode="numeric"
                className={fieldClass(!!fieldErrors.year)}
              />
              {fieldErrors.year && <p className="text-xs text-red-400">{fieldErrors.year}</p>}
            </div>
            <div className="space-y-2">
              <ReqLabel required>Napęd</ReqLabel>
              <Select
                value={form.driveType || "none"}
                onValueChange={(v) => setFormField("driveType", v === "none" ? "" : v)}
              >
                <SelectTrigger className={fieldClass(!!fieldErrors.driveType)}>
                  <SelectValue placeholder="Wybierz napęd" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)]">
                  <SelectItem value="none">–</SelectItem>
                  {DRIVE_TYPES.map((dt) => (
                    <SelectItem key={dt} value={dt}>
                      {dt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.driveType && <p className="text-xs text-red-400">{fieldErrors.driveType}</p>}
            </div>
            <div className="space-y-2">
              <ReqLabel required>Moc (KM)</ReqLabel>
              <Input
                value={form.powerHp}
                onChange={(e) => setFormField("powerHp", digitsOnly(e.target.value))}
                inputMode="numeric"
                className={fieldClass(!!fieldErrors.powerHp)}
              />
              {fieldErrors.powerHp && <p className="text-xs text-red-400">{fieldErrors.powerHp}</p>}
            </div>
            <div className="space-y-2">
              <ReqLabel required>Pojemność (cm³)</ReqLabel>
              <Input
                value={form.engineCc}
                onChange={(e) => setFormField("engineCc", digitsOnly(e.target.value))}
                inputMode="numeric"
                className={fieldClass(!!fieldErrors.engineCc)}
              />
              <p className="text-xs text-[var(--race-muted)]">
                Dla aut elektrycznych wpisz 0.
              </p>
              {fieldErrors.engineCc && <p className="text-xs text-red-400">{fieldErrors.engineCc}</p>}
            </div>
            <div className="space-y-2">
              <ReqLabel required>Masa (kg)</ReqLabel>
              <Input
                value={form.weightKg}
                onChange={(e) => setFormField("weightKg", digitsOnly(e.target.value))}
                inputMode="numeric"
                className={fieldClass(!!fieldErrors.weightKg)}
              />
              {fieldErrors.weightKg && <p className="text-xs text-red-400">{fieldErrors.weightKg}</p>}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-[var(--race-fg)]">Kategoria / klasa</Label>
              <p className="text-xs text-[var(--race-muted)]">
                Możesz wybrać kilka tagów (np. Time Attack, KJS i Drift jednocześnie).
              </p>
              <div className="flex flex-wrap gap-2">
                {CAR_CATEGORIES.map((cat) => {
                  const selected = form.classNames.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleClassName(cat)}
                      className={
                        selected
                          ? "inline-flex items-center rounded-md border border-[var(--race-accent)] bg-[var(--race-accent)] text-[var(--race-on-accent)] px-2.5 py-1 text-xs font-semibold transition-colors"
                          : "inline-flex items-center rounded-md border border-[var(--race-border)] bg-[var(--race-bg)] text-[var(--race-fg)] px-2.5 py-1 text-xs font-medium hover:border-[var(--race-accent)]/60 transition-colors"
                      }
                      aria-pressed={selected}
                    >
                      {cat}
                    </button>
                  );
                })}
                {form.classNames
                  .filter((c) => !(CAR_CATEGORIES as readonly string[]).includes(c))
                  .map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleClassName(cat)}
                      className="inline-flex items-center rounded-md border border-[var(--race-accent)] bg-[var(--race-accent)] text-[var(--race-on-accent)] px-2.5 py-1 text-xs font-semibold"
                      aria-pressed
                    >
                      {cat}
                    </button>
                  ))}
              </div>
            </div>

            <div className="sm:col-span-2 flex items-center gap-3 border border-[var(--race-border)] rounded-md px-3 py-2.5 box-border overflow-hidden">
              <div className="flex-1 min-w-0 pr-1">
                <ReqLabel required>Zarejestrowane</ReqLabel>
                <p className="text-xs text-[var(--race-muted)] truncate">Auto posiada ważną rejestrację</p>
              </div>
              <Switch
                className="shrink-0"
                checked={form.registered}
                onCheckedChange={(v) =>
                  setForm({
                    ...form,
                    registered: v,
                    plate: v ? form.plate : "",
                    registrationType: v ? form.registrationType : "",
                    kssNumber: v ? form.kssNumber : "",
                  })
                }
              />
            </div>

            {form.registered && (
              <>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-[var(--race-fg)]">Tablica rejestracyjna</Label>
                  <Input
                    value={form.plate}
                    onChange={(e) => setForm({ ...form, plate: e.target.value })}
                    className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[var(--race-fg)]">Typ rejestracji</Label>
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
                    <SelectTrigger className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]">
                      <SelectValue placeholder="Wybierz typ" />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)]">
                      <SelectItem value="none">–</SelectItem>
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
                    <Label className="text-[var(--race-fg)]">Numer KSS</Label>
                    <Input
                      value={form.kssNumber}
                      onChange={(e) => setForm({ ...form, kssNumber: e.target.value })}
                      placeholder="np. KSS/2024/12345"
                      className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
                    />
                  </div>
                )}
              </>
            )}

            <div className="sm:col-span-2 flex flex-col gap-3">
              {(
                [
                  ["hasRollCage", "Klatka bezpieczeństwa"],
                  ["hasOc", "Ubezpieczenie OC"],
                  ["hasPt", "Przegląd techniczny"],
                ] as const
              ).map(([key, label]) => (
                <div
                  key={key}
                  className="flex items-center gap-3 border border-[var(--race-border)] rounded-md px-3 py-2.5 box-border overflow-hidden"
                >
                  <div className="flex-1 min-w-0 pr-1">
                    <ReqLabel required>{label}</ReqLabel>
                  </div>
                  <Switch
                    className="shrink-0"
                    checked={form[key]}
                    onCheckedChange={(v) => setForm({ ...form, [key]: v })}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <ReqLabel required={!editingId}>Zdjęcie</ReqLabel>
              <ImageUploadField
                value={form.imageUrl}
                onChange={(url) => setFormField("imageUrl", url)}
                inputClassName={fieldClass(!!fieldErrors.imageUrl)}
                error={fieldErrors.imageUrl}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[var(--race-fg)]">Profil społecznościowy</Label>
              <Input value={form.socialUrl} onChange={(e) => setForm({ ...form, socialUrl: e.target.value })} className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]" placeholder="https://instagram.com/..." />
            </div>
            <div className="space-y-2">
              <Label className="text-[var(--race-fg)]">Link do wideo</Label>
              <Input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]" placeholder="https://youtube.com/..." />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-[var(--race-fg)]">Modyfikacje</Label>
              <Textarea
                value={form.modifications}
                onChange={(e) => setForm({ ...form, modifications: e.target.value })}
                rows={3}
                placeholder="Opis modyfikacji, tuning, wyposażenie wyścigowe…"
                className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={requestCloseForm}
              className="flex-1 h-11 border-[var(--race-border)] text-[var(--race-fg)]"
            >
              Anuluj
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={saving || !formDirty}
              className="flex-1 h-11 border-[var(--race-accent)] text-[var(--race-accent)]"
            >
              Zapisz roboczo
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-11 bg-[var(--race-accent)] text-[var(--race-on-accent)]"
              style={{ fontWeight: 700 }}
            >
              {saving ? "ZAPISYWANIE..." : editingId ? "Zapisz" : "Dodaj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UnsavedChangesDialog
        open={unsavedOpen}
        onOpenChange={setUnsavedOpen}
        onDiscard={() => {
          clearFormDraft(garageDraftKey);
          closeFormClean();
        }}
        onSaveDraft={handleSaveDraft}
      />

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display" style={{ fontWeight: 800 }}>
              Usuń auto
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--race-muted)]">
              Czy na pewno chcesz usunąć auto
              {deleteTarget ? ` ${deleteTarget.make} ${deleteTarget.model}` : ""}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              className="border-[var(--race-border)] text-[var(--race-fg)] bg-transparent hover:bg-[var(--race-hover)]"
            >
              Anuluj
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              className="bg-red-700 text-white hover:bg-red-600"
            >
              {deleting ? "Usuwanie..." : "Usuń"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
