import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Calendar, MapPin, ChevronRight, ChevronLeft } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { api, ApiError } from "../lib/api";
import type { ApiEvent, PaginatedEvents } from "../lib/types";
import { eventImage, eventStatusLabel } from "../lib/types";

export function ArchivePage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedEvents | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    api
      .get<PaginatedEvents>(`/api/events?archive=1&page=${page}&limit=12`)
      .then((res) => {
        setData(res);
        setLoadError(null);
      })
      .catch((e) => {
        setData(null);
        setLoadError(e instanceof ApiError ? e.message : "Nie udało się pobrać archiwum. Sprawdź API / połączenie.");
      })
      .finally(() => setLoading(false));
  }, [page]);

  const items = data?.items ?? [];

  return (
    <div className="min-h-screen">
      <section
        className="relative py-20 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(18, 18, 18, 0.85), rgba(18, 18, 18, 0.9)), url('https://images.unsplash.com/photo-1638909469623-4fdd7758414b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920')`,
        }}
      >
        <div className="container mx-auto px-4">
          <h1 className="font-['Orbitron'] text-white mb-3" style={{ fontSize: "48px", fontWeight: 900 }}>
            ARCHIWUM <span className="text-[#FFD700]">WYDARZEŃ</span>
          </h1>
          <p className="text-[#9ca3af] max-w-2xl" style={{ fontSize: "18px" }}>
            Zakończone wyścigi i wydarzenia z poprzednich sezonów.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 space-y-6">
        {loading ? (
          <p className="text-center text-[#9ca3af] py-16">Ładowanie archiwum...</p>
        ) : loadError ? (
          <p className="text-center text-red-400 py-16">{loadError}</p>
        ) : items.length === 0 ? (
          <p className="text-center text-[#9ca3af] py-16">Brak zarchiwizowanych wydarzeń.</p>
        ) : (
          <>
            {items.map((event: ApiEvent) => (
              <Card key={event.id} className="bg-[#1a1a1a] border-[#2a2a2a] overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-0">
                    <div className="h-48 md:h-full min-h-[180px]">
                      <ImageWithFallback src={eventImage(event)} alt={event.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-6">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge className="bg-[#FFD700] text-[#121212]" style={{ fontWeight: 700 }}>
                          {event.category}
                        </Badge>
                        <Badge variant="outline" className="border-[#2a2a2a] text-white">
                          {eventStatusLabel(event.status)}
                        </Badge>
                        <span className="text-[#9ca3af]" style={{ fontSize: "14px" }}>
                          {event.dateLabel}
                        </span>
                      </div>
                      <h2 className="font-['Orbitron'] text-white mb-2" style={{ fontSize: "24px", fontWeight: 800 }}>
                        {event.name}
                      </h2>
                      <div className="flex items-center gap-2 text-[#9ca3af] mb-4">
                        <MapPin className="w-4 h-4" />
                        {event.track}, {event.city}
                      </div>
                      <p className="text-[#9ca3af] mb-4 line-clamp-2">{event.description}</p>
                      <Link to={`/wydarzenia/${event.id}`}>
                        <Button
                          variant="outline"
                          className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-[#121212]"
                          style={{ fontWeight: 700 }}
                        >
                          SZCZEGÓŁY
                          <ChevronRight className="ml-2 w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="border-[#2a2a2a] text-white"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Poprzednia
                </Button>
                <span className="text-[#9ca3af]">
                  Strona {page} / {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="border-[#2a2a2a] text-white"
                >
                  Następna
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}