/**
 * OrganizerEventList — lista wydarzeń w panelu organizatora.
 *
 * Props z `OrganizerPanelPage`: events + loading/error + callbacki edycji / zgłoszeń / anulacji.
 * Statusy: `eventStatusLabel` (PL); badge „Płatne” gdy `event.paid`.
 * Anuluj ukryte dla CANCELLED / ARCHIVED (już nieaktywne).
 * Licznik zgłoszeń: `_count.registrations` (Spring) lub `registrationsCount`.
 *
 * Akcent UI: `--race-accent` (theme / ustawienia użytkownika).
 *
 * Pomysł (alt): tabela z sortowaniem zamiast kart; infinite scroll przy wielu eventach.
 */

import { Calendar, Users, Loader2, Ban, Pencil } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { eventStatusLabel, formatEventDate } from "../../lib/types";
import type { OrganizerEvent } from "./organizerEventForm";

interface OrganizerEventListProps {
  events: OrganizerEvent[];
  loading: boolean;
  loadError: string | null;
  onEdit: (event: OrganizerEvent) => void;
  onLoadRegistrations: (eventId: string) => void;
  onCancelEvent: (eventId: string) => void;
}

export function OrganizerEventList({
  events,
  loading,
  loadError,
  onEdit,
  onLoadRegistrations,
  onCancelEvent,
}: OrganizerEventListProps) {
  if (loading) {
    return (
      <div className="text-center py-12 text-[var(--race-muted)]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[var(--race-accent)]" />
        Ładowanie...
      </div>
    );
  }

  if (loadError) {
    return <p className="text-red-400 text-center py-12">{loadError}</p>;
  }

  if (events.length === 0) {
    return <p className="text-[var(--race-muted)] text-center py-12">Brak wydarzeń. Utwórz pierwsze!</p>;
  }

  return (
    <>
      {events.map((event) => (
        <Card key={event.id} className="bg-[var(--race-card)] border-[var(--race-border)]">
          <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge className="bg-[var(--race-accent)] text-[var(--race-on-accent)]">{event.category}</Badge>
                <Badge variant="outline" className="border-[var(--race-border)] text-[var(--race-fg)]">
                  {eventStatusLabel(event.status)}
                </Badge>
                {event.paid && (
                  <Badge variant="outline" className="border-[var(--race-accent)] text-[var(--race-accent)]">
                    Płatne
                  </Badge>
                )}
              </div>
              <h3 className="font-display text-[var(--race-fg)]" style={{ fontWeight: 800 }}>
                {event.name}
              </h3>
              <p className="text-[var(--race-muted)] text-sm flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4" />
                {event.dateLabel || formatEventDate(event.date)} · {event.track}
              </p>
              <p className="text-[var(--race-muted)] text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                {event._count?.registrations ?? event.registrationsCount ?? 0} zgłoszeń
              </p>
              {event.status === "REJECTED" && event.rejectionReason && (
                <p className="text-red-400 text-sm mt-2 whitespace-pre-wrap">
                  Powód odrzucenia: {event.rejectionReason}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => onEdit(event)}
                className="border-[var(--race-border)] text-[var(--race-fg)] hover:bg-[var(--race-hover)]"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edytuj
              </Button>
              <Button
                variant="outline"
                onClick={() => onLoadRegistrations(event.id)}
                className="border-[var(--race-accent)] text-[var(--race-accent)] hover:bg-[var(--race-accent)] hover:text-[var(--race-on-accent)]"
                style={{ fontWeight: 700 }}
              >
                Zobacz zgłoszenia
              </Button>
              {/* Anulacja tylko dla aktywnych — CANCELLED/ARCHIVED bez akcji */}
              {event.status !== "CANCELLED" && event.status !== "ARCHIVED" && (
                <Button
                  variant="outline"
                  onClick={() => onCancelEvent(event.id)}
                  className="border-red-900 text-red-400 hover:bg-red-950"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Anuluj
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
