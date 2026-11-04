/**
 * Workspace jednego wydarzenia: zakładki KPI / ustawienia / zgłoszenia / wyniki / komunikacja.
 * Faza 1: KPI + pełna tabela zgłoszeń; pozostałe zakładki — stub lub skrót do edycji.
 */
import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Calendar, Clock, Users } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { eventDateLabel } from "../../lib/types";
import type { Registration, RegistrationStatus } from "../../lib/types";
import type { OrganizerEvent } from "./organizerEventForm";
import { OrganizerRegistrationsTable } from "./OrganizerRegistrationsTable";
import { OrganizerClassConfig } from "./OrganizerClassConfig";
import { OrganizerResultsPanel } from "./OrganizerResultsPanel";
import { OrganizerCommsPanel } from "./OrganizerCommsPanel";

interface OrganizerEventWorkspaceProps {
  event: OrganizerEvent;
  registrations: Registration[];
  comments: Record<string, string>;
  setComments: Dispatch<SetStateAction<Record<string, string>>>;
  onBack: () => void;
  onEditEvent: () => void;
  onEventPatched?: (patch: Partial<OrganizerEvent>) => void;
  onUpdateStatus: (
    id: string,
    status: RegistrationStatus,
    commentOverride?: string,
  ) => Promise<void> | void;
  onBulkUpdateStatus: (
    ids: string[],
    status: RegistrationStatus,
    commentOverride?: string,
  ) => Promise<void> | void;
  onBulkAssignClass?: (ids: string[], classId: string | null) => Promise<void> | void;
  onOpenDetail: (reg: Registration) => void;
  onReloadRegistrations?: () => void;
}

function countByStatus(regs: Registration[], status: RegistrationStatus) {
  return regs.filter((r) => r.status === status).length;
}

function timeUntilEvent(event: OrganizerEvent, locale: string): string {
  const raw = `${event.date}T${(event.time || "00:00").slice(0, 5)}:00`;
  const start = new Date(raw);
  if (Number.isNaN(start.getTime())) return "—";
  const diff = start.getTime() - Date.now();
  if (diff <= 0) {
    return locale.startsWith("en") ? "Started / past" : "Trwa / minęło";
  }
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(hours / 24);
  const remH = hours % 24;
  if (days > 0) {
    return locale.startsWith("en")
      ? `${days}d ${remH}h`
      : `${days} dn. ${remH} godz.`;
  }
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  return locale.startsWith("en") ? `${hours}h ${mins}m` : `${hours} godz. ${mins} min`;
}

