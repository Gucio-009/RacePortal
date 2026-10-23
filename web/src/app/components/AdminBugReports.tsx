/**
 * Lista zgłoszeń błędów w panelu admina — status, usuwanie, eksport CSV.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Loader2, Trash2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { api, ApiError } from "../lib/api";
import { toast } from "sonner";

type BugStatus = "OPEN" | "DONE";
type Filter = "ALL" | BugStatus;

interface BugReport {
  id: string;
  message: string;
  pageUrl: string | null;
  createdAt: string;
  username: string | null;
  accountEmail: string | null;
  contactEmail: string | null;
  status: BugStatus;
}

function who(report: BugReport) {
  if (report.username) {
    return `${report.username} (${report.accountEmail ?? ""})`;
  }
  if (report.contactEmail) {
    return report.contactEmail;
  }
  return "Gość";
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadCsv(reports: BugReport[]) {
  const header = ["id", "status", "createdAt", "who", "accountEmail", "contactEmail", "pageUrl", "message"];
  const rows = reports.map((r) =>
    [
      r.id,
      r.status,
      r.createdAt,
      who(r),
      r.accountEmail ?? "",
      r.contactEmail ?? "",
      r.pageUrl ?? "",
      r.message,
    ]
      .map((cell) => csvEscape(String(cell)))
      .join(","),
  );
  const bom = "\uFEFF";
  const blob = new Blob([bom + [header.join(","), ...rows].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `raceportal-bug-reports-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminBugReports() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("OPEN");
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(() => {
    return api
      .get<BugReport[]>("/api/bug-reports")
      .then((data) =>
        setReports(
          data.map((r) => ({
            ...r,
            status: r.status === "DONE" ? "DONE" : "OPEN",
          })),
        ),
      );
  }, []);

  useEffect(() => {
    let cancelled = false;
    reload()
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "Nie udało się pobrać zgłoszeń.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const visible = useMemo(() => {
    if (filter === "ALL") return reports;
    return reports.filter((r) => r.status === filter);
  }, [reports, filter]);

  const setStatus = async (id: string, status: BugStatus) => {
    setBusyId(id);
    try {
      const updated = await api.patch<BugReport>(`/api/bug-reports/${id}/status`, { status });
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated, status } : r)));
      toast.success(status === "DONE" ? "Oznaczone jako zrobione" : "Przywrócone jako otwarte");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Nie udało się zmienić statusu");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Usunąć to zgłoszenie na stałe?")) return;
    setBusyId(id);
    try {
      await api.delete(`/api/bug-reports/${id}`);
      setReports((prev) => prev.filter((r) => r.id !== id));
      toast.success("Zgłoszenie usunięte");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Nie udało się usunąć");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <p className="text-[var(--race-muted)] text-center py-8">Ładowanie zgłoszeń…</p>;
  }

  const openCount = reports.filter((r) => r.status === "OPEN").length;
  const doneCount = reports.filter((r) => r.status === "DONE").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["OPEN", `Otwarte (${openCount})`],
              ["DONE", `Zrobione (${doneCount})`],
              ["ALL", `Wszystkie (${reports.length})`],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              size="sm"
              variant={filter === value ? "default" : "outline"}
              className={
                filter === value
                  ? "bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95"
                  : "border-[var(--race-border)] text-[var(--race-fg)] hover:bg-[var(--race-hover)]"
              }
              onClick={() => setFilter(value)}
            >
              {label}
            </Button>
          ))}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-[var(--race-border)] text-[var(--race-fg)] hover:bg-[var(--race-hover)]"
          disabled={visible.length === 0}
          onClick={() => {
            downloadCsv(visible);
            toast.success(`Wyeksportowano ${visible.length} zgłoszeń do CSV`);
          }}
        >
          <Download className="w-4 h-4 mr-2" />
          Eksport CSV
        </Button>
      </div>

      {visible.length === 0 ? (
        <p className="text-[var(--race-muted)] text-center py-8">
          {reports.length === 0 ? "Brak zgłoszonych błędów." : "Brak zgłoszeń w tym filtrze."}
        </p>
      ) : (
        visible.map((report) => {
          const busy = busyId === report.id;
          const done = report.status === "DONE";
          return (
            <Card
              key={report.id}
              className={`bg-[var(--race-card)] border-[var(--race-border)] ${done ? "opacity-80" : ""}`}
            >
              <CardContent className="p-6 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm text-[var(--race-muted)]">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={
                        done
                          ? "bg-green-800/40 text-green-300 border border-green-800"
                          : "bg-[var(--race-accent)] text-[var(--race-on-accent)]"
                      }
                    >
                      {done ? "Zrobione" : "Otwarte"}
                    </Badge>
                    <span>{who(report)}</span>
                  </div>
                  <time dateTime={report.createdAt}>
                    {new Date(report.createdAt).toLocaleString("pl-PL")}
                  </time>
                </div>
                {report.pageUrl && (
                  <p className="text-xs text-[var(--race-accent)] break-all">{report.pageUrl}</p>
                )}
                <p className={`text-[var(--race-fg)] whitespace-pre-wrap ${done ? "line-through decoration-[#9ca3af]/60" : ""}`}>
                  {report.message}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {done ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      className="border-[var(--race-border)] text-[var(--race-fg)] hover:bg-[var(--race-hover)]"
                      onClick={() => setStatus(report.id, "OPEN")}
                    >
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Przywróć jako otwarte"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={busy}
                      className="bg-green-700 hover:bg-green-600 text-[var(--race-fg)]"
                      onClick={() => setStatus(report.id, "DONE")}
                    >
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Oznacz jako zrobione"}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    className="border-red-900/60 text-[#ff8a8a] hover:bg-red-950/40"
                    onClick={() => remove(report.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Usuń
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
