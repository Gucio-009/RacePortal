/**
 * Konfigurator klas zawodów + auto-przydział w zakładce Ustawienia.
 */
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import type { EventClass } from "../../lib/types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";

const DRIVES = ["FWD", "RWD", "AWD"] as const;
const TIRES = ["road", "semislick", "slick", "gravel", "rain", "studded"] as const;

type Draft = {
  name: string;
  sortOrder: string;
  useCapacity: boolean;
  minEngineCc: string;
  maxEngineCc: string;
  useTurbo: boolean;
  turboMultiplier: string;
  useSc: boolean;
  superchargerMultiplier: string;
  useDrive: boolean;
  drives: string[];
  requireCage: boolean;
  requireRegistered: boolean;
  useTires: boolean;
  tires: string[];
  useHpT: boolean;
  maxHpPerTonne: string;
};

const emptyDraft = (): Draft => ({
  name: "",
  sortOrder: "0",
  useCapacity: false,
  minEngineCc: "",
  maxEngineCc: "",
  useTurbo: false,
  turboMultiplier: "1.7",
  useSc: false,
  superchargerMultiplier: "1.5",
  useDrive: false,
  drives: [],
  requireCage: false,
  requireRegistered: false,
  useTires: false,
  tires: [],
  useHpT: false,
  maxHpPerTonne: "",
});

