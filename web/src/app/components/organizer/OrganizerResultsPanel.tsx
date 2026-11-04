/**
 * Moduł wyników: tabela czasów/punktów, statusy DNF/DNS/DSQ, tabela punktowa, publikacja.
 */
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import type { EventResult, PointsRule } from "../../lib/types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const STATUSES = ["OK", "DNF", "DNS", "DSQ"] as const;

interface Props {
  eventId: string;
  resultsPublished?: boolean;
  onPublishedChange?: (published: boolean) => void;
}

export function OrganizerResultsPanel({ eventId, resultsPublished, onPublishedChange }: Props) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<EventResult[]>([]);
  const [rules, setRules] = useState<PointsRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [published, setPublished] = useState(!!resultsPublished);
  const [draftRules, setDraftRules] = useState<{ place: string; points: string }[]>([
    { place: "1", points: "25" },
    { place: "2", points: "18" },
    { place: "3", points: "15" },
  ]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, pts] = await Promise.all([
        api.get<EventResult[]>(`/api/events/${eventId}/results`),
        api.get<PointsRule[]>(`/api/events/${eventId}/results/points-rules`),
      ]);
      setRows(res);
      setRules(pts);
      if (pts.length > 0) {
        setDraftRules(pts.map((r) => ({ place: String(r.place), points: String(r.points) })));
      }
    } catch {
      toast.error(t("organizer.resLoadFail"));
    } finally {
      setLoading(false);
    }
  }, [eventId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPublished(!!resultsPublished);
  }, [resultsPublished]);

  const ensure = async () => {
    setBusy(true);
    try {
      const res = await api.post<EventResult[]>(`/api/events/${eventId}/results/ensure`);
      setRows(res);
      toast.success(t("organizer.resEnsureOk"));
    } catch {
      toast.error(t("organizer.resEnsureFail"));
    } finally {
      setBusy(false);
    }
  };

  const saveRow = async (row: EventResult) => {
    try {
      const updated = await api.put<EventResult>(`/api/events/${eventId}/results`, {
        registrationId: row.registrationId,
        startNumber: row.startNumber,
        position: row.position,
        timeDisplay: row.timeDisplay,
        points: row.points,
        status: row.status,
        note: row.note,
      });
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(t("organizer.resSaved"));
    } catch {
      toast.error(t("organizer.resSaveFail"));
    }
  };

  const patchLocal = (id: string, patch: Partial<EventResult>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const recalc = async () => {
    setBusy(true);
    try {
      await api.post(`/api/events/${eventId}/results/recalc`);
      await load();
      toast.success(t("organizer.resRecalcOk"));
    } catch {
      toast.error(t("organizer.resRecalcFail"));
    } finally {
      setBusy(false);
    }
  };

  const saveRules = async () => {
    setBusy(true);
    try {
      const payload = {
        rules: draftRules
          .map((r) => ({ place: Number(r.place), points: Number(r.points) }))
          .filter((r) => Number.isFinite(r.place) && r.place >= 1 && Number.isFinite(r.points)),
      };
      const saved = await api.put<PointsRule[]>(`/api/events/${eventId}/results/points-rules`, payload);
      setRules(saved);
      toast.success(t("organizer.resRulesOk"));
    } catch {
      toast.error(t("organizer.resRulesFail"));
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async () => {
    const next = !published;
    setBusy(true);
    try {
      await api.post(`/api/events/${eventId}/results/publish`, { published: next });
      setPublished(next);
      onPublishedChange?.(next);
      toast.success(next ? t("organizer.resPublished") : t("organizer.resUnpublished"));
    } catch {
      toast.error(t("organizer.resPublishFail"));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-[var(--race-muted)] flex items-center gap-2 py-8 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t("common.loading")}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[var(--race-fg)]" style={{ fontWeight: 700 }}>
            {t("organizer.resTitle")}
          </p>
          <p className="text-sm text-[var(--race-muted)]">{t("organizer.resHint")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-[var(--race-border)]"
            disabled={busy}
            onClick={() => void ensure()}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {t("organizer.resEnsure")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-[var(--race-border)]"
            disabled={busy}
            onClick={() => void recalc()}
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            {t("organizer.resRecalc")}
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() => void togglePublish()}
            className={
              published
                ? "border border-[var(--race-border)] bg-transparent text-[var(--race-fg)]"
                : "bg-[var(--race-accent)] text-[var(--race-on-accent)]"
            }
          >
            {published ? t("organizer.resUnpublish") : t("organizer.resPublish")}
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-[var(--race-muted)] text-center py-8">{t("organizer.resEmpty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--race-border)]">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-[var(--race-card)] text-[var(--race-muted)] border-b border-[var(--race-border)]">
              <tr>
                <th className="p-2 text-left">{t("organizer.resCol.pos")}</th>
                <th className="p-2 text-left">{t("organizer.resCol.start")}</th>
                <th className="p-2 text-left">{t("organizer.resCol.driver")}</th>
                <th className="p-2 text-left">{t("organizer.resCol.car")}</th>
                <th className="p-2 text-left">{t("organizer.resCol.class")}</th>
                <th className="p-2 text-left">{t("organizer.resCol.time")}</th>
                <th className="p-2 text-left">{t("organizer.resCol.points")}</th>
                <th className="p-2 text-left">{t("organizer.resCol.status")}</th>
                <th className="p-2 text-left">{t("organizer.resCol.note")}</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--race-border)]">
                  <td className="p-1.5">
                    <Input
                      value={row.position ?? ""}
                      onChange={(e) =>
                        patchLocal(row.id, {
                          position: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="h-8 w-16 bg-[var(--race-bg)] border-[var(--race-border)]"
                    />
                  </td>
                  <td className="p-1.5">
                    <Input
                      value={row.startNumber ?? ""}
                      onChange={(e) =>
                        patchLocal(row.id, {
                          startNumber: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="h-8 w-16 bg-[var(--race-bg)] border-[var(--race-border)]"
                    />
                  </td>
                  <td className="p-2 text-[var(--race-fg)] whitespace-nowrap">{row.driverName}</td>
                  <td className="p-2 text-[var(--race-muted)] whitespace-nowrap">{row.carLabel || "—"}</td>
                  <td className="p-2 text-[var(--race-muted)] whitespace-nowrap">{row.className || "—"}</td>
                  <td className="p-1.5">
                    <Input
                      value={row.timeDisplay ?? ""}
                      placeholder="1:23.456"
                      onChange={(e) => patchLocal(row.id, { timeDisplay: e.target.value })}
                      className="h-8 w-28 bg-[var(--race-bg)] border-[var(--race-border)]"
                    />
                  </td>
                  <td className="p-1.5">
                    <Input
                      value={row.points ?? ""}
                      onChange={(e) =>
                        patchLocal(row.id, {
                          points: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="h-8 w-16 bg-[var(--race-bg)] border-[var(--race-border)]"
                    />
                  </td>
                  <td className="p-1.5">
                    <Select
                      value={row.status}
                      onValueChange={(v) => patchLocal(row.id, { status: v as EventResult["status"] })}
                    >
                      <SelectTrigger className="h-8 w-24 bg-[var(--race-bg)] border-[var(--race-border)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-1.5">
                    <Input
                      value={row.note ?? ""}
                      onChange={(e) => patchLocal(row.id, { note: e.target.value })}
                      className="h-8 min-w-[120px] bg-[var(--race-bg)] border-[var(--race-border)]"
                    />
                  </td>
                  <td className="p-1.5">
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 bg-[var(--race-accent)] text-[var(--race-on-accent)]"
                      onClick={() => void saveRow(row)}
                    >
                      {t("common.save")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-lg border border-[var(--race-border)] bg-[var(--race-card)] p-4 space-y-3">
        <p className="text-[var(--race-fg)]" style={{ fontWeight: 700 }}>
          {t("organizer.resPointsTitle")}
        </p>
        <p className="text-sm text-[var(--race-muted)]">{t("organizer.resPointsHint")}</p>
        <div className="space-y-2">
          {draftRules.map((r, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-2">
              <Input
                value={r.place}
                onChange={(e) =>
                  setDraftRules((prev) =>
                    prev.map((x, i) =>
                      i === idx ? { ...x, place: e.target.value.replace(/\D/g, "") } : x,
                    ),
                  )
                }
                placeholder={t("organizer.resPlace")}
                className="w-20 bg-transparent border-[var(--race-border)]"
              />
              <span className="text-[var(--race-muted)]">→</span>
              <Input
                value={r.points}
                onChange={(e) =>
                  setDraftRules((prev) =>
                    prev.map((x, i) =>
                      i === idx ? { ...x, points: e.target.value.replace(/\D/g, "") } : x,
                    ),
                  )
                }
                placeholder={t("organizer.resPoints")}
                className="w-24 bg-transparent border-[var(--race-border)]"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-red-900 text-red-400"
                onClick={() => setDraftRules((prev) => prev.filter((_, i) => i !== idx))}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-[var(--race-border)]"
            onClick={() =>
              setDraftRules((prev) => [
                ...prev,
                { place: String(prev.length + 1), points: "0" },
              ])
            }
          >
            <Plus className="w-4 h-4 mr-1" />
            {t("organizer.resAddRule")}
          </Button>
          <Button
            type="button"
            disabled={busy}
            className="bg-[var(--race-accent)] text-[var(--race-on-accent)]"
            onClick={() => void saveRules()}
          >
            {t("organizer.resSaveRules")}
          </Button>
          {rules.length > 0 && (
            <span className="text-xs text-[var(--race-muted)] self-center">
              {t("organizer.resRulesCount", { count: rules.length })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
