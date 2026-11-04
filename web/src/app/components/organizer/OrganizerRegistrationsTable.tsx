/**
 * Tabela zgłoszeń w workspace wydarzenia:
 * zakładki statusów, widoczność kolumn, sort, filtry, bulk, CSV (widoczne kolumny + filtr).
 */
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Download,
  Search,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { downloadCsv } from "../../lib/downloadCsv";
import type { Registration, RegistrationStatus } from "../../lib/types";
import type { OrganizerEvent } from "./organizerEventForm";
import { toast } from "sonner";

type StatusTab = "PENDING" | "ACCEPTED" | "CONFIRMED" | "CANCELED";
type ColId =
  | "username"
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "pzmLicense"
  | "licenseB"
  | "make"
  | "model"
  | "year"
  | "engineCc"
  | "driveType"
  | "powerHp"
  | "weightKg"
  | "className"
  | "cage"
  | "registered"
  | "oc"
  | "pt"
  | "paymentDue"
  | "paymentProof"
  | "comment";

const DEFAULT_COLS: ColId[] = [
  "username",
  "email",
  "make",
  "model",
  "className",
  "paymentDue",
  "paymentProof",
];

const ALL_COLS: ColId[] = [
  "username",
  "firstName",
  "lastName",
  "email",
  "phone",
  "pzmLicense",
  "licenseB",
  "make",
  "model",
  "year",
  "engineCc",
  "driveType",
  "powerHp",
  "weightKg",
  "className",
  "cage",
  "registered",
  "oc",
  "pt",
  "paymentDue",
  "paymentProof",
  "comment",
];

const STORAGE_KEY = "raceportal_org_reg_cols";

function loadCols(): ColId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COLS;
    const parsed = JSON.parse(raw) as string[];
    const ok = parsed.filter((c): c is ColId => ALL_COLS.includes(c as ColId));
    return ok.length > 0 ? ok : DEFAULT_COLS;
  } catch {
    return DEFAULT_COLS;
  }
}

function cellValue(reg: Registration, col: ColId): string {
  const u = reg.user;
  const c = reg.car;
  switch (col) {
    case "username":
      return u?.username ?? "";
    case "firstName":
      return u?.firstName ?? "";
    case "lastName":
      return u?.lastName ?? "";
    case "email":
      return u?.email ?? "";
    case "phone":
      return u?.phone ?? "";
    case "pzmLicense":
      return u?.pzmLicense ?? "";
    case "licenseB":
      return u?.hasDrivingLicenseB ? "tak" : "nie";
    case "make":
      return c?.make ?? "";
    case "model":
      return c?.model ?? "";
    case "year":
      return c?.year != null ? String(c.year) : "";
    case "engineCc":
      return c?.engineCc != null ? String(c.engineCc) : "";
    case "driveType":
      return c?.driveType ?? "";
    case "powerHp":
      return c?.powerHp != null ? String(c.powerHp) : "";
    case "weightKg":
      return c?.weightKg != null ? String(c.weightKg) : "";
    case "className":
      return c?.className ?? "";
    case "cage":
      return c?.hasRollCage ? "tak" : "nie";
    case "registered":
      return c?.registered ? "tak" : "nie";
    case "oc":
      return c?.hasOc ? "tak" : "nie";
    case "pt":
      return c?.hasPt ? "tak" : "nie";
    case "paymentDue":
      return reg.paymentDueAt ?? "";
    case "paymentProof":
      return reg.paymentProofUrl ? "tak" : "nie";
    case "comment":
      return reg.organizerComment ?? "";
    default:
      return "";
  }
}

function paymentCountdown(iso: string | null | undefined, locale: string): string {
  if (!iso) return "—";
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return "—";
  const diff = due.getTime() - Date.now();
  if (diff <= 0) return locale.startsWith("en") ? "Overdue" : "Po terminie";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return locale.startsWith("en") ? `${d}d ${h % 24}h` : `${d} dn. ${h % 24} godz.`;
  }
  return locale.startsWith("en") ? `${h}h ${m}m` : `${h} godz. ${m} min`;
}

interface Props {
  registrations: Registration[];
  selectedEvent: OrganizerEvent;
  comments: Record<string, string>;
  setComments: Dispatch<SetStateAction<Record<string, string>>>;
  onUpdateStatus: (id: string, status: RegistrationStatus) => Promise<void> | void;
  onBulkUpdateStatus: (ids: string[], status: RegistrationStatus) => Promise<void> | void;
  onOpenDetail: (reg: Registration) => void;
}

