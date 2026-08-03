import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { api, ApiError } from "../lib/api";
import type { ApiEvent } from "../lib/types";
import { eventImage } from "../lib/types";

interface GalleryItem {
  id: string;
  image: string;
  title: string;
  event: string;
  date: string;
  category: string;
}

export function GalleryPage() {
  const [category, setCategory] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const toItems = (events: ApiEvent[]): GalleryItem[] =>
      events
        .filter((e) => e.imageUrl)
        .map((e) => ({
          id: e.id,
          image: eventImage(e),
          title: e.track,
          event: e.name,
          date: new Date(e.date).getFullYear().toString(),
          category: e.category,
        }));

    setLoading(true);
    setLoadError(null);
    Promise.all([
      api.get<{ items: ApiEvent[] }>("/api/events?limit=50"),
      api.get<{ items: ApiEvent[] }>("/api/events?archive=1&limit=50"),
    ])
      .then(([upcoming, archived]) => {
        const fromApi = [...toItems(upcoming.items), ...toItems(archived.items)];
        const unique = Array.from(new Map(fromApi.map((i) => [i.id, i])).values());
        setItems(unique);
        setLoadError(null);
      })
      .catch((e) => {
        setItems([]);
        setLoadError(e instanceof ApiError ? e.message : "Nie udało się pobrać galerii. Sprawdź API / połączenie.");
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(items.map((item) => item.category)))],
    [items],
  );

  const filtered = items.filter((item) => category === "all" || item.category === category);
  const selected = items.find((item) => item.id === selectedId) ?? null;

  return (
    <div className="min-h-screen">
      <section className="bg-[#1a1a1a] border-b border-[#2a2a2a] py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h1 className="font-['Orbitron'] text-white mb-3" style={{ fontSize: "40px", fontWeight: 900 }}>
              GALERIA <span className="text-[var(--race-accent)]">(ODŁOŻONA)</span>
            </h1>
            <p className="text-[#9ca3af] max-w-2xl">
              Zgodnie z uwagami przeglądu — rozwój galerii odłożony. Poniżej prosty podgląd zdjęć z wydarzeń.
            </p>
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full md:w-56 bg-[#121212] border-[#2a2a2a] text-white h-12">
              <SelectValue placeholder="Kategoria" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat === "all" ? "Wszystkie" : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        {loading ? (
          <p className="text-center text-[#9ca3af] py-16">Ładowanie galerii...</p>
        ) : loadError ? (
          <p className="text-center text-red-400 py-16">{loadError}</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-[#9ca3af] py-16">Brak zdjęć z wydarzeń (galeria odłożona — podgląd z API).</p>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-[#2a2a2a] hover:border-[var(--race-accent)] transition-all text-left"
            >
              <ImageWithFallback
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <Badge className="bg-[var(--race-accent)] text-[#121212] mb-2" style={{ fontWeight: 700 }}>
                  {item.category}
                </Badge>
                <p className="text-white" style={{ fontWeight: 700 }}>
                  {item.title}
                </p>
              </div>
            </button>
          ))}
        </div>
        )}
      </section>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="bg-[#0A0A0A] border-[#2a2a2a] text-white max-w-3xl p-0 overflow-hidden">
          {selected && (
            <>
              <div className="aspect-video w-full">
                <ImageWithFallback src={selected.image} alt={selected.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <DialogHeader>
                  <DialogTitle className="font-['Orbitron'] text-white" style={{ fontSize: "24px", fontWeight: 800 }}>
                    {selected.title}
                  </DialogTitle>
                </DialogHeader>
                <p className="text-[#9ca3af] mt-2">
                  {selected.event} · {selected.date}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
