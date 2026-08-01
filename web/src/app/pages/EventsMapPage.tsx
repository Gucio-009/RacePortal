import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { MapPin, Loader2 } from "lucide-react";
import { EventsMapView, eventToMarker } from "../components/EventsMapView";
import { api } from "../lib/api";
import type { ApiEvent } from "../lib/types";

export function EventsMapPage() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ items: ApiEvent[] }>("/api/events?limit=50")
      .then((res) => setEvents(res.items))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const markers = useMemo(
    () => events.map(eventToMarker).filter((m): m is NonNullable<typeof m> => m !== null),
    [events],
  );

  return (
    <div className="min-h-screen">
      <section className="bg-[#1a1a1a] border-b border-[#2a2a2a] py-12">
        <div className="container mx-auto px-4">
          <h1 className="font-['Orbitron'] text-white mb-3" style={{ fontSize: "40px", fontWeight: 900 }}>
            MAPA <span className="text-[#FFD700]">WYDARZEŃ</span>
          </h1>
          <p className="text-[#9ca3af] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#FFD700]" />
            Lokalizacje nadchodzących wyścigów w Polsce
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 space-y-6">
        {loading ? (
          <div className="text-center py-16 text-[#9ca3af]">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#FFD700]" />
            Ładowanie mapy...
          </div>
        ) : markers.length === 0 ? (
          <p className="text-center text-[#9ca3af] py-16">
            Brak wydarzeń z współrzędnymi GPS. Sprawdź{" "}
            <Link to="/wydarzenia" className="text-[#FFD700] hover:underline">
              kalendarz
            </Link>
            .
          </p>
        ) : (
          <>
            <EventsMapView markers={markers} height="560px" />
            <p className="text-[#9ca3af] text-sm text-center">
              Kliknij marker, aby zobaczyć szczegóły wydarzenia. Na stronie wydarzenia użyj „Trasa do mnie”.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
