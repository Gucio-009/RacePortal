/**
 * NotificationBell — powiadomienia in-app w nagłówku.
 * Start: tylko unread-count (po idle); pełna lista przy otwarciu panelu.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Bell } from "lucide-react";
import { api } from "../lib/api";
import { deferUntilIdle } from "../lib/deferUntilIdle";
import type { AppNotification } from "../lib/types";
import { Button } from "./ui/button";

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
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] text-white shadow-xl z-[200] overflow-hidden">
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
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => openItem(n)}
                  className={`w-full text-left px-3 py-3 border-b border-[#2a2a2a] hover:bg-[#222] ${
                    n.read ? "opacity-70" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-[var(--race-accent)] shrink-0" />
                    )}
                    <div className={n.read ? "pl-4" : ""}>
                      <p className="text-sm font-semibold">{n.title}</p>
                      <p className="text-xs text-[#9ca3af] mt-0.5 whitespace-pre-wrap">{n.body}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
