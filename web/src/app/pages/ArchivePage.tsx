/**
 * ArchivePage — lista zakończonych / zarchiwizowanych wydarzeń.
 *
 * Cel: przegląd przeszłych sezonów z paginacją i wyszukiwarką (`q`).
 * Wzorce: fetch `/api/events?archive=1&page=&limit=12&q=` przy zmianie `page` / `query`.
 * Auth: publiczna. Theme: `--race-accent`, `font-display`.
 * Docker/nginx: deep link `/archiwum` → SPA try_files.
 *
 * Pomysł (alt): TanStack Query; filtry sezon/kategoria; Next.js ISR archiwum SEO.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { MapPin, ChevronRight, ChevronLeft, Search } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Reveal } from "../components/Reveal";
import { api, ApiError } from "../lib/api";
import type { ApiEvent, PaginatedEvents } from "../lib/types";
import { eventImage, eventStatusLabel, HERO_BG_RACE, IMAGE_WIDTH_CARD } from "../lib/types";

export function ArchivePage() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [data, setData] = useState<PaginatedEvents | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    const params = new URLSearchParams({
      archive: "1",
      page: String(page),
      limit: "12",
    });
    if (debouncedQuery) params.set("q", debouncedQuery);
    api
      .get<PaginatedEvents>(`/api/events?${params.toString()}`)
      .then((res) => {
        setData(res);
        setLoadError(null);
      })
      .catch((e) => {
        setData(null);
        setLoadError(e instanceof ApiError ? e.message : "Nie udało się pobrać archiwum. Sprawdź API / połączenie.");
      })
      .finally(() => setLoading(false));
  }, [page, debouncedQuery]);

  const items = data?.items ?? [];

  return (
    <div className="min-h-screen">
      <section
        className="relative py-20 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(18, 18, 18, 0.85), rgba(18, 18, 18, 0.9)), url('${HERO_BG_RACE}')`,
        }}
      >
        <div className="container mx-auto px-4">
          <Reveal>
            <h1 className="font-display text-white mb-3" style={{ fontSize: "48px", fontWeight: 800 }}>
              ARCHIWUM <span className="text-[var(--race-accent)]">WYDARZEŃ</span>
            </h1>
            <p className="text-[#9ca3af] max-w-2xl" style={{ fontSize: "18px" }}>
              Zakończone wyścigi i wydarzenia z poprzednich sezonów.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 space-y-6">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--race-muted)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj w archiwum (nazwa, kategoria, tor, miasto…)"
            className="pl-10 bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)]"
          />
        </div>

        {loading ? (
          <p className="text-center text-[var(--race-muted)] py-16">Ładowanie archiwum...</p>
        ) : loadError ? (
          <p className="text-center text-red-400 py-16">{loadError}</p>
        ) : items.length === 0 ? (
          <p className="text-center text-[var(--race-muted)] py-16">
            {debouncedQuery ? "Brak wydarzeń pasujących do wyszukiwania." : "Brak zarchiwizowanych wydarzeń."}
          </p>
        ) : (
          <>
            {items.map((event: ApiEvent, index: number) => (
              <Reveal key={event.id} delay={Math.min(index * 90, 360)}>
              <Card className="event-card-lift bg-[var(--race-card)] border-[var(--race-border)] overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-0">
                    <div className="h-48 md:h-full min-h-[180px]">
                      <ImageWithFallback
                        src={eventImage(event, IMAGE_WIDTH_CARD)}
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge className="bg-[var(--race-accent)] text-[var(--race-on-accent)]" style={{ fontWeight: 700 }}>
                          {event.category}
                        </Badge>
                        <Badge variant="outline" className="border-[var(--race-border)] text-[var(--race-fg)]">
                          {eventStatusLabel(event.status)}
                        </Badge>
                        <span className="text-[var(--race-muted)]" style={{ fontSize: "14px" }}>
                          {event.dateLabel}
                        </span>
                      </div>
                      <h2 className="font-display text-[var(--race-fg)] mb-2" style={{ fontSize: "24px", fontWeight: 800 }}>
                        {event.name}
                      </h2>
                      <div className="flex items-center gap-2 text-[var(--race-muted)] mb-4">
                        <MapPin className="w-4 h-4" />
                        {event.track}, {event.city}
                      </div>
                      <p className="text-[var(--race-muted)] mb-4 line-clamp-2">{event.description}</p>
                      <Link to={`/wydarzenia/${event.id}`}>
                        <Button
                          variant="outline"
                          className="border-[var(--race-accent)] text-[var(--race-accent)] hover:bg-[var(--race-accent)] hover:text-[var(--race-on-accent)]"
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
              </Reveal>
            ))}

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="border-[var(--race-border)] text-[var(--race-fg)]"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Poprzednia
                </Button>
                <span className="text-[var(--race-muted)]">
                  Strona {page} / {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="border-[var(--race-border)] text-[var(--race-fg)]"
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
