/**
 * EventDetailPage – szczegóły wydarzenia + zgłoszenie + mapa/trasa.
 *
 * Cel: opis wydarzenia, status, wpisowe; zalogowany user może wysłać Registration
 * z wybranym autem z garażu (partitionCarsForEvent – proponowane vs pozostałe).
 * Wzorce: useParams(`id`), fetch `/api/events/:id`, geolocation + POST `/api/maps/route`,
 * EventsMapView z polyline trasy.
 * Auth: publiczny odczyt; zapis wymaga JWT (`raceportal_token`); redirect do `/login`.
 * Deep link `/wydarzenia/:id` – krytyczne dla nginx SPA (try_files → index.html).
 * Theme: `--race-accent`, `font-display`.
 *
 * Pomysł (alt): TanStack Query; Google Directions zamiast własnego /api/maps/route;
 * Next.js generateStaticParams dla SEO; optimistic registration.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Calendar, MapPin, Clock, Flag, ChevronLeft, Navigation, Loader2, ShieldCheck, User } from "lucide-react";
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
import { Reveal } from "../components/Reveal";
import { EventsMapView } from "../components/EventsMapView";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../lib/api";
import type { ApiEvent, Car, Registration, RouteResult } from "../lib/types";
import {
  eventImage,
  eventStatusLabel,
  formatEntryFee,
  IMAGE_WIDTH_DETAIL,
  isOpenRegistration,
} from "../lib/types";
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
  const [myRegistration, setMyRegistration] = useState<Registration | null>(null);
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

  // Aktywne zgłoszenie na to wydarzenie → przycisk „Wypisz się”.
  useEffect(() => {
    if (!isAuthenticated || !id) {
      setMyRegistration(null);
      return;
    }
    api
      .get<Registration[]>("/api/registrations/mine")
      .then((regs) => {
        const active = regs.find(
          (r) => r.eventId === id && isOpenRegistration(r.status),
        );
        setMyRegistration(active ?? null);
      })
      .catch(() => setMyRegistration(null));
  }, [isAuthenticated, id]);

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
    if (myRegistration) return;

    setRegistering(true);
    try {
      const created = await api.post<Registration>("/api/registrations", {
        eventId: event.id,
        carId: carId !== "none" ? carId : undefined,
        note: note.trim() || undefined,
      });
      setMyRegistration(created);
      toast.success(`Zgłoszenie na ${event.name} wysłane`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Nie udało się wysłać zgłoszenia");
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async () => {
    if (!myRegistration) return;
    if (!window.confirm("Na pewno wypisać się z tego wydarzenia?")) return;
    setRegistering(true);
    try {
      await api.post(`/api/registrations/${myRegistration.id}/cancel`);
      setMyRegistration(null);
      toast.success("Wypisano z wydarzenia");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Nie udało się wypisać");
    } finally {
      setRegistering(false);
    }
  };

  /** Od Twojej lokalizacji → do eventu (polyline + dystans). */
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
          toast.success(`Trasa do eventu: ${result.distanceText}, ${result.durationText}`);
        } catch (e) {
          toast.error(e instanceof ApiError ? e.message : "Nie udało się wytyczyć trasy");
        } finally {
          setRouteLoading(false);
        }
      },
      () => {
        toast.error("Nie udało się ustalić Twojej lokalizacji (punkt startowy trasy)");
        setRouteLoading(false);
      },
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 text-center text-[var(--race-muted)]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[var(--race-accent)]" />
        Ładowanie wydarzenia...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-[var(--race-fg)] mb-4" style={{ fontSize: "32px", fontWeight: 800 }}>
          Nie znaleziono wydarzenia
        </h1>
        <Link to="/wydarzenia">
          <Button className="bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95">Wróć do kalendarza</Button>
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
        <ImageWithFallback
          src={eventImage(event, IMAGE_WIDTH_DETAIL)}
          alt={event.name}
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--race-bg)] via-[var(--race-bg)]/70 to-transparent" />
        <Reveal className="absolute bottom-0 left-0 right-0 container mx-auto px-4 pb-8">
          <Link to="/wydarzenia" className="inline-flex items-center text-[var(--race-accent)] mb-4 hover:underline" style={{ fontWeight: 600 }}>
            <ChevronLeft className="w-4 h-4" />
            Wróć do kalendarza
          </Link>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge className="bg-[var(--race-accent)] text-[var(--race-on-accent)]" style={{ fontWeight: 700 }}>
              {event.category}
            </Badge>
            <Badge variant="outline" className="border-white/40 text-white">
              {eventStatusLabel(event.status)}
            </Badge>
            <PaidEventBadge event={event} />
          </div>
          <h1 className="font-display text-white" style={{ fontSize: "40px", fontWeight: 800 }}>
            {event.name}
          </h1>
          {event.status === "REJECTED" && event.rejectionReason && (
            <p className="mt-3 text-red-300 text-sm max-w-3xl whitespace-pre-wrap">
              Powód odrzucenia: {event.rejectionReason}
            </p>
          )}
        </Reveal>
      </div>

      <div className="container mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Reveal delay={80}>
          <div className="bg-[var(--race-card)] border border-[var(--race-border)] rounded-lg p-6 shadow-[var(--race-card-shadow)]">
            <h2 className="font-display text-[var(--race-fg)] mb-4" style={{ fontSize: "24px", fontWeight: 800 }}>
              Opis
            </h2>
            <p className="text-[var(--race-muted)] leading-relaxed" style={{ fontSize: "16px" }}>
              {event.description}
            </p>
          </div>
          </Reveal>

          {mapMarkers.length > 0 && (
            <div className="bg-[var(--race-card)] border border-[var(--race-border)] rounded-lg p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-[var(--race-fg)]" style={{ fontSize: "24px", fontWeight: 800 }}>
                  Mapa
                </h2>
                <Button
                  onClick={handleRoute}
                  disabled={routeLoading}
                  variant="outline"
                  className="border-[var(--race-accent)] text-[var(--race-accent)] hover:bg-[var(--race-accent)] hover:text-[var(--race-on-accent)]"
                  style={{ fontWeight: 700 }}
                >
                  {routeLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4 mr-2" />
                  )}
                  Trasa do eventu
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
          <div className="bg-[var(--race-card)] border border-[var(--race-border)] rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3 text-[var(--race-fg)]">
              <Calendar className="w-5 h-5 text-[var(--race-accent)]" />
              <span style={{ fontWeight: 600 }}>{event.dateLabel}</span>
            </div>
            <div className="flex items-center gap-3 text-[var(--race-fg)]">
              <Clock className="w-5 h-5 text-[var(--race-accent)]" />
              <span style={{ fontWeight: 600 }}>Start: {event.time}</span>
            </div>
            <div className="flex items-center gap-3 text-[var(--race-fg)]">
              <MapPin className="w-5 h-5 text-[var(--race-accent)]" />
              <span style={{ fontWeight: 600 }}>
                {event.track}, {event.city}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[var(--race-fg)]">
              <Flag className="w-5 h-5 text-[var(--race-accent)]" />
              <span style={{ fontWeight: 600 }}>{event.voivodeship}</span>
            </div>
            {event.organizer?.username ? (
              <div className="flex flex-wrap items-center gap-2 text-[var(--race-fg)]">
                <User className="w-5 h-5 text-[var(--race-accent)] shrink-0" />
                <span style={{ fontWeight: 600 }}>{event.organizer.username}</span>
                {event.organizer.verified ? (
                  <Badge
                    className="bg-[var(--race-accent)]/15 text-[var(--race-accent)] border border-[var(--race-accent)]/40"
                    style={{ fontWeight: 700 }}
                  >
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Zweryfikowany organizator
                  </Badge>
                ) : null}
              </div>
            ) : null}

            {event.paid && (
              <div className="rounded-md border border-[var(--race-accent)]/40 bg-[var(--race-accent)]/10 p-3 space-y-1">
                <PaidEventBadge event={event} />
                <p className="text-sm text-[var(--race-muted)]">
                  Wpisowe:{" "}
                  <span className="text-[var(--race-accent)]" style={{ fontWeight: 700 }}>
                    {formatEntryFee(event.entryFee) ?? "do ustalenia"}
                  </span>
                </p>
                {event.bankAccount && (
                  <p className="text-xs text-[var(--race-muted)]">
                    Po akceptacji wpłać na: <span className="text-[var(--race-fg)]">{event.bankAccount}</span>
                  </p>
                )}
              </div>
            )}

            {isAuthenticated && event.status === "APPROVED" && !myRegistration && (
              <>
                <div className="space-y-2 pt-2 border-t border-[var(--race-border)]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label className="text-[var(--race-fg)]">Auto z garażu</Label>
                    <span className="text-xs text-[var(--race-muted)]">
                      {recommended.length > 0 ? (
                        <>
                          Dopasowane do{" "}
                          <span className="text-[var(--race-accent)]" style={{ fontWeight: 700 }}>
                            {event.category}
                          </span>
                          :{" "}
                          <span className="text-[var(--race-fg)]" style={{ fontWeight: 700 }}>
                            {recommended.length}
                          </span>
                          {cars.length > recommended.length
                            ? ` / ${cars.length} w garażu`
                            : ""}
                        </>
                      ) : cars.length > 0 ? (
                        <>
                          Brak aut klasy{" "}
                          <span className="text-[var(--race-accent)]">{event.category}</span> – masz {cars.length} w
                          garażu
                        </>
                      ) : (
                        "Brak aut w garażu"
                      )}
                    </span>
                  </div>
                  <Select value={carId} onValueChange={setCarId}>
                    <SelectTrigger className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]">
                      <SelectValue placeholder="Wybierz auto" />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--race-card)] border-[var(--race-border)] text-[var(--race-fg)]">
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
                          <SelectLabel className="text-[var(--race-muted)]">Pozostałe auta</SelectLabel>
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
                  <Label className="text-[var(--race-fg)]">Notatka (opcjonalnie)</Label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Dodatkowe informacje..."
                    className="bg-[var(--race-bg)] border-[var(--race-border)] text-[var(--race-fg)]"
                    rows={3}
                  />
                </div>
              </>
            )}

            <Button
              onClick={myRegistration ? handleUnregister : handleRegister}
              disabled={
                registering ||
                (event.status !== "APPROVED" && !myRegistration)
              }
              className={
                myRegistration
                  ? "w-full border border-red-700 bg-transparent text-red-400 hover:bg-red-950 h-12 mt-2"
                  : "w-full bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95 h-12 mt-2"
              }
              style={{ fontWeight: 800 }}
            >
              {registering
                ? "WYSYŁANIE..."
                : isAuthenticated
                  ? myRegistration
                    ? "WYPISZ SIĘ"
                    : event.status === "APPROVED"
                      ? "ZAPISZ SIĘ"
                      : "ZAPISY NIEDOSTĘPNE"
                  : "ZALOGUJ I ZAPISZ SIĘ"}
            </Button>
            {myRegistration && (
              <p className="text-xs text-[var(--race-muted)] text-center mt-1">
                Masz aktywne zgłoszenie – nie możesz zapisać się ponownie.
              </p>
            )}
            {!isAuthenticated && (
              <Link to="/login" className="block">
                <Button variant="outline" className="w-full border-[var(--race-border)] text-[var(--race-fg)] hover:bg-[var(--race-hover)]">
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