function classToDraft(c: EventClass): Draft {
  return {
    name: c.name,
    sortOrder: String(c.sortOrder ?? 0),
    useCapacity: c.minEngineCc != null || c.maxEngineCc != null,
    minEngineCc: c.minEngineCc != null ? String(c.minEngineCc) : "",
    maxEngineCc: c.maxEngineCc != null ? String(c.maxEngineCc) : "",
    useTurbo: c.turboMultiplier != null,
    turboMultiplier: c.turboMultiplier != null ? String(c.turboMultiplier) : "1.7",
    useSc: c.superchargerMultiplier != null,
    superchargerMultiplier:
      c.superchargerMultiplier != null ? String(c.superchargerMultiplier) : "1.5",
    useDrive: !!c.allowedDriveTypes,
    drives: (c.allowedDriveTypes ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    requireCage: !!c.requireCage,
    requireRegistered: !!c.requireRegistered,
    useTires: !!c.allowedTireTypes,
    tires: (c.allowedTireTypes ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
    useHpT: c.maxHpPerTonne != null,
    maxHpPerTonne: c.maxHpPerTonne != null ? String(c.maxHpPerTonne) : "",
  };
}

function draftToPayload(d: Draft) {
  const num = (raw: string) => {
    const t = raw.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  };
  return {
    name: d.name.trim(),
    sortOrder: num(d.sortOrder) ?? 0,
    minEngineCc: d.useCapacity ? num(d.minEngineCc) : null,
    maxEngineCc: d.useCapacity ? num(d.maxEngineCc) : null,
    turboMultiplier: d.useTurbo ? num(d.turboMultiplier) : null,
    superchargerMultiplier: d.useSc ? num(d.superchargerMultiplier) : null,
    allowedDriveTypes: d.useDrive && d.drives.length ? d.drives.join(",") : null,
    requireCage: d.requireCage ? true : null,
    requireRegistered: d.requireRegistered ? true : null,
    allowedTireTypes: d.useTires && d.tires.length ? d.tires.join(",") : null,
    maxHpPerTonne: d.useHpT ? num(d.maxHpPerTonne) : null,
  };
}

interface Props {
  eventId: string;
  onChanged?: () => void;
}

export function OrganizerClassConfig({ eventId, onChanged }: Props) {
  const { t } = useTranslation();
  const [classes, setClasses] = useState<EventClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoBusy, setAutoBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<EventClass[]>(`/api/events/${eventId}/classes`)
      .then(setClasses)
      .catch(() => toast.error(t("organizer.clsLoadFail")))
      .finally(() => setLoading(false));
  }, [eventId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const startCreate = () => {
    setEditingId(null);
    setDraft({ ...emptyDraft(), sortOrder: String(classes.length) });
    setShowForm(true);
  };

  const startEdit = (c: EventClass) => {
    setEditingId(c.id);
    setDraft(classToDraft(c));
    setShowForm(true);
  };

  const closeForm = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setShowForm(false);
  };

  const save = async () => {
    if (!draft.name.trim()) {
      toast.error(t("organizer.clsNameRequired"));
      return;
    }
    setSaving(true);
    try {
      const body = draftToPayload(draft);
      if (editingId) {
        await api.put(`/api/events/${eventId}/classes/${editingId}`, body);
        toast.success(t("organizer.clsUpdated"));
      } else {
        await api.post(`/api/events/${eventId}/classes`, body);
        toast.success(t("organizer.clsCreated"));
      }
      closeForm();
      load();
      onChanged?.();
    } catch {
      toast.error(t("organizer.clsSaveFail"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/api/events/${eventId}/classes/${id}`);
      toast.success(t("organizer.clsDeleted"));
      if (editingId === id) closeForm();
      load();
      onChanged?.();
    } catch {
      toast.error(t("organizer.clsDeleteFail"));
    }
  };

  const autoAssign = async () => {
    setAutoBusy(true);
    try {
      const res = await api.post<{ total: number; assigned: number; unassigned: number }>(
        `/api/events/${eventId}/classes/auto-assign`,
      );
      toast.success(
        t("organizer.clsAutoDone", {
          assigned: res.assigned,
          total: res.total,
          unassigned: res.unassigned,
        }),
      );
      onChanged?.();
    } catch {
      toast.error(t("organizer.clsAutoFail"));
    } finally {
      setAutoBusy(false);
    }
  };

  const toggleList = (key: "drives" | "tires", value: string) => {
    setDraft((d) => {
      const cur = d[key];
      const next = cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value];
      return { ...d, [key]: next };
    });
  };

  if (loading) {
    return (
      <p className="text-sm text-[var(--race-muted)] flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t("common.loading")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[var(--race-fg)]" style={{ fontWeight: 700 }}>
            {t("organizer.clsTitle")}
          </p>
          <p className="text-sm text-[var(--race-muted)]">{t("organizer.clsHint")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-[var(--race-border)]"
            onClick={autoAssign}
            disabled={autoBusy || classes.length === 0}
          >
            {autoBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {t("organizer.clsAutoAssign")}
          </Button>
          <Button
            type="button"
            onClick={startCreate}
            className="bg-[var(--race-accent)] text-[var(--race-on-accent)]"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {t("organizer.clsAdd")}
          </Button>
        </div>
      </div>

      {classes.length === 0 ? (
        <p className="text-sm text-[var(--race-muted)]">{t("organizer.clsEmpty")}</p>
      ) : (
        <ul className="space-y-2">
          {classes.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--race-border)] bg-[var(--race-card)] px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-[var(--race-fg)]" style={{ fontWeight: 700 }}>
                  #{c.sortOrder} {c.name}
                </p>
                <p className="text-xs text-[var(--race-muted)] truncate">
                  {[
                    c.minEngineCc != null || c.maxEngineCc != null
                      ? `${c.minEngineCc ?? "…"}–${c.maxEngineCc ?? "…"} cm³`
                      : null,
                    c.turboMultiplier != null ? `turbo×${c.turboMultiplier}` : null,
                    c.superchargerMultiplier != null ? `sc×${c.superchargerMultiplier}` : null,
                    c.allowedDriveTypes,
                    c.requireCage ? t("organizer.clsCageShort") : null,
                    c.maxHpPerTonne != null ? `${c.maxHpPerTonne} KM/t` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || t("organizer.clsNoCriteria")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-[var(--race-border)]"
                  onClick={() => startEdit(c)}
                >
                  {t("common.edit")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-red-900 text-red-400"
                  onClick={() => remove(c.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <div className="rounded-lg border border-[var(--race-border)] bg-[var(--race-card)] p-4 space-y-3">
          <p className="text-[var(--race-fg)]" style={{ fontWeight: 700 }}>
            {editingId ? t("organizer.clsEditTitle") : t("organizer.clsCreateTitle")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t("organizer.clsName")}</Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                className="bg-transparent border-[var(--race-border)]"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("organizer.clsSort")}</Label>
              <Input
                value={draft.sortOrder}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, sortOrder: e.target.value.replace(/\D/g, "") }))
                }
                inputMode="numeric"
                className="bg-transparent border-[var(--race-border)]"
              />
            </div>
          </div>

          <Criterion
            checked={draft.useCapacity}
            onCheckedChange={(v) => setDraft((d) => ({ ...d, useCapacity: v }))}
            label={t("organizer.clsCapacity")}
          >
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="min"
                value={draft.minEngineCc}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, minEngineCc: e.target.value.replace(/\D/g, "") }))
                }
                className="bg-transparent border-[var(--race-border)]"
              />
              <Input
                placeholder="max"
                value={draft.maxEngineCc}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, maxEngineCc: e.target.value.replace(/\D/g, "") }))
                }
                className="bg-transparent border-[var(--race-border)]"
              />
            </div>
            <p className="text-xs text-[var(--race-muted)]">{t("organizer.clsCapacityHint")}</p>
          </Criterion>

          <Criterion
            checked={draft.useTurbo}
            onCheckedChange={(v) => setDraft((d) => ({ ...d, useTurbo: v }))}
            label={t("organizer.clsTurbo")}
          >
            <Input
              value={draft.turboMultiplier}
              onChange={(e) => setDraft((d) => ({ ...d, turboMultiplier: e.target.value }))}
              className="bg-transparent border-[var(--race-border)] max-w-[8rem]"
            />
          </Criterion>

          <Criterion
            checked={draft.useSc}
            onCheckedChange={(v) => setDraft((d) => ({ ...d, useSc: v }))}
            label={t("organizer.clsSc")}
          >
            <Input
              value={draft.superchargerMultiplier}
              onChange={(e) =>
                setDraft((d) => ({ ...d, superchargerMultiplier: e.target.value }))
              }
              className="bg-transparent border-[var(--race-border)] max-w-[8rem]"
            />
          </Criterion>

          <Criterion
            checked={draft.useDrive}
            onCheckedChange={(v) => setDraft((d) => ({ ...d, useDrive: v }))}
            label={t("organizer.clsDrive")}
          >
            <div className="flex flex-wrap gap-3">
              {DRIVES.map((d) => (
                <label key={d} className="inline-flex items-center gap-1.5 text-sm text-[var(--race-fg)]">
                  <Checkbox
                    checked={draft.drives.includes(d)}
                    onCheckedChange={() => toggleList("drives", d)}
                  />
                  {d}
                </label>
              ))}
            </div>
          </Criterion>

          <label className="inline-flex items-center gap-2 text-sm text-[var(--race-fg)]">
            <Checkbox
              checked={draft.requireCage}
              onCheckedChange={(v) => setDraft((d) => ({ ...d, requireCage: !!v }))}
            />
            {t("organizer.clsRequireCage")}
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-[var(--race-fg)]">
            <Checkbox
              checked={draft.requireRegistered}
              onCheckedChange={(v) => setDraft((d) => ({ ...d, requireRegistered: !!v }))}
            />
            {t("organizer.clsRequireRegistered")}
          </label>

          <Criterion
            checked={draft.useTires}
            onCheckedChange={(v) => setDraft((d) => ({ ...d, useTires: v }))}
            label={t("organizer.clsTires")}
          >
            <div className="flex flex-wrap gap-3">
              {TIRES.map((tire) => (
                <label
                  key={tire}
                  className="inline-flex items-center gap-1.5 text-sm text-[var(--race-fg)]"
                >
                  <Checkbox
                    checked={draft.tires.includes(tire)}
                    onCheckedChange={() => toggleList("tires", tire)}
                  />
                  {t(`garage.tire.${tire}`)}
                </label>
              ))}
            </div>
          </Criterion>

          <Criterion
            checked={draft.useHpT}
            onCheckedChange={(v) => setDraft((d) => ({ ...d, useHpT: v }))}
            label={t("organizer.clsHpT")}
          >
            <Input
              value={draft.maxHpPerTonne}
              onChange={(e) => setDraft((d) => ({ ...d, maxHpPerTonne: e.target.value }))}
              className="bg-transparent border-[var(--race-border)] max-w-[8rem]"
            />
          </Criterion>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              onClick={save}
              disabled={saving}
              className="bg-[var(--race-accent)] text-[var(--race-on-accent)]"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t("common.save")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-[var(--race-border)]"
              onClick={closeForm}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Criterion({
  checked,
  onCheckedChange,
  label,
  children,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-md border border-[var(--race-border)]/60 p-3">
      <label className="inline-flex items-center gap-2 text-sm text-[var(--race-fg)]" style={{ fontWeight: 600 }}>
        <Checkbox checked={checked} onCheckedChange={(v) => onCheckedChange(!!v)} />
        {label}
      </label>
      {checked ? <div className="space-y-1.5 pl-6">{children}</div> : null}
    </div>
  );
}
