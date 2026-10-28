import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Check, Download, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "../lib/api";
import type { OrganizerApplication } from "../lib/types";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { downloadBoCsv } from "./csv";

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

export function BoApplicationsPage() {
  const [params, setParams] = useSearchParams();
  const statusParam = (params.get("status") || "ALL").toUpperCase();
  const statusFilter: StatusFilter =
    statusParam === "PENDING" || statusParam === "APPROVED" || statusParam === "REJECTED"
      ? statusParam
      : "ALL";
  const [apps, setApps] = useState<OrganizerApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setApps(await api.get<OrganizerApplication[]>("/api/admin/organizer-applications"));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Nie udało się pobrać wniosków");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const list =
      statusFilter === "ALL" ? apps : apps.filter((a) => a.status === statusFilter);
    return [...list].sort((a, b) => {
      if (a.status === "PENDING" && b.status !== "PENDING") return -1;
      if (b.status === "PENDING" && a.status !== "PENDING") return 1;
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });
  }, [apps, statusFilter]);

  const setFilter = (s: StatusFilter) => {
    const p = new URLSearchParams(params);
    if (s === "ALL") p.delete("status");
    else p.set("status", s);
    setParams(p, { replace: true });
  };

  const update = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      await api.patch(`/api/admin/organizer-applications/${id}`, { status });
      toast.success(status === "APPROVED" ? "Wniosek zaakceptowany" : "Wniosek odrzucony");
      setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Błąd aktualizacji wniosku");
    }
  };

  const exportCsv = () => {
    downloadBoCsv(
      "wnioski",
      ["id", "status", "company", "businessType", "userUsername", "userEmail", "message", "createdAt"],
      filtered.map((a) => [
        a.id,
        a.status,
        a.company,
        a.businessType,
        a.user?.username,
        a.user?.email,
        a.message,
        a.createdAt,
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
          Wnioski organizatora
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
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
          <Button
            key={s}
            type="button"
            size="sm"
            variant={statusFilter === s ? "default" : "outline"}
            onClick={() => setFilter(s)}
            className={
              statusFilter === s
                ? "bg-[var(--race-accent)] text-[var(--race-on-accent)]"
                : "border-[var(--race-border)]"
            }
          >
            {s === "ALL" ? "Wszystkie" : s}
            {s === "PENDING" ? ` (${apps.filter((a) => a.status === "PENDING").length})` : ""}
          </Button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--race-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--race-card)] text-left text-[var(--race-muted)]">
            <tr>
              <th className="px-3 py-2.5 font-semibold">Firma</th>
              <th className="px-3 py-2.5 font-semibold">Status</th>
              <th className="px-3 py-2.5 font-semibold">Użytkownik</th>
              <th className="px-3 py-2.5 font-semibold">Data</th>
              <th className="px-3 py-2.5 font-semibold">Wiadomość</th>
              <th className="px-3 py-2.5 font-semibold">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-[var(--race-muted)]">
                  Brak wniosków
                </td>
              </tr>
            ) : (
              filtered.map((app) => (
                <tr key={app.id} className="border-t border-[var(--race-border)] hover:bg-[var(--race-hover)]/40">
                  <td className="px-3 py-3 align-top">
                    <p style={{ fontWeight: 700 }}>{app.company}</p>
                    {app.businessType && (
                      <p className="text-xs text-[var(--race-muted)]">{app.businessType}</p>
                    )}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <Badge
                      variant="outline"
                      className={
                        app.status === "PENDING"
                          ? "border-[var(--race-accent)] text-[var(--race-accent)]"
                          : app.status === "APPROVED"
                            ? "border-green-700 text-green-400"
                            : "border-red-800 text-red-400"
                      }
                    >
                      {app.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 align-top text-[var(--race-muted)]">
                    {app.user?.username}
                    <br />
                    <span className="text-xs">{app.user?.email}</span>
                  </td>
                  <td className="px-3 py-3 align-top text-[var(--race-muted)] whitespace-nowrap">
                    {app.createdAt ? new Date(app.createdAt).toLocaleString("pl-PL") : "–"}
                  </td>
                  <td className="px-3 py-3 align-top text-[var(--race-muted)] max-w-xs">
                    <p className="line-clamp-3 whitespace-pre-wrap">{app.message}</p>
                  </td>
                  <td className="px-3 py-3 align-top">
                    {app.status === "PENDING" && (
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          size="sm"
                          className="h-8 bg-green-700 hover:bg-green-600"
                          onClick={() => void update(app.id, "APPROVED")}
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Akceptuj
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-red-800 text-red-400"
                          onClick={() => void update(app.id, "REJECTED")}
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Odrzuć
                        </Button>
                      </div>
                    )}
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
