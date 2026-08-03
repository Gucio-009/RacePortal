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
      <div className="text-center py-12 text-[#9ca3af]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[var(--race-accent)]" />
        Ładowanie...
      </div>
    );
  }

  if (loadError) {
    return <p className="text-red-400 text-center py-12">{loadError}</p>;
  }

  if (events.length === 0) {
    return <p className="text-[#9ca3af] text-center py-12">Brak wydarzeń. Utwórz pierwsze!</p>;
  }

  return (
    <>
      {events.map((event) => (
        <Card key={event.id} className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge className="bg-[var(--race-accent)] text-[#121212]">{event.category}</Badge>
                <Badge variant="outline" className="border-[#2a2a2a] text-white">
                  {eventStatusLabel(event.status)}
                </Badge>
                {event.paid && (
                  <Badge variant="outline" className="border-[var(--race-accent)] text-[var(--race-accent)]">
                    Płatne
                  </Badge>
                )}
              </div>
              <h3 className="font-['Orbitron'] text-white" style={{ fontWeight: 800 }}>
                {event.name}
              </h3>
              <p className="text-[#9ca3af] text-sm flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4" />
                {event.dateLabel || formatEventDate(event.date)} · {event.track}
              </p>
              <p className="text-[#9ca3af] text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                {event._count?.registrations ?? event.registrationsCount ?? 0} zgłoszeń
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => onEdit(event)}
                className="border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edytuj
              </Button>
              <Button
                variant="outline"
                onClick={() => onLoadRegistrations(event.id)}
                className="border-[var(--race-accent)] text-[var(--race-accent)] hover:bg-[var(--race-accent)] hover:text-[#121212]"
                style={{ fontWeight: 700 }}
              >
                Zobacz zgłoszenia
              </Button>
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
