/**
 * Publiczne zakładki: lista startowa (CONFIRMED) + wyniki (gdy opublikowane).
 */
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { api } from "../lib/api";
import type { EventResult } from "../lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface StartListEntry {
  registrationId: string;
  startNumber?: number | null;
  driverName: string;
  carLabel?: string | null;
  classId?: string | null;
  className?: string | null;
}

interface Props {
  eventId: string;
  resultsPublished?: boolean;
}

export function EventPublicLists({ eventId, resultsPublished }: Props) {
  const { t } = useTranslation();
  const [startItems, setStartItems] = useState<StartListEntry[]>([]);
  const [results, setResults] = useState<EventResult[]>([]);
  const [loadingStart, setLoadingStart] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [classFilter, setClassFilter] = useState("all");
  const [resultsClassFilter, setResultsClassFilter] = useState("all");
  const [resultsError, setResultsError] = useState(false);

  useEffect(() => {
    setLoadingStart(true);
    api
      .get<{ items: StartListEntry[] }>(`/api/events/${eventId}/start-list`)
      .then((res) => setStartItems(res.items ?? []))
      .catch(() => setStartItems([]))
      .finally(() => setLoadingStart(false));
  }, [eventId]);

  useEffect(() => {
    if (!resultsPublished) {
      setResults([]);
      setResultsError(false);
      return;
    }
    setLoadingResults(true);
    setResultsError(false);
    api
      .get<EventResult[]>(`/api/events/${eventId}/results`)
      .then(setResults)
      .catch(() => {
        setResults([]);
        setResultsError(true);
      })
      .finally(() => setLoadingResults(false));
  }, [eventId, resultsPublished]);

  const startClasses = useMemo(() => {
    const set = new Set<string>();
    for (const i of startItems) {
      if (i.className) set.add(i.className);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [startItems]);

  const resultClasses = useMemo(() => {
    const set = new Set<string>();
    for (const i of results) {
      if (i.className) set.add(i.className);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [results]);

  const filteredStart = useMemo(() => {
    if (classFilter === "all") return startItems;
    return startItems.filter((i) => i.className === classFilter);
  }, [startItems, classFilter]);

  const filteredResults = useMemo(() => {
    if (resultsClassFilter === "all") return results;
    return results.filter((i) => i.className === resultsClassFilter);
  }, [results, resultsClassFilter]);

  return (
    <div className="bg-[var(--race-card)] border border-[var(--race-border)] rounded-lg p-6 shadow-[var(--race-card-shadow)]">
      <Tabs defaultValue="start" className="gap-4">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-[var(--race-bg)] border border-[var(--race-border)] p-1">
          <TabsTrigger
            value="start"
            className="data-[state=active]:bg-[var(--race-accent)] data-[state=active]:text-[var(--race-on-accent)]"
          >
            {t("events.tabStartList")}
          </TabsTrigger>
          {resultsPublished ? (
            <TabsTrigger
              value="results"
              className="data-[state=active]:bg-[var(--race-accent)] data-[state=active]:text-[var(--race-on-accent)]"
            >
              {t("events.tabResults")}
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="start" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-[var(--race-muted)]">{t("events.startListHint")}</p>
            {startClasses.length > 0 && (
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-[200px] bg-[var(--race-bg)] border-[var(--race-border)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("events.startListOverall")}</SelectItem>
                  {startClasses.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {loadingStart ? (
            <p className="text-[var(--race-muted)] flex items-center gap-2 py-6 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("common.loading")}
            </p>
          ) : filteredStart.length === 0 ? (
            <p className="text-sm text-[var(--race-muted)] text-center py-6">{t("events.startListEmpty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[var(--race-muted)] border-b border-[var(--race-border)]">
                  <tr>
                    <th className="p-2 text-left">{t("events.startCol.num")}</th>
                    <th className="p-2 text-left">{t("events.startCol.driver")}</th>
                    <th className="p-2 text-left">{t("events.startCol.car")}</th>
                    <th className="p-2 text-left">{t("events.startCol.class")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStart.map((row) => (
                    <tr key={row.registrationId} className="border-b border-[var(--race-border)]">
                      <td className="p-2 text-[var(--race-fg)]">{row.startNumber ?? "—"}</td>
                      <td className="p-2 text-[var(--race-fg)]" style={{ fontWeight: 600 }}>
                        {row.driverName}
                      </td>
                      <td className="p-2 text-[var(--race-muted)]">{row.carLabel || "—"}</td>
                      <td className="p-2 text-[var(--race-muted)]">{row.className || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {resultsPublished ? (
          <TabsContent value="results" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-[var(--race-muted)]">{t("events.resultsHint")}</p>
              {resultClasses.length > 0 && (
                <Select value={resultsClassFilter} onValueChange={setResultsClassFilter}>
                  <SelectTrigger className="w-[200px] bg-[var(--race-bg)] border-[var(--race-border)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("events.startListOverall")}</SelectItem>
                    {resultClasses.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {loadingResults ? (
              <p className="text-[var(--race-muted)] flex items-center gap-2 py-6 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("common.loading")}
              </p>
            ) : resultsError ? (
              <p className="text-sm text-[var(--race-muted)] text-center py-6">{t("events.resultsLoadFail")}</p>
            ) : filteredResults.length === 0 ? (
              <p className="text-sm text-[var(--race-muted)] text-center py-6">{t("events.resultsEmpty")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-[var(--race-muted)] border-b border-[var(--race-border)]">
                    <tr>
                      <th className="p-2 text-left">{t("organizer.resCol.pos")}</th>
                      <th className="p-2 text-left">{t("organizer.resCol.start")}</th>
                      <th className="p-2 text-left">{t("organizer.resCol.driver")}</th>
                      <th className="p-2 text-left">{t("organizer.resCol.car")}</th>
                      <th className="p-2 text-left">{t("organizer.resCol.class")}</th>
                      <th className="p-2 text-left">{t("organizer.resCol.time")}</th>
                      <th className="p-2 text-left">{t("organizer.resCol.points")}</th>
                      <th className="p-2 text-left">{t("organizer.resCol.status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((row) => (
                      <tr key={row.id} className="border-b border-[var(--race-border)]">
                        <td className="p-2 text-[var(--race-fg)]">{row.position ?? "—"}</td>
                        <td className="p-2 text-[var(--race-fg)]">{row.startNumber ?? "—"}</td>
                        <td className="p-2 text-[var(--race-fg)]" style={{ fontWeight: 600 }}>
                          {row.driverName}
                        </td>
                        <td className="p-2 text-[var(--race-muted)]">{row.carLabel || "—"}</td>
                        <td className="p-2 text-[var(--race-muted)]">{row.className || "—"}</td>
                        <td className="p-2 text-[var(--race-fg)]">{row.timeDisplay || "—"}</td>
                        <td className="p-2 text-[var(--race-fg)]">{row.points ?? "—"}</td>
                        <td className="p-2 text-[var(--race-muted)]">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
