/**
 * EventDetailPage — szczegóły wydarzenia + zgłoszenie + mapa/trasa.
 *
 * Cel: opis wydarzenia, status, wpisowe; zalogowany user może wysłać Registration
 * z wybranym autem z garażu (partitionCarsForEvent — proponowane vs pozostałe).
 * Wzorce: useParams(`id`), fetch `/api/events/:id`, geolocation + POST `/api/maps/route`,
 * EventsMapView z polyline trasy.
 * Auth: publiczny odczyt; zapis wymaga JWT (`raceportal_token`); redirect do `/login`.
 * Deep link `/wydarzenia/:id` — krytyczne dla nginx SPA (try_files → index.html).
 * Theme: `--race-accent`, `font-display`.
 *
 * Pomysł (alt): TanStack Query; Google Directions zamiast własnego /api/maps/route;
 * Next.js generateStaticParams dla SEO; optimistic registration.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Calendar, MapPin, Clock, Flag, ChevronLeft, Navigation, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { PaidEventBadge } from "../components/PaidEventBadge";
import { EventsMapView } from "../components/EventsMapView";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../lib/api";
import type { ApiEvent, Car, RouteResult } from "../lib/types";
import { eventImage, eventStatusLabel, formatEntryFee } from "../lib/types";
import { formatCarLabel, partitionCarsForEvent } from "../lib/carMatch";
import { toast } from "sonner";

export function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [cars, setCars] = useState<Car[]>([]);
  const [carId, setCarId] = useState<string>("none");
  const [note, setNote] = useState("");
  const [registering, setRegistering] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [route, setRoute] = useState<RouteResult | null>(null);

  // Fetch szczegółów po zmianie :id (deep link / nawigacja).
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<ApiEvent>(`/api/events/${id}`)
      .then(setEvent)
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .get<Car[]>("/api/garage")
      .then(setCars)
      .catch(() => setCars([]));
  }, [isAuthenticated]);

  // Podział aut: dopasowane do kategorii wydarzenia vs reszta garażu.
  const { recommended, other } = useMemo(
    () => partitionCarsForEvent(cars, event?.category ?? ""),
    [cars, event?.category],
  );

  useEffect(() => {
    setCarId("none");
  }, [event?.id]);

  // Domyślnie pierwsze proponowane auto.
  useEffect(() => {
    if (carId !== "none") return;
    if (recommended.length > 0) {
      setCarId(recommended[0].id);
    }
  }, [recommended, carId]);

  const handleRegister = async () => {
    if (!isAuthenticated) {
      toast.info("Zaloguj się, aby zapisać się na wydarzenie");
      navigate("/login");
      return;
    }
    if (!event) return;

    setRegistering(true);
    try {
      await api.post("/api/registrations", {
        eventId: event.id,
        carId: carId !== "none" ? carId : undefined,
        note: note.trim() || undefined,
      });
      toast.success(`Zgłoszenie na ${event.name} wysłane`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Nie udało się wysłać zgłoszenia");
    } finally {
      setRegistering(false);
    }
  };

  /** Geolokalizacja przeglądarki → backend wylicza trasę (polyline + dystans). */
  const handleRoute = () => {
    if (!event?.lat || !event?.lng) {
      toast.error("Brak współrzędnych wydarzenia");
      return;
    }
    if (!navigator.geolocation) {
      toast.error("Geolokalizacja niedostępna");
      return;
    }

    setRouteLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const result = await api.post<RouteResult>("/api/maps/route", {
            fromLat: pos.coords.latitude,
            fromLng: pos.coords.longitude,
            toLat: event.lat,
            toLng: event.lng,
          });
          setRoute(result);
          toast.success(`Trasa: ${result.distanceText}, ${result.durationText}`);
        } catch (e) {
          toast.error(e instanceof ApiError ? e.message : "Nie udało się wytyczyć trasy");
        } finally {
          setRouteLoading(false);
        }
      },
      () => {
        toast.error("Nie udało się ustalić Twojej lokalizacji");
        setRouteLoading(false);
      },
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 text-center text-[#9ca3af]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[var(--race-accent)]" />
        Ładowanie wydarzenia...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-white mb-4" style={{ fontSize: "32px", fontWeight: 800 }}>
          Nie znaleziono wydarzenia
        </h1>
        <Link to="/wydarzenia">
          <Button className="bg-[var(--race-accent)] text-[#121212] hover:brightness-95">Wróć do kalendarza</Button>
        </Link>
      </div>
    );
  }

  // Marker na mapie tylko gdy wydarzenie ma lat/lng.
  const mapMarkers =
    event.lat != null && event.lng != null
      ? [{ id: event.id, lat: event.lat, lng: event.lng, title: event.name, subtitle: event.track }]
      : [];

  return (
    <div className="min-h-screen pb-16">
      <div className="relative h-[360px]">
        <ImageWithFallback src={eventImage(event)} alt={event.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 pb-8">
          <Link to="/wydarzenia" className="inline-flex items-center text-[var(--race-accent)] mb-4 hover:underline" style={{ fontWeight: 600 }}>
            <ChevronLeft className="w-4 h-4" />
            Wróć do kalendarza
          </Link>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge className="bg-[var(--race-accent)] text-[#121212]" style={{ fontWeight: 700 }}>
              {event.category}
            </Badge>
            <Badge variant="outline" className="border-[#2a2a2a] text-white">
              {eventStatusLabel(event.status)}
            </Badge>
            <PaidEventBadge event={event} />
          </div>
          <h1 className="font-display text-white" style={{ fontSize: "40px", fontWeight: 800 }}>
            {event.name}
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <h2 className="font-display text-white mb-4" style={{ fontSize: "24px", fontWeight: 800 }}>
              Opis
            </h2>
            <p className="text-[#9ca3af] leading-relaxed" style={{ fontSize: "16px" }}>
              {event.description}
            </p>
          </div>

          {mapMarkers.length > 0 && (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-white" style={{ fontSize: "24px", fontWeight: 800 }}>
                  Mapa
                </h2>
                <Button
                  onClick={handleRoute}
                  disabled={routeLoading}
                  variant="outline"
                  className="border-[var(--race-accent)] text-[var(--race-accent)] hover:bg-[var(--race-accent)] hover:text-[#121212]"
                  style={{ fontWeight: 700 }}
                >
                  {routeLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4 mr-2" />
                  )}
                  Trasa do mnie
                </Button>
              </div>
              {route && (
                <p className="text-[var(--race-accent)]" style={{ fontWeight: 600 }}>
                  {route.distanceText} · {route.durationText}
                </p>
              )}
              <EventsMapView markers={mapMarkers} polyline={route?.polyline} height="360px" />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3 text-white">
              <Calendar className="w-5 h-5 text-[var(--race-accent)]" />
              <span style={{ fontWeight: 600 }}>{event.dateLabel}</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <Clock className="w-5 h-5 text-[var(--race-accent)]" />
              <span style={{ fontWeight: 600 }}>Start: {event.time}</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <MapPin className="w-5 h-5 text-[var(--race-accent)]" />
              <span style={{ fontWeight: 600 }}>
                {event.track}, {event.city}
              </span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <Flag className="w-5 h-5 text-[var(--race-accent)]" />
              <span style={{ fontWeight: 600 }}>{event.voivodeship}</span>
            </div>

            {event.paid && (
              <div className="rounded-md border border-[var(--race-accent)]/40 bg-[var(--race-accent)]/10 p-3 space-y-1">
                <PaidEventBadge event={event} />
                <p className="text-sm text-[#9ca3af]">
                  Wpisowe:{" "}
                  <span className="text-[var(--race-accent)]" style={{ fontWeight: 700 }}>
                    {formatEntryFee(event.entryFee) ?? "do ustalenia"}
                  </span>
                </p>
                {event.bankAccount && (
                  <p className="text-xs text-[#9ca3af]">
                    Po akceptacji wpłać na: <span className="text-white">{event.bankAccount}</span>
                  </p>
                )}
              </div>
            )}

            {isAuthenticated && event.status === "APPROVED" && (
              <>
                <div className="space-y-2 pt-2 border-t border-[#2a2a2a]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label className="text-white">Auto z garażu</Label>
                    <span className="text-xs text-[#9ca3af]">
                      {recommended.length > 0 ? (
                        <>
                          Dopasowane do{" "}
                          <span className="text-[var(--race-accent)]" style={{ fontWeight: 700 }}>
                            {event.category}
                          </span>
                          :{" "}
                          <span className="text-white" style={{ fontWeight: 700 }}>
                            {recommended.length}
                          </span>
                          {cars.length > recommended.length
                            ? ` / ${cars.length} w garażu`
                            : ""}
                        </>
                      ) : cars.length > 0 ? (
                        <>
                          Brak aut klasy{" "}
                          <span className="text-[var(--race-accent)]">{event.category}</span> — masz {cars.length} w
                          garażu
                        </>
                      ) : (
                        "Brak aut w garażu"
                      )}
                    </span>
                  </div>
                  <Select value={carId} onValueChange={setCarId}>
                    <SelectTrigger className="bg-[#121212] border-[#2a2a2a] text-white">
                      <SelectValue placeholder="Wybierz auto" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                      <SelectItem value="none">Bez auta</SelectItem>
                      {recommended.length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="text-[var(--race-accent)]">
                            Proponowane / zalecane ({event.category})
                          </SelectLabel>
                          {recommended.map((car) => (
                            <SelectItem key={car.id} value={car.id}>
                              {formatCarLabel(car, true)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                      {recommended.length > 0 && other.length > 0 && <SelectSeparator />}
                      {other.length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="text-[#9ca3af]">Pozostałe auta</SelectLabel>
                          {other.map((car) => (
                            <SelectItem key={car.id} value={car.id}>
                              {formatCarLabel(car)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                    </SelectContent>
                  </Select>
                  {cars.length === 0 && (
                    <Link to="/garaz" className="text-[var(--race-accent)] text-sm hover:underline">
                      Dodaj auto w garażu
                    </Link>
                  )}
                  {cars.length > 0 && recommended.length === 0 && (
                    <p className="text-xs text-amber-400/90">
                      Żadne auto nie ma kategorii „{event.category}”. Możesz wybrać inne albo dodać
                      właściwe w{" "}
                      <Link to="/garaz" className="text-[var(--race-accent)] underline">
                        garażu
                      </Link>
                      .
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Notatka (opcjonalnie)</Label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Dodatkowe informacje..."
                    className="bg-[#121212] border-[#2a2a2a] text-white"
                    rows={3}
                  />
                </div>
              </>
            )}

            <Button
              onClick={handleRegister}
              disabled={registering || event.status !== "APPROVED"}
              className="w-full bg-[var(--race-accent)] text-[#121212] hover:brightness-95 h-12 mt-2"
              style={{ fontWeight: 800 }}
            >
              {registering
                ? "WYSYŁANIE..."
                : isAuthenticated
                  ? event.status === "APPROVED"
                    ? "ZAPISZ SIĘ"
                    : "ZAPISY NIEDOSTĘPNE"
                  : "ZALOGUJ I ZAPISZ SIĘ"}
            </Button>
            {!isAuthenticated && (
              <Link to="/login" className="block">
                <Button variant="outline" className="w-full border-[#2a2a2a] text-white hover:bg-[#2a2a2a]">
                  Przejdź do logowania
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
