/**
 * NotificationBell — powiadomienia in-app w nagłówku.
 * Start: tylko unread-count (po idle); pełna lista przy otwarciu panelu.
 * Usuwanie (X), czas względny, etykiety typów z ikoną.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Bell,
  CalendarCheck,
  CalendarX,
  CheckCircle2,
  Info,
  Shield,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { deferUntilIdle } from "../lib/deferUntilIdle";
import type { AppNotification } from "../lib/types";
import { Button } from "./ui/button";

function notificationMeta(type: string): {
  label: string;
  icon: typeof Bell;
  className: string;
} {
  switch (type) {
    case "EVENT_PENDING_REVIEW":
      return {
        label: "Moderacja",
        icon: Shield,
        className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      };
    case "EVENT_APPROVED":
      return {
        label: "Zaakceptowane",
        icon: CheckCircle2,
        className: "bg-green-500/15 text-green-400 border-green-500/30",
      };
    case "EVENT_REJECTED":
      return {
        label: "Odrzucone",
        icon: CalendarX,
        className: "bg-red-500/15 text-red-400 border-red-500/30",
      };
    case "EVENT_STATUS":
      return {
        label: "Status wydarzenia",
        icon: CalendarCheck,
        className: "bg-sky-500/15 text-sky-400 border-sky-500/30",
      };
    default:
      return {
        label: "Powiadomienie",
        icon: Info,
        className: "bg-[#2a2a2a] text-[#9ca3af] border-[#3a3a3a]",
      };
  }
}

function formatNotificationTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "przed chwilą";
  if (mins < 60) return `${mins} min temu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} godz. temu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} dni temu`;
  return d.toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const refreshUnread = useCallback(async () => {
    try {
      const count = await api.get<{ unread: number }>("/api/notifications/unread-count");
      setUnread(count.unread);
    } catch {
      /* soft-fail — bell nie blokuje UI */
    }
  }, []);

  const loadList = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([
        api.get<AppNotification[]>("/api/notifications"),
        api.get<{ unread: number }>("/api/notifications/unread-count"),
      ]);
      setItems(list);
      setUnread(count.unread);
    } catch {
      /* soft-fail */
    }
  }, []);

  useEffect(() => {
    const cancelIdle = deferUntilIdle(() => {
      void refreshUnread();
    });
    const t = window.setInterval(() => void refreshUnread(), 60_000);
    return () => {
      cancelIdle();
      window.clearInterval(t);
    };
  }, [refreshUnread]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markAll = async () => {
    try {
      await api.post<{ unread: number }>("/api/notifications/read-all", {});
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      /* ignore */
    }
  };

  const removeItem = async (n: AppNotification, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await api.delete(`/api/notifications/${n.id}`);
      setItems((prev) => prev.filter((x) => x.id !== n.id));
      if (!n.read) setUnread((u) => Math.max(0, u - 1));
    } catch {
      /* ignore */
    }
  };

  const openItem = async (n: AppNotification) => {
    if (!n.read) {
      try {
        await api.patch(`/api/notifications/${n.id}/read`, {});
        setUnread((u) => Math.max(0, u - 1));
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
    if (n.type === "EVENT_PENDING_REVIEW") {
      navigate("/admin");
      return;
    }
    if (n.relatedEventId) {
      if (n.type === "EVENT_APPROVED" || n.type === "EVENT_REJECTED" || n.type === "EVENT_STATUS") {
        navigate("/organizer");
        return;
      }
      navigate(`/wydarzenia/${n.relatedEventId}`);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <Button
        type="button"
        variant="ghost"
        aria-label="Powiadomienia"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void loadList();
        }}
        className="relative text-white hover:bg-[#2a2a2a] border border-[#2a2a2a] h-9 w-9 p-0"
      >
        <Bell className="w-4 h-4 text-[var(--race-accent)]" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--race-accent)] text-[#121212] text-[10px] flex items-center justify-center font-bold">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] text-white shadow-xl z-[200] overflow-hidden">
          <div className="px-3 py-2.5 border-b border-[#2a2a2a] flex items-center justify-between gap-2">
            <span className="font-semibold text-sm">Powiadomienia</span>
            {unread > 0 && (
              <button
                type="button"
                className="text-xs text-[var(--race-accent)] hover:underline"
                onClick={markAll}
              >
                Oznacz wszystkie
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-[#9ca3af] text-sm px-3 py-6 text-center">Brak powiadomień.</p>
            ) : (
              items.map((n) => {
                const meta = notificationMeta(n.type);
                const Icon = meta.icon;
                return (
                  <div
                    key={n.id}
                    className={`border-b border-[#2a2a2a] hover:bg-[#222] ${n.read ? "opacity-75" : ""}`}
                  >
                    <div className="flex items-start gap-1 pr-1">
                      <button
                        type="button"
                        onClick={() => openItem(n)}
                        className="flex-1 text-left px-3 py-3 min-w-0"
                      >
                        <div className="flex items-start gap-2">
                          {!n.read ? (
                            <span className="mt-1.5 w-2 h-2 rounded-full bg-[var(--race-accent)] shrink-0" />
                          ) : (
                            <span className="mt-1.5 w-2 h-2 shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${meta.className}`}
                              >
                                <Icon className="w-3 h-3" aria-hidden />
                                {meta.label}
                              </span>
                              <span className="text-[10px] text-[#6b7280]">
                                {formatNotificationTime(n.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm font-semibold">{n.title}</p>
                            <p className="text-xs text-[#9ca3af] mt-0.5 whitespace-pre-wrap">{n.body}</p>
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        aria-label="Usuń powiadomienie"
                        title="Usuń"
                        onClick={(e) => void removeItem(n, e)}
                        className="mt-2 mr-1 p-1.5 rounded text-[#6b7280] hover:text-white hover:bg-[#2a2a2a] shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