export function OrganizerEventWorkspace({
  event,
  registrations,
  comments,
  setComments,
  onBack,
  onEditEvent,
  onUpdateStatus,
  onBulkUpdateStatus,
  onBulkAssignClass,
  onOpenDetail,
  onReloadRegistrations,
  onEventPatched,
}: OrganizerEventWorkspaceProps) {
  const { t, i18n } = useTranslation();
  const pending = countByStatus(registrations, "PENDING");
  const accepted = countByStatus(registrations, "ACCEPTED");
  const confirmed = countByStatus(registrations, "CONFIRMED");
  const canceled = countByStatus(registrations, "CANCELED");

  const kpi = [
    { label: t("organizer.wsKpiPending"), value: pending },
    { label: t("organizer.wsKpiAccepted"), value: accepted },
    { label: t("organizer.wsKpiConfirmed"), value: confirmed },
    { label: t("organizer.wsKpiCanceled"), value: canceled },
    { label: t("organizer.wsKpiTotal"), value: registrations.length },
    { label: t("organizer.wsKpiViews"), value: event.viewCount ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="text-[var(--race-muted)] hover:text-[var(--race-fg)] -ml-2 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            {t("organizer.wsBack")}
          </Button>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge className="bg-[var(--race-accent)] text-[var(--race-on-accent)]">{event.category}</Badge>
            <Badge variant="outline" className="border-[var(--race-border)] text-[var(--race-fg)]">
              {t(`eventStatus.${event.status}`, { defaultValue: event.status })}
            </Badge>
            {event.paid && (
              <Badge variant="outline" className="border-[var(--race-accent)] text-[var(--race-accent)]">
                {t("common.paid")}
              </Badge>
            )}
          </div>
          <h2 className="font-display text-[var(--race-fg)] text-2xl sm:text-3xl" style={{ fontWeight: 800 }}>
            {event.name}
          </h2>
          <p className="text-[var(--race-muted)] text-sm mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {eventDateLabel(event, i18n.language)} · {event.track}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {t("organizer.wsUntil")}: {timeUntilEvent(event, i18n.language)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {t("organizer.entriesCount", { count: registrations.length })}
            </span>
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onEditEvent}
          className="border-[var(--race-border)] text-[var(--race-fg)]"
          style={{ fontWeight: 700 }}
        >
          {t("common.edit")}
        </Button>
      </div>

      <Tabs defaultValue="summary" className="gap-4">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-[var(--race-card)] border border-[var(--race-border)] p-1">
          <TabsTrigger value="summary" className="data-[state=active]:bg-[var(--race-accent)] data-[state=active]:text-[var(--race-on-accent)]">
            {t("organizer.wsTabSummary")}
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-[var(--race-accent)] data-[state=active]:text-[var(--race-on-accent)]">
            {t("organizer.wsTabSettings")}
          </TabsTrigger>
          <TabsTrigger value="regs" className="data-[state=active]:bg-[var(--race-accent)] data-[state=active]:text-[var(--race-on-accent)]">
            {t("organizer.wsTabRegs")}
          </TabsTrigger>
          <TabsTrigger value="results" className="data-[state=active]:bg-[var(--race-accent)] data-[state=active]:text-[var(--race-on-accent)]">
            {t("organizer.wsTabResults")}
          </TabsTrigger>
          <TabsTrigger value="comms" className="data-[state=active]:bg-[var(--race-accent)] data-[state=active]:text-[var(--race-on-accent)]">
            {t("organizer.wsTabComms")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {kpi.map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-[var(--race-border)] bg-[var(--race-card)] p-4"
              >
                <p className="text-xs uppercase tracking-wide text-[var(--race-muted)]" style={{ fontWeight: 700 }}>
                  {item.label}
                </p>
                <p className="font-display text-3xl text-[var(--race-accent)] mt-1" style={{ fontWeight: 800 }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-[var(--race-border)] bg-[var(--race-card)] p-4 text-sm text-[var(--race-muted)]">
            <p style={{ fontWeight: 700 }} className="text-[var(--race-fg)] mb-1">
              {t("organizer.wsUntil")}
            </p>
            <p className="text-lg text-[var(--race-accent)]" style={{ fontWeight: 700 }}>
              {timeUntilEvent(event, i18n.language)}
            </p>
            <p className="mt-2 text-xs">{t("organizer.wsViewsHint")}</p>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="rounded-lg border border-[var(--race-border)] bg-[var(--race-card)] p-5 space-y-3">
            <p className="text-[var(--race-fg)]" style={{ fontWeight: 700 }}>
              {t("organizer.wsSettingsTitle")}
            </p>
            <p className="text-sm text-[var(--race-muted)]">{t("organizer.wsSettingsBody")}</p>
            <Button
              type="button"
              onClick={onEditEvent}
              className="bg-[var(--race-accent)] text-[var(--race-on-accent)]"
              style={{ fontWeight: 700 }}
            >
              {t("organizer.wsOpenEventForm")}
            </Button>
          </div>
          <div className="rounded-lg border border-[var(--race-border)] bg-[var(--race-card)] p-5">
            <OrganizerClassConfig eventId={event.id} onChanged={onReloadRegistrations} />
          </div>
        </TabsContent>

        <TabsContent value="regs">
          <OrganizerRegistrationsTable
            registrations={registrations}
            selectedEvent={event}
            comments={comments}
            setComments={setComments}
            onUpdateStatus={onUpdateStatus}
            onBulkUpdateStatus={onBulkUpdateStatus}
            onBulkAssignClass={onBulkAssignClass}
            onOpenDetail={onOpenDetail}
          />
        </TabsContent>

        <TabsContent value="results">
          <div className="rounded-lg border border-[var(--race-border)] bg-[var(--race-card)] p-5">
            <OrganizerResultsPanel
              eventId={event.id}
              resultsPublished={event.resultsPublished}
              onPublishedChange={(published) => onEventPatched?.({ resultsPublished: published })}
            />
          </div>
        </TabsContent>

        <TabsContent value="comms">
          <div className="rounded-lg border border-[var(--race-border)] bg-[var(--race-card)] p-5">
            <OrganizerCommsPanel eventId={event.id} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
