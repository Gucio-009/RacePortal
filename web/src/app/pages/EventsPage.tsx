import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Calendar, MapPin, Search, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { PaidEventBadge } from "../components/PaidEventBadge";
import { api } from "../lib/api";
import type { ApiEvent, PaginatedEvents } from "../lib/types";
import { eventImage } from "../lib/types";

export function EventsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [paidFilter, setPaidFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [data, setData] = useState<PaginatedEvents | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<string[]>("/api/events/meta/categories").then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "12" });
      if (query.trim()) params.set("q", query.trim());
      if (category !== "all") params.set("category", category);
      if (paidFilter !== "all") params.set("paid", paidFilter);

      api
        .get<PaginatedEvents>(`/api/events?${params}`)
        .then(setData)
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query, category, paidFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [query, category, paidFilter]);

  const items = data?.items ?? [];

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
            Wszystkie nadchodzące wyścigi, track daye i festiwale motoryzacyjne w Polsce.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj toru, miasta lub nazwy..."
              className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white h-12"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full md:w-56 bg-[#1a1a1a] border-[#2a2a2a] text-white h-12">
              <SelectValue placeholder="Kategoria" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
              <SelectItem value="all">Wszystkie kategorie</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={paidFilter} onValueChange={setPaidFilter}>
            <SelectTrigger className="w-full md:w-52 bg-[#1a1a1a] border-[#2a2a2a] text-white h-12">
              <SelectValue placeholder="Opłata" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
              <SelectItem value="all">Wszystkie (opłata)</SelectItem>
              <SelectItem value="true">Tylko płatne</SelectItem>
              <SelectItem value="false">Tylko darmowe</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-center text-[#9ca3af] py-16">Ładowanie...</p>
        ) : items.length === 0 ? (
          <p className="text-center text-[#9ca3af] py-16">Brak wydarzeń dla wybranych filtrów.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((event: ApiEvent) => (
                <Card
                  key={event.id}
                  className={`bg-[#1a1a1a] overflow-hidden hover:border-[#FFD700] transition-all ${
                    event.paid ? "border-[#FFD700]/55 shadow-[0_0_0_1px_rgba(255,215,0,0.15)]" : "border-[#2a2a2a]"
                  }`}
                >
                  <div className="relative h-48 overflow-hidden">
                    <ImageWithFallback src={eventImage(event)} alt={event.name} className="w-full h-full object-cover" />
                    <PaidEventBadge event={event} variant="overlay" />
                    <div className="absolute top-4 right-4 bg-[#FFD700] text-[#121212] px-3 py-1 rounded" style={{ fontWeight: 700 }}>
                      {event.category}
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-[#FFD700] mb-3">
                      <Calendar className="w-4 h-4" />
                      <span style={{ fontSize: "14px", fontWeight: 700 }}>{event.dateLabel}</span>
                    </div>
                    <h3 className="font-['Orbitron'] text-white mb-2" style={{ fontSize: "20px", fontWeight: 700 }}>
                      {event.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[#9ca3af] mb-4">
                      <MapPin className="w-4 h-4" />
                      <span style={{ fontSize: "14px" }}>
                        {event.track}, {event.city}
                      </span>
                    </div>
                    <Link to={`/wydarzenia/${event.id}`}>
                      <Button
                        className="w-full bg-transparent border border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-[#121212]"
                        style={{ fontWeight: 700 }}
                      >
                        SPRAWDŹ SZCZEGÓŁY
                        <ChevronRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
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
