import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { Download, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "../lib/api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { downloadBoCsv } from "./csv";
import { useBoQueue } from "./BoQueueContext";

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

function who(r: BugReport) {
  if (r.username) return `${r.username} (${r.accountEmail ?? ""})`;
  if (r.contactEmail) return r.contactEmail;
  return "Gość";
}

export function BoBugsPage() {
  const [params, setParams] = useSearchParams();
  const raw = (params.get("status") || "OPEN").toUpperCase();
  const filter: Filter = raw === "ALL" || raw === "DONE" || raw === "OPEN" ? (raw as Filter) : "OPEN";
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { revisions, refresh: refreshQueue } = useBoQueue();
  const bugsRevSeen = useRef(revisions.openBugs);

  const reload = useCallback((opts?: { silent?: boolean }) => {
    return api
      .get<BugReport[]>("/api/bug-reports")
      .then((data) =>
        setReports(data.map((r) => ({ ...r, status: r.status === "DONE" ? "DONE" : "OPEN" }))),
      )
      .catch((e) => {
        if (!opts?.silent) {
          toast.error(e instanceof ApiError ? e.message : "Nie udało się pobrać zgłoszeń");
        }
      });
  }, []);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

  useEffect(() => {
    if (revisions.openBugs === bugsRevSeen.current) return;
    bugsRevSeen.current = revisions.openBugs;
    void reload({ silent: true });
  }, [revisions.openBugs, reload]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return reports;
    return reports.filter((r) => r.status === filter);
  }, [reports, filter]);

  const setFilter = (f: Filter) => {
    const p = new URLSearchParams(params);
    p.set("status", f);
    setParams(p, { replace: true });
  };

  const markDone = async (id: string) => {
    setBusyId(id);
    try {
      await api.patch(`/api/bug-reports/${id}/status`, { status: "DONE" });
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: "DONE" } : r)));
      toast.success("Oznaczono jako załatwione");
      void refreshQueue();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Błąd aktualizacji");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Usunąć zgłoszenie?")) return;
    setBusyId(id);
    try {
      await api.delete(`/api/bug-reports/${id}`);
      setReports((prev) => prev.filter((r) => r.id !== id));
      toast.success("Usunięto");
      void refreshQueue();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Nie udało się usunąć");
    } finally {
      setBusyId(null);
    }
  };

  const exportCsv = () => {
    downloadBoCsv(
      "bledy",
      ["id", "status", "createdAt", "who", "accountEmail", "contactEmail", "pageUrl", "message"],
      filtered.map((r) => [
        r.id,
        r.status,
        r.createdAt,
        who(r),
        r.accountEmail,
        r.contactEmail,
        r.pageUrl,
        r.message,
      ]),
    );
    toast.success(`CSV: ${filtered.length} wierszy`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[var(--race-muted)]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--race-accent)] mr-2" />
        Ładowanie…
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl" style={{ fontWeight: 800 }}>
          Zgłoszenia błędów
        </h1>
        <Button
          type="button"
          variant="outline"
          onClick={exportCsv}
          className="border-[var(--race-accent)] text-[var(--race-accent)]"
          style={{ fontWeight: 700 }}
        >
          <Download className="w-4 h-4 mr-2" />
          Eksport CSV ({filtered.length})
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["OPEN", "DONE", "ALL"] as const).map((f) => (
          <Button
            key={f}
            type="button"
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
            className={
              filter === f
                ? "bg-[var(--race-accent)] text-[var(--race-on-accent)]"
                : "border-[var(--race-border)]"
            }
          >
            {f === "OPEN" ? "Otwarte" : f === "DONE" ? "Załatwione" : "Wszystkie"}
            {f === "OPEN" ? ` (${reports.filter((r) => r.status === "OPEN").length})` : ""}
          </Button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--race-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--race-card)] text-left text-[var(--race-muted)]">
            <tr>
              <th className="px-3 py-2.5 font-semibold">Status</th>
              <th className="px-3 py-2.5 font-semibold">Kto</th>
              <th className="px-3 py-2.5 font-semibold">Data</th>
              <th className="px-3 py-2.5 font-semibold">Strona</th>
              <th className="px-3 py-2.5 font-semibold">Treść</th>
              <th className="px-3 py-2.5 font-semibold">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-[var(--race-muted)]">
                  Brak zgłoszeń
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-t border-[var(--race-border)] hover:bg-[var(--race-hover)]/40">
                  <td className="px-3 py-3 align-top">
                    <Badge
                      variant="outline"
                      className={
                        r.status === "OPEN"
                          ? "border-[var(--race-accent)] text-[var(--race-accent)]"
                          : "border-green-700 text-green-400"
                      }
                    >
                      {r.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 align-top text-[var(--race-muted)]">{who(r)}</td>
                  <td className="px-3 py-3 align-top text-[var(--race-muted)] whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleString("pl-PL")}
                  </td>
                  <td className="px-3 py-3 align-top text-[var(--race-muted)] max-w-[12rem] truncate">
                    {r.pageUrl || "–"}
                  </td>
                  <td className="px-3 py-3 align-top max-w-sm">
                    <p className="whitespace-pre-wrap line-clamp-4">{r.message}</p>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="flex flex-wrap gap-1.5">
                      {r.status === "OPEN" && (
                        <Button
                          size="sm"
                          className="h-8 bg-green-700 hover:bg-green-600"
                          disabled={busyId === r.id}
                          onClick={() => void markDone(r.id)}
                        >
                          Załatwione
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-red-800 text-red-400"
                        disabled={busyId === r.id}
                        onClick={() => void remove(r.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
