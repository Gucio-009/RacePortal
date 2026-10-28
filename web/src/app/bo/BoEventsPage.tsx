import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import {
  Archive,
  Ban,
  Check,
  Download,
  ExternalLink,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "../lib/api";
import type { ApiEvent } from "../lib/types";
import { formatEntryFee, formatEventDate } from "../lib/types";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { downloadBoCsv } from "./csv";
import { apexEventUrl } from "./host";

interface BoEvent extends ApiEvent {
  organizer?: { id: string; username: string; email: string; verified?: boolean } | null;
}

type Tab = "pending" | "approved";

export function BoEventsPage() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") === "approved" ? "approved" : "pending") as Tab;
  const [pending, setPending] = useState<BoEvent[]>([]);
  const [approved, setApproved] = useState<BoEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [rejectTarget, setRejectTarget] = useState<BoEvent | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [pe, ae] = await Promise.all([
        api.get<BoEvent[]>("/api/admin/events/pending"),
        api.get<BoEvent[]>("/api/admin/events/approved"),
      ]);
      setPending(pe);
      setApproved(ae);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Nie udało się pobrać wydarzeń");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const list = tab === "pending" ? pending : approved;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.track ?? "").toLowerCase().includes(q) ||
        (e.city ?? "").toLowerCase().includes(q) ||
        (e.organizer?.username ?? "").toLowerCase().includes(q),
    );
  }, [list, query]);

  const setTab = (next: Tab) => {
    const p = new URLSearchParams(params);
    p.set("tab", next);
    setParams(p, { replace: true });
  };

  const updateStatus = async (id: string, status: string, reason?: string) => {
    try {
      await api.patch(`/api/admin/events/${id}/status`, {
        status,
        ...(reason != null ? { reason } : {}),
      });
      toast.success(
        status === "APPROVED"
          ? "Wydarzenie zatwierdzone"
          : status === "REJECTED"
            ? "Wydarzenie odrzucone"
            : `Status: ${status}`,
      );
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Błąd aktualizacji");
      throw e;
    }
  };

  const exportCsv = () => {
    downloadBoCsv(
      tab === "pending" ? "wydarzenia-pending" : "wydarzenia-approved",
      [
        "id",
        "name",
        "status",
        "category",
        "date",
        "time",
        "track",
        "city",
        "voivodeship",
        "paid",
        "entryFee",
        "organizerUsername",
        "organizerEmail",
        "rejectionReason",
      ],
      filtered.map((e) => [
        e.id,
        e.name,
        e.status,
        e.category,
        e.date,
        e.time,
        e.track,
        e.city,
        e.voivodeship,
        e.paid,
        e.entryFee,
        e.organizer?.username,
        e.organizer?.email,
        e.rejectionReason,
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
          Wydarzenia
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
        <Button
          type="button"
          size="sm"
          variant={tab === "pending" ? "default" : "outline"}
          onClick={() => setTab("pending")}
          className={tab === "pending" ? "bg-[var(--race-accent)] text-[var(--race-on-accent)]" : "border-[var(--race-border)]"}
        >
          Oczekujące ({pending.length})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "approved" ? "default" : "outline"}
          onClick={() => setTab("approved")}
          className={tab === "approved" ? "bg-[var(--race-accent)] text-[var(--race-on-accent)]" : "border-[var(--race-border)]"}
        >
          Zatwierdzone ({approved.length})
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--race-muted)]" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj (nazwa, tor, miasto, organizator)…"
          className="pl-10 bg-[var(--race-card)] border-[var(--race-border)]"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--race-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--race-card)] text-left text-[var(--race-muted)]">
            <tr>
              <th className="px-3 py-2.5 font-semibold">Nazwa</th>
              <th className="px-3 py-2.5 font-semibold">Status</th>
              <th className="px-3 py-2.5 font-semibold">Data</th>
              <th className="px-3 py-2.5 font-semibold">Miejsce</th>
              <th className="px-3 py-2.5 font-semibold">Organizator</th>
              <th className="px-3 py-2.5 font-semibold">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-[var(--race-muted)]">
                  Brak wydarzeń
                </td>
              </tr>
            ) : (
              filtered.map((event) => (
                <tr key={event.id} className="border-t border-[var(--race-border)] hover:bg-[var(--race-hover)]/40">
                  <td className="px-3 py-3 align-top">
                    <p style={{ fontWeight: 700 }}>{event.name}</p>
                    <p className="text-xs text-[var(--race-muted)]">
                      {event.category}
                      {event.paid ? ` · ${formatEntryFee(event.entryFee, "pl") ?? "płatne"}` : " · darmowe"}
                    </p>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <Badge variant="outline" className="border-[var(--race-border)]">
                      {event.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 align-top text-[var(--race-muted)] whitespace-nowrap">
                    {event.dateLabel || formatEventDate(event.date)}
                    {event.time ? ` · ${event.time}` : ""}
                  </td>
                  <td className="px-3 py-3 align-top text-[var(--race-muted)]">
                    {event.track}, {event.city}
                  </td>
                  <td className="px-3 py-3 align-top text-[var(--race-muted)]">
                    {event.organizer?.username ?? "–"}
                    {event.organizer?.verified ? " ✓" : ""}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="flex flex-wrap gap-1.5">
                      <Button size="sm" variant="outline" className="h-8 border-[var(--race-border)]" asChild>
                        <a href={apexEventUrl(event.id)} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5 mr-1" />
                          Podgląd
                        </a>
                      </Button>
                      {tab === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="h-8 bg-green-700 hover:bg-green-600"
                            onClick={() => void updateStatus(event.id, "APPROVED")}
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Akceptuj
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-red-800 text-red-400"
                            onClick={() => {
                              setRejectTarget(event);
                              setRejectReason("");
                            }}
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Odrzuć
                          </Button>
                        </>
                      )}
                      {tab === "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-red-900 text-red-400"
                          onClick={() => {
                            if (confirm("Anulować to wydarzenie? Zgłoszenia zostaną anulowane.")) {
                              void updateStatus(event.id, "CANCELLED");
                            }
                          }}
                        >
                          <Ban className="w-3.5 h-3.5 mr-1" />
                          Anuluj
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-[var(--race-border)]"
                        onClick={() => void updateStatus(event.id, "ARCHIVED")}
                      >
                        <Archive className="w-3.5 h-3.5 mr-1" />
                        Archiwum
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)]">
          <DialogHeader>
            <DialogTitle className="font-display">Odrzuć wydarzenie</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Powód (wymagany)</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="bg-[var(--race-bg)] border-[var(--race-border)]"
              placeholder="Np. brak informacji o torze…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)} className="border-[var(--race-border)]">
              Anuluj
            </Button>
            <Button
              disabled={rejecting}
              className="bg-red-700 hover:bg-red-600"
              onClick={() => {
                if (!rejectTarget) return;
                const reason = rejectReason.trim();
                if (!reason) {
                  toast.error("Podaj powód odrzucenia");
                  return;
                }
                setRejecting(true);
                void updateStatus(rejectTarget.id, "REJECTED", reason)
                  .then(() => {
                    setRejectTarget(null);
                    setRejectReason("");
                  })
                  .finally(() => setRejecting(false));
              }}
            >
              Odrzuć
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
