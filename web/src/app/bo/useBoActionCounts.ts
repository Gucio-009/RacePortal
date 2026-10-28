/**
 * Liczniki kolejki BO (pending events / wnioski / otwarte bugi) — sidebar + hub.
 * Odświeżanie co 60s; soft-fail przy błędzie sieci.
 */
import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { AdminStats } from "../lib/types";

export interface BoActionCounts {
  pendingEvents: number;
  pendingApps: number;
  openBugs: number;
}

const EMPTY: BoActionCounts = { pendingEvents: 0, pendingApps: 0, openBugs: 0 };

interface BugRow {
  status: string;
}

export function useBoActionCounts(): BoActionCounts {
  const [counts, setCounts] = useState<BoActionCounts>(EMPTY);

  const refresh = useCallback(async () => {
    try {
      const [stats, bugs] = await Promise.all([
        api.get<AdminStats>("/api/admin/stats"),
        api.get<BugRow[]>("/api/bug-reports").catch(() => [] as BugRow[]),
      ]);
      setCounts({
        pendingEvents: stats.pendingEvents ?? 0,
        pendingApps: stats.pendingApps ?? 0,
        openBugs: bugs.filter((b) => b.status !== "DONE").length,
      });
    } catch {
      /* soft-fail — badge nie blokuje shella */
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  return counts;
}
