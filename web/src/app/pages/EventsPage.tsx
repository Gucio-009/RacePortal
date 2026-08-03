import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Calendar as CalendarIcon, MapPin, Search, ChevronRight, ChevronLeft, List, Map } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { pl } from "date-fns/locale";
import { format, parseISO, isSameDay } from "date-fns";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../components/ui/select";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { PaidEventBadge } from "../components/PaidEventBadge";
import { EventsMapView, eventToMarker } from "../components/EventsMapView";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { ApiEvent, Car, PaginatedEvents } from "../lib/types";
import { eventImage } from "../lib/types";
import { EVENT_CATEGORY_GROUPS } from "../lib/eventCategories";
import { VOIVODESHIPS, TRACK_PRESETS } from "../lib/eventFormPresets";
import "react-day-picker/dist/style.css";

type ViewMode = "list" | "map" | "calendar";

export function EventsPage() {
  const { isAuthenticated } = useAuth();
  const [view, setView] = useState<ViewMode>("list");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [paidFilter, setPaidFilter] = useState("all");
  const [voivodeship, setVoivodeship] = useState("all");
  const [city, setCity] = useState("");
  const [track, setTrack] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [carId, setCarId] = useState("all");
  const [cars, setCars] = useState<Car[]>([]);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedEvents | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();

  useEffect(() => {
    if (!isAuthenticated) {
      setCars([]);
      return;
    }
    api.get<Car[]>("/api/garage").then(setCars).catch(() => setCars([]));
  }, [isAuthenticated]);

  const limit = view === "list" ? 12 : 50;

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (query.trim()) params.set("q", query.trim());
      if (category !== "all") params.set("category", category);
      if (paidFilter !== "all") params.set("paid", paidFilter);
      if (voivodeship !== "all") params.set("voivodeship", voivodeship);
      if (city.trim()) params.set("city", city.trim());
      if (track !== "all") params.set("track", track);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (carId !== "all") params.set("carId", carId);

      api
        .get<PaginatedEvents>(`/api/events?${params}`)
        .then(setData)
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query, category, paidFilter, voivodeship, city, track, dateFrom, dateTo, carId, page, limit, view]);

  useEffect(() => {
    setPage(1);
  }, [query, category, paidFilter, voivodeship, city, track, dateFrom, dateTo, carId, view]);

  const items = data?.items ?? [];
  const markers = useMemo(
    () => items.map(eventToMarker).filter((m): m is NonNullable<typeof m> => m !== null),
    [items],
  );

  const eventDates = useMemo(() => {
    return items
      .map((e) => {
        try {
          return parseISO(e.date.slice(0, 10));
        } catch {
          return null;
        }
      })
      .filter((d): d is Date => d !== null);
  }, [items]);

  const dayEvents = useMemo(() => {
    if (!selectedDay) return [];
    return items.filter((e) => {
      try {
        return isSameDay(parseISO(e.date.slice(0, 10)), selectedDay);
      } catch {
        return false;
      }
    });
  }, [items, selectedDay]);

  const cities = useMemo(
    () => Array.from(new Set(TRACK_PRESETS.map((t) => t.city))).sort((a, b) => a.localeCompare(b, "pl")),
    [],
  );

  return (
    <div className="min-h-screen">
      <section
        className="relative py-20 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(18, 18, 18, 0.85), rgba(18, 18, 18, 0.9)), url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920')`,
        }}
      >
        <div className="container mx-auto px-4">
          <h1 className="font-['Orbitron'] text-white mb-3" style={{ fontSize: "48px", fontWeight: 900 }}>
            KALENDARZ <span className="text-[#FFD700]">WYDARZEŃ</span>
          </h1>
          <p className="text-[#9ca3af] max-w-2xl" style={{ fontSize: "18px" }}>
            Lista, mapa i kalendarz — wspólne filtry dla każdego widoku.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="flex flex-wrap gap-2 mb-6">
          {(
            [
              { id: "list" as const, label: "Lista", icon: List },
              { id: "map" as const, label: "Mapa", icon: Map },
              { id: "calendar" as const, label: "Kalendarz", icon: CalendarIcon },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              type="button"
              variant="outline"
              onClick={() => setView(id)}
              className={
                view === id
                  ? "border-[#FFD700] bg-[#FFD700]/15 text-[#FFD700]"
                  : "border-[#2a2a2a] text-white"
              }
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj toru, miasta lub nazwy..."
              className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white h-11"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-11">
              <SelectValue placeholder="Kategoria" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white max-h-72">
              <SelectItem value="all">Wszystkie kategorie</SelectItem>
              {EVENT_CATEGORY_GROUPS.map((g) => (
                <SelectGroup key={g.group}>
                  <SelectLabel className="text-[#FFD700]">{g.group}</SelectLabel>
                  {g.items.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <Select value={paidFilter} onValueChange={setPaidFilter}>
            <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-11">
              <SelectValue placeholder="Płatność" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
              <SelectItem value="all">Wszystkie</SelectItem>
              <SelectItem value="true">Płatne</SelectItem>
              <SelectItem value="false">Darmowe</SelectItem>
            </SelectContent>
          </Select>
          <Select value={voivodeship} onValueChange={setVoivodeship}>
            <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-11">
              <SelectValue placeholder="Województwo" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white max-h-72">
              <SelectItem value="all">Wszystkie województwa</SelectItem>
              {VOIVODESHIPS.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={track} onValueChange={setTrack}>
            <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-11">
              <SelectValue placeholder="Tor" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white max-h-72">
              <SelectItem value="all">Wszystkie tory</SelectItem>
              {TRACK_PRESETS.map((t) => (
                <SelectItem key={t.track} value={t.track}>
                  {t.track}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={city || "all"} onValueChange={(v) => setCity(v === "all" ? "" : v)}>
            <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-11">
              <SelectValue placeholder="Miasto" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white max-h-72">
              <SelectItem value="all">Wszystkie miasta</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="space-y-1">
            <Label className="text-xs text-[#9ca3af]">Od daty</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-11" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-[#9ca3af]">Do daty</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-11" />
          </div>
          {isAuthenticated && (
            <Select value={carId} onValueChange={setCarId}>
              <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-11 lg:col-span-2">
                <SelectValue placeholder="Dopasuj do auta" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                <SelectItem value="all">Bez filtra garażu</SelectItem>
                {cars.map((car) => (
                  <SelectItem key={car.id} value={car.id}>
                    {car.make} {car.model}
                    {car.className ? ` · ${car.className}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {loading ? (
          <p className="text-center text-[#9ca3af] py-16">Ładowanie wydarzeń...</p>
        ) : view === "map" ? (
          markers.length === 0 ? (
            <p className="text-center text-[#9ca3af] py-16">Brak wydarzeń z GPS dla wybranych filtrów.</p>
          ) : (
            <EventsMapView markers={markers} height="560px" />
          )
        ) : view === "calendar" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 text-white rdp-dark">
              <DayPicker
                mode="single"
                locale={pl}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                selected={selectedDay}
                onSelect={setSelectedDay}
                modifiers={{ hasEvent: eventDates }}
                modifiersClassNames={{ hasEvent: "rdp-has-event" }}
                className="mx-auto"
              />
              <style>{`
                .rdp-has-event:not([disabled]) { background: rgba(255,215,0,0.25); border-radius: 6px; color: #FFD700; font-weight: 700; }
                .rdp { --rdp-accent-color: #FFD700; --rdp-background-color: #1a1a1a; color: #fff; }
              `}</style>
            </div>
            <div className="space-y-3">
              <h3 className="text-white font-['Orbitron']" style={{ fontWeight: 800 }}>
                {selectedDay ? format(selectedDay, "d MMMM yyyy", { locale: pl }) : "Wybierz dzień"}
              </h3>
              {!selectedDay ? (
                <p className="text-[#9ca3af]">Dni ze złotym tłem mają wydarzenia.</p>
              ) : dayEvents.length === 0 ? (
                <p className="text-[#9ca3af]">Brak wydarzeń w tym dniu (dla filtrów).</p>
              ) : (
                dayEvents.map((event) => (
                  <Link key={event.id} to={`/wydarzenia/${event.id}`} className="block border border-[#2a2a2a] rounded-md p-4 hover:border-[#FFD700]">
                    <p className="text-white" style={{ fontWeight: 700 }}>{event.name}</p>
                    <p className="text-[#9ca3af] text-sm">{event.category} · {event.track} · {event.time}</p>
                  </Link>
                ))
              )}
            </div>
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-[#9ca3af] py-16">Brak wydarzeń dla wybranych filtrów.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((event) => (
                <Link key={event.id} to={`/wydarzenia/${event.id}`}>
                  <Card
                    className={`bg-[#1a1a1a] overflow-hidden hover:border-[#FFD700] transition-all duration-300 group h-full ${
                      event.paid ? "border-[#FFD700]/55 shadow-[0_0_0_1px_rgba(255,215,0,0.15)]" : "border-[#2a2a2a]"
                    }`}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <ImageWithFallback
                        src={eventImage(event)}
                        alt={event.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <PaidEventBadge event={event} variant="overlay" />
                      <div className="absolute top-4 right-4 bg-[#FFD700] text-[#121212] px-3 py-1 rounded" style={{ fontWeight: 700 }}>
                        {event.category}
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 text-[#FFD700] mb-2 text-sm">
                        <CalendarIcon className="w-4 h-4" />
                        {event.dateLabel || event.date}
                      </div>
                      <h3 className="text-white mb-2 font-['Orbitron'] group-hover:text-[#FFD700]" style={{ fontWeight: 700 }}>
                        {event.name}
                      </h3>
                      <div className="flex items-center gap-2 text-[#9ca3af] text-sm mb-4">
                        <MapPin className="w-4 h-4" />
                        {event.track}, {event.city}
                      </div>
                      <div className="flex items-center text-[#FFD700] text-sm" style={{ fontWeight: 700 }}>
                        Szczegóły <ChevronRight className="w-4 h-4 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-10">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="border-[#2a2a2a] text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-[#9ca3af]">
                  {page} / {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="border-[#2a2a2a] text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