export function OrganizerRegistrationsTable({
  registrations,
  selectedEvent,
  comments,
  setComments,
  onUpdateStatus,
  onBulkUpdateStatus,
  onOpenDetail,
}: Props) {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<StatusTab>("PENDING");
  const [visibleCols, setVisibleCols] = useState<ColId[]>(loadCols);
  const [colsOpen, setColsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [onlyWithProof, setOnlyWithProof] = useState(false);
  const [sortCol, setSortCol] = useState<ColId | "status">("username");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const classOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of registrations) {
      const c = r.car?.className?.trim();
      if (c) set.add(c);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [registrations]);

  const tabCounts = useMemo(() => {
    const c = { PENDING: 0, ACCEPTED: 0, CONFIRMED: 0, CANCELED: 0 };
    for (const r of registrations) {
      if (r.status in c) c[r.status as StatusTab] += 1;
    }
    return c;
  }, [registrations]);

  const filtered = useMemo(() => {
    let list = registrations.filter((r) => r.status === tab);
    if (classFilter !== "all") {
      list = list.filter((r) => (r.car?.className ?? "") === classFilter);
    }
    if (onlyWithProof && tab === "ACCEPTED") {
      list = list.filter((r) => Boolean(r.paymentProofUrl));
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const hay = [
          r.user?.username,
          r.user?.firstName,
          r.user?.lastName,
          r.user?.email,
          r.car?.make,
          r.car?.model,
          r.car?.className,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    const dir = sortDir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      const av = sortCol === "status" ? a.status : cellValue(a, sortCol);
      const bv = sortCol === "status" ? b.status : cellValue(b, sortCol);
      return av.localeCompare(bv, undefined, { numeric: true }) * dir;
    });
  }, [registrations, tab, classFilter, onlyWithProof, query, sortCol, sortDir]);

  const toggleCol = (col: ColId) => {
    setVisibleCols((prev) => {
      const next = prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col];
      const ordered = ALL_COLS.filter((c) => next.includes(c));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ordered));
      return ordered.length > 0 ? ordered : DEFAULT_COLS;
    });
  };

  const toggleSort = (col: ColId) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const allSelected =
    filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        for (const r of filtered) next.delete(r.id);
      } else {
        for (const r of filtered) next.add(r.id);
      }
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const acceptTarget = (selectedEvent.paid ? "ACCEPTED" : "CONFIRMED") as RegistrationStatus;

  const runBulk = async (status: RegistrationStatus) => {
    const ids = filtered.filter((r) => selected.has(r.id)).map((r) => r.id);
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      await onBulkUpdateStatus(ids, status);
      setSelected(new Set());
    } finally {
      setBulkBusy(false);
    }
  };

  const exportCsv = () => {
    const headers = [
      "status",
      ...visibleCols.map((c) => t(`organizer.col.${c}`)),
    ];
    const rows = filtered.map((r) => [
      r.status,
      ...visibleCols.map((c) => {
        if (c === "paymentDue") return paymentCountdown(r.paymentDueAt, i18n.language);
        if (c === "paymentProof") return r.paymentProofUrl ?? "";
        return cellValue(r, c);
      }),
    ]);
    downloadCsv("org", `zgloszenia-${selectedEvent.id.slice(0, 8)}`, headers, rows);
    toast.success(t("organizer.wsCsvOk", { count: filtered.length }));
  };

  const colLabel = (col: ColId) => t(`organizer.col.${col}`);

  const rowTone = (reg: Registration) => {
    if (tab !== "ACCEPTED") return "";
    return reg.paymentProofUrl
      ? "bg-green-950/25 border-l-2 border-l-green-500"
      : "bg-amber-950/25 border-l-2 border-l-amber-500";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["PENDING", "ACCEPTED", "CONFIRMED", "CANCELED"] as const).map((s) => (
          <Button
            key={s}
            type="button"
            size="sm"
            variant={tab === s ? "default" : "outline"}
            onClick={() => {
              setTab(s);
              setSelected(new Set());
              setOnlyWithProof(false);
            }}
            className={
              tab === s
                ? "bg-[var(--race-accent)] text-[var(--race-on-accent)]"
                : "border-[var(--race-border)] text-[var(--race-fg)]"
            }
            style={{ fontWeight: 700 }}
          >
            {t(`organizer.wsStatus.${s}`)} ({tabCounts[s]})
          </Button>
        ))}
      </div>

      <div className="rounded-lg border border-[var(--race-border)] bg-[var(--race-card)] p-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-[var(--race-fg)]" style={{ fontWeight: 700 }}>
            {t("organizer.wsColumns")}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-[var(--race-border)]"
            onClick={() => setColsOpen((v) => !v)}
          >
            {colsOpen ? t("organizer.wsHideColumns") : t("organizer.wsShowColumns")}
          </Button>
        </div>
        {colsOpen && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {ALL_COLS.map((col) => (
              <label key={col} className="flex items-center gap-2 text-sm text-[var(--race-fg)] cursor-pointer">
                <Checkbox
                  checked={visibleCols.includes(col)}
                  onCheckedChange={() => toggleCol(col)}
                />
                {colLabel(col)}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--race-muted)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("organizer.wsSearchRegs")}
            className="pl-9 bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
          />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[200px] bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]">
            <SelectValue placeholder={t("organizer.wsClassFilter")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("organizer.wsAllClasses")}</SelectItem>
            {classOptions.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {tab === "ACCEPTED" && (
          <label className="flex items-center gap-2 text-sm text-[var(--race-fg)] cursor-pointer">
            <Checkbox checked={onlyWithProof} onCheckedChange={(v) => setOnlyWithProof(v === true)} />
            {t("organizer.wsOnlyProof")}
          </label>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={exportCsv}
          className="border-[var(--race-accent)] text-[var(--race-accent)]"
          style={{ fontWeight: 700 }}
        >
          <Download className="w-4 h-4 mr-1.5" />
          {t("organizer.wsExportCsv")}
        </Button>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-[var(--race-border)] bg-[var(--race-card)] px-3 py-2">
          <span className="text-sm text-[var(--race-muted)]">
            {t("organizer.wsSelected", { count: selected.size })}
          </span>
          {tab === "PENDING" && (
            <>
              <Button
                type="button"
                size="sm"
                disabled={bulkBusy}
                onClick={() => void runBulk(acceptTarget)}
                className="bg-green-700 hover:bg-green-600"
              >
                <Check className="w-4 h-4 mr-1" />
                {selectedEvent.paid ? t("organizer.acceptReg") : t("common.confirm")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={bulkBusy}
                onClick={() => void runBulk("CANCELED")}
                className="border-red-800 text-red-400"
              >
                <X className="w-4 h-4 mr-1" />
                {t("organizer.rejectReg")}
              </Button>
            </>
          )}
          {tab === "ACCEPTED" && (
            <>
              <Button
                type="button"
                size="sm"
                disabled={bulkBusy}
                onClick={() => void runBulk("CONFIRMED")}
                className="bg-green-700 hover:bg-green-600"
              >
                {t("registration.confirmPayment")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={bulkBusy}
                onClick={() => void runBulk("CANCELED")}
                className="border-red-800 text-red-400"
              >
                {t("organizer.rejectReg")}
              </Button>
            </>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-[var(--race-muted)] text-center py-10">{t("registration.noEntries")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--race-border)]">
          <table className="w-full text-sm text-left min-w-[640px]">
            <thead className="bg-[var(--race-card)] text-[var(--race-muted)] border-b border-[var(--race-border)]">
              <tr>
                <th className="p-2 w-10">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label={t("organizer.wsSelectAll")} />
                </th>
                {visibleCols.map((col) => (
                  <th key={col} className="p-2 whitespace-nowrap">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-[var(--race-accent)]"
                      onClick={() => toggleSort(col)}
                      style={{ fontWeight: 700 }}
                    >
                      {colLabel(col)}
                      {sortCol === col &&
                        (sortDir === "asc" ? (
                          <ArrowUp className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5" />
                        ))}
                    </button>
                  </th>
                ))}
                <th className="p-2 whitespace-nowrap" style={{ fontWeight: 700 }}>
                  {t("organizer.wsActions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((reg) => (
                <tr
                  key={reg.id}
                  className={`border-b border-[var(--race-border)] hover:bg-[var(--race-hover)] cursor-pointer ${rowTone(reg)}`}
                  onClick={() => onOpenDetail(reg)}
                >
                  <td className="p-2" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selected.has(reg.id)}
                      onCheckedChange={() => toggleOne(reg.id)}
                    />
                  </td>
                  {visibleCols.map((col) => (
                    <td key={col} className="p-2 text-[var(--race-fg)] max-w-[180px] truncate">
                      {col === "paymentDue" ? (
                        paymentCountdown(reg.paymentDueAt, i18n.language)
                      ) : col === "paymentProof" ? (
                        reg.paymentProofUrl ? (
                          <a
                            href={reg.paymentProofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[var(--race-accent)] underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {t("organizer.transferProof")}
                          </a>
                        ) : (
                          "—"
                        )
                      ) : (
                        cellValue(reg, col) || "—"
                      )}
                    </td>
                  ))}
                  <td className="p-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                      {(tab === "PENDING" || tab === "ACCEPTED") && (
                        <Input
                          placeholder={t("registration.commentOptional")}
                          value={comments[reg.id] || ""}
                          onChange={(e) =>
                            setComments((prev) => ({ ...prev, [reg.id]: e.target.value }))
                          }
                          className="h-8 bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
                        />
                      )}
                      {reg.status === "PENDING" && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            className="h-8 bg-green-700 hover:bg-green-600 flex-1"
                            onClick={() => void onUpdateStatus(reg.id, acceptTarget)}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-red-800 text-red-400"
                            onClick={() => void onUpdateStatus(reg.id, "CANCELED")}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                      {reg.status === "ACCEPTED" && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            disabled={!reg.paymentProofUrl}
                            className="h-8 bg-green-700 hover:bg-green-600 flex-1 disabled:opacity-40"
                            onClick={() => void onUpdateStatus(reg.id, "CONFIRMED")}
                          >
                            {t("registration.confirmPayment")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-red-800 text-red-400"
                            onClick={() => void onUpdateStatus(reg.id, "CANCELED")}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                      {(reg.status === "CONFIRMED" || reg.status === "CANCELED") && (
                        <Badge className="bg-[var(--race-muted-bg)] text-[var(--race-fg)] w-fit">
                          {t(`registration.${reg.status}`)}
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
