/**
 * Lekki „live” feed kolejki BO bez WebSocketów.
 *
 * Bezpieczeństwo:
 * - tylko wewnątrz BoAuthGate (ADMIN + cookies same-origin),
 * - wyłącznie GET /api/admin/stats (już RBAC ADMIN) — bez nowych publicznych kanałów,
 * - poll tylko gdy karta widoczna (mniej ruchu przy skradzionej sesji w tle),
 * - bez tokenów w URL / localStorage; credentials jak reszta API,
 * - miękki fail (401 nie spamuje UI) — AuthGate i tak wyloguje przy twardym deny.
 *
 * Świadomie nie: SSE/WS (większa powierzchnia auth na upgrade), push do non-admin.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { api } from "../lib/api";
import type { AdminStats } from "../lib/types";

export interface BoActionCounts {
  pendingEvents: number;
  pendingApps: number;
  openBugs: number;
}

export interface BoQueueRevisions {
  pendingEvents: number;
  pendingApps: number;
  openBugs: number;
  any: number;
}

interface BoQueueValue {
  counts: BoActionCounts;
  stats: AdminStats | null;
  revisions: BoQueueRevisions;
  refresh: () => Promise<void>;
}

const EMPTY: BoActionCounts = { pendingEvents: 0, pendingApps: 0, openBugs: 0 };
const EMPTY_REV: BoQueueRevisions = { pendingEvents: 0, pendingApps: 0, openBugs: 0, any: 0 };

const POLL_MS = 15_000;
const MIN_FETCH_GAP_MS = 5_000;

const BoQueueContext = createContext<BoQueueValue | null>(null);

function toCounts(s: AdminStats): BoActionCounts {
  return {
    pendingEvents: s.pendingEvents ?? 0,
    pendingApps: s.pendingApps ?? 0,
    openBugs: s.openBugs ?? 0,
  };
}

export function BoQueueProvider({ children }: { children: ReactNode }) {
  const [counts, setCounts] = useState<BoActionCounts>(EMPTY);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [revisions, setRevisions] = useState<BoQueueRevisions>(EMPTY_REV);
  const countsRef = useRef(counts);
  const primedRef = useRef(false);
  const inFlightRef = useRef(false);
  const lastFetchRef = useRef(0);

  useEffect(() => {
    countsRef.current = counts;
  }, [counts]);

  const refresh = useCallback(async (opts?: { force?: boolean }) => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden" && !opts?.force) {
      return;
    }
    const now = Date.now();
    if (!opts?.force && now - lastFetchRef.current < MIN_FETCH_GAP_MS) {
      return;
    }
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const s = await api.get<AdminStats>("/api/admin/stats");
      lastFetchRef.current = Date.now();
      const next = toCounts(s);
      const prev = countsRef.current;
      setStats(s);
      setCounts(next);

      const grewEvents = next.pendingEvents > prev.pendingEvents;
      const grewApps = next.pendingApps > prev.pendingApps;
      const grewBugs = next.openBugs > prev.openBugs;
      const changed =
        next.pendingEvents !== prev.pendingEvents ||
        next.pendingApps !== prev.pendingApps ||
        next.openBugs !== prev.openBugs;

      if (changed) {
        setRevisions((r) => ({
          pendingEvents: grewEvents || next.pendingEvents !== prev.pendingEvents ? r.pendingEvents + 1 : r.pendingEvents,
          pendingApps: grewApps || next.pendingApps !== prev.pendingApps ? r.pendingApps + 1 : r.pendingApps,
          openBugs: grewBugs || next.openBugs !== prev.openBugs ? r.openBugs + 1 : r.openBugs,
          any: r.any + 1,
        }));
      }

      if (primedRef.current) {
        const bits: string[] = [];
        if (grewEvents) bits.push(`wydarzenia +${next.pendingEvents - prev.pendingEvents}`);
        if (grewApps) bits.push(`wnioski +${next.pendingApps - prev.pendingApps}`);
        if (grewBugs) bits.push(`błędy +${next.openBugs - prev.openBugs}`);
        if (bits.length > 0) {
          toast.message("Nowa pozycja w kolejce BO", { description: bits.join(" · ") });
        }
      }
      primedRef.current = true;
    } catch {
      /* soft-fail — badge/listy zostają na ostatnim stanie */
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    void refresh({ force: true });

    const onVis = () => {
      if (document.visibilityState === "visible") void refresh({ force: true });
    };
    const onFocus = () => void refresh({ force: true });
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);

    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, POLL_MS);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
      window.clearInterval(id);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({ counts, stats, revisions, refresh: () => refresh({ force: true }) }),
    [counts, stats, revisions, refresh],
  );

  return <BoQueueContext.Provider value={value}>{children}</BoQueueContext.Provider>;
}

export function useBoQueue(): BoQueueValue {
  const ctx = useContext(BoQueueContext);
  if (!ctx) {
    throw new Error("useBoQueue poza BoQueueProvider");
  }
  return ctx;
}

/** Opcjonalnie — layout badges bez throw gdyby kiedyś użyto poza providerem. */
export function useBoActionCounts(): BoActionCounts {
  const ctx = useContext(BoQueueContext);
  return ctx?.counts ?? EMPTY;
}
