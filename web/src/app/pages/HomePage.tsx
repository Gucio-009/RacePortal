/**
 * HomePage – landing RACEPORTAL (hero + teaser wydarzeń + sekcja O nas).
 *
 * Cel: pierwsza strona dla gości – CTA rejestracja / kalendarz, podgląd 6 wydarzeń.
 * Wzorce: fetch on mount `/api/events?limit=6`, React Router Link, pełnoekranowy hero.
 * Auth: publiczna (bez JWT). Theme: `--race-accent`, `font-display` (Oxanium) w hero.
 * Docker/nginx: `/` to index.html; kotwica `#o-nas` działa client-side.
 *
 * Pomysł (alt): Next.js App Router RSC + ISR listy; CMS hero; Framer Motion;
 * A/B CTA w edge config.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Calendar, MapPin, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { PaidEventBadge } from "../components/PaidEventBadge";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../lib/api";
import { deferUntilIdle } from "../lib/deferUntilIdle";
import type { ApiEvent } from "../lib/types";
import { eventImage, HERO_BG_TRACK } from "../lib/types";

export function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Teaser poniżej foldu – po idle, żeby nie konkurował z LCP (hero img).
  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    return deferUntilIdle(() => {
      api
        .get<{ items: ApiEvent[] }>("/api/events?limit=6")
        .then((res) => {
          setUpcomingEvents(res.items ?? []);
          setLoadError(null);
        })
        .catch((e) => {
          setUpcomingEvents([]);
          setLoadError(
            e instanceof ApiError ? e.message : "Nie udało się pobrać wydarzeń. Sprawdź API / połączenie.",
          );
        })
        .finally(() => setLoading(false));
    }, 2500);
  }, []);

  return (
    <div className="min-h-full">
      <section className="relative min-h-[70svh] sm:min-h-[600px] flex items-center justify-center overflow-hidden">
        {/*
          LCP: prawdziwy <img> (nie CSS background) + preload w index.html.
          loading=eager / fetchPriority=high – bez lazy.
        */}
        <img
          src={HERO_BG_TRACK}
          alt=""
          width={1280}
          height={720}
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[rgba(18,18,18,0.7)]" aria-hidden />
        <div className="container mx-auto px-4 text-center z-10 py-16 sm:py-20">
          <h1 className="font-display mb-4 sm:mb-6 tracking-wider text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.15]">
            DOŁĄCZ DO <span className="text-[var(--race-accent)]">WYŚCIGU</span>
          </h1>
          <p className="mb-6 sm:mb-8 text-[#9ca3af] max-w-2xl mx-auto text-base sm:text-lg md:text-xl font-medium leading-relaxed px-1">
            Twoje centrum motoryzacyjnych emocji. Śledź najważniejsze polskie wydarzenia wyścigowe, sprawdzaj
            wyniki i bądź częścią społeczności RACEPORTAL.
          </p>
          {/* min-h: stała wysokość CTA zanim /me rozstrzygnie auth (bez skoku „Zarejestruj”) */}
          <div className="flex gap-3 sm:gap-4 justify-center flex-col sm:flex-row items-stretch sm:items-center max-w-md sm:max-w-none mx-auto min-h-[7.5rem] sm:min-h-[3.75rem]">
            {!authLoading && !isAuthenticated && (
              <Link to="/register" className="w-full sm:w-auto">
                <Button
                  className="w-full h-14 sm:h-14 bg-[var(--race-accent)] text-[#121212] hover:brightness-95 px-8 py-0 text-base sm:text-lg font-extrabold leading-none"
                >
                  ZAREJESTRUJ SIĘ
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
            )}
            <Link to="/wydarzenia" className="w-full sm:w-auto sm:hidden">
              <Button
                variant="outline"
                className="w-full h-14 border-[var(--race-accent)] text-[var(--race-accent)] hover:bg-[var(--race-accent)] hover:text-[#121212] px-8 py-0 text-base font-extrabold leading-none"
              >
                KALENDARZ
              </Button>
            </Link>
            <a href="#o-nas" className="w-full sm:w-auto hidden sm:block">
              <Button
                variant="outline"
                className="w-full h-14 sm:h-14 border-[var(--race-accent)] text-[var(--race-accent)] hover:bg-[var(--race-accent)] hover:text-[#121212] px-8 py-0 text-base sm:text-lg font-extrabold leading-none"
              >
                POZNAJ WIĘCEJ
              </Button>
            </a>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-t from-[#121212] to-transparent" />
      </section>

      <section className="container mx-auto px-4 py-10 sm:py-16">
        <div className="flex items-end justify-between mb-6 sm:mb-12 gap-4">
          <div className="min-w-0">
            <h2 className="font-display mb-1 sm:mb-2 text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight">
              NADCHODZĄCE <span className="text-[var(--race-accent)]">WYDARZENIA</span>
            </h2>
            <p className="text-[#9ca3af] text-sm sm:text-lg">
              Nie przegap najgorętszych polskich wyścigów sezonu
            </p>
          </div>
          <Link to="/wydarzenia" className="shrink-0">
            <Button variant="ghost" className="text-[var(--race-accent)] hover:bg-[#2a2a2a] px-2 sm:px-4 font-bold">
              <span className="hidden sm:inline">ZOBACZ WSZYSTKIE</span>
              <span className="sm:hidden">Wszystkie</span>
              <ChevronRight className="ml-1 sm:ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            aria-busy="true"
            aria-label="Ładowanie wydarzeń"
          >
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden"
              >
                <div className="h-48 bg-[#2a2a2a] animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-4 w-24 bg-[#2a2a2a] rounded animate-pulse" />
                  <div className="h-6 w-3/4 max-w-[12rem] bg-[#2a2a2a] rounded animate-pulse" />
                  <div className="h-4 w-1/2 max-w-[8rem] bg-[#2a2a2a] rounded animate-pulse" />
                  <div className="h-10 w-full bg-[#2a2a2a] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <p className="text-center text-red-400 py-12 min-h-[20rem]">{loadError}</p>
        ) : upcomingEvents.length === 0 ? (
          <p className="text-center text-[#9ca3af] py-12 min-h-[20rem]">Brak nadchodzących wydarzeń.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <Card
                key={event.id}
                className={`bg-[#1a1a1a] overflow-hidden hover:border-[var(--race-accent)] transition-all duration-300 group ${
                  event.paid ? "border-[color-mix(in_srgb,var(--race-accent)_55%,transparent)]" : "border-[#2a2a2a]"
                }`}
              >
                <div className="relative h-48 overflow-hidden">
                  <ImageWithFallback
                    src={eventImage(event, 960)}
                    alt={event.name}
                    width={960}
                    height={384}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <PaidEventBadge event={event} variant="overlay" />
                  <div
                    className="absolute top-4 right-4 bg-[var(--race-accent)] text-[#121212] px-3 py-1 rounded"
                    style={{ fontWeight: 700 }}
                  >
                    {event.category}
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-[var(--race-accent)] mb-3">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span style={{ fontSize: "14px", fontWeight: 700 }}>{event.dateLabel}</span>
                  </div>
                  <h3 className="font-display mb-2 text-white leading-snug" style={{ fontSize: "20px", fontWeight: 700 }}>
                    {event.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[#9ca3af] mb-4">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span style={{ fontSize: "14px" }}>{event.track}</span>
                  </div>
                  <Link to={`/wydarzenia/${event.id}`}>
                    <Button
                      className="w-full bg-transparent border border-[var(--race-accent)] text-[var(--race-accent)] hover:bg-[var(--race-accent)] hover:text-[#121212]"
                      style={{ fontWeight: 700 }}
                    >
                      SPRAWDŹ SZCZEGÓŁY
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section id="o-nas" className="bg-[#1a1a1a] py-12 sm:py-16 mt-8 sm:mt-16 scroll-mt-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12 max-w-3xl mx-auto">
            <h2 className="text-white mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl font-extrabold">
              {/* Oxanium „O” wygląda jak zero – łącznik w Montserrat, brand w display */}
              <span className="font-sans tracking-wide">O </span>
              <span className="font-display text-[var(--race-accent)]">RACEPORTAL</span>
            </h2>
            <p className="text-[#9ca3af] text-sm sm:text-lg">
              Łączymy kierowców, kibiców i organizatorów. Kalendarz wydarzeń, wyniki na żywo i galeria z torów –
              wszystko w jednym miejscu.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-8 text-center">
            <div>
              <div className="font-display text-[var(--race-accent)] mb-1 sm:mb-2 text-2xl sm:text-4xl md:text-5xl font-extrabold">
                250+
              </div>
              <p className="text-[#9ca3af] text-[10px] sm:text-lg font-semibold leading-tight">
                WYŚCIGÓW ROCZNIE
              </p>
            </div>
            <div>
              <div className="font-display text-[var(--race-accent)] mb-1 sm:mb-2 text-2xl sm:text-4xl md:text-5xl font-extrabold">
                50K+
              </div>
              <p className="text-[#9ca3af] text-[10px] sm:text-lg font-semibold leading-tight">
                AKTYWNYCH UŻYTKOWNIKÓW
              </p>
            </div>
            <div>
              <div className="font-display text-[var(--race-accent)] mb-1 sm:mb-2 text-2xl sm:text-4xl md:text-5xl font-extrabold">
                24/7
              </div>
              <p className="text-[#9ca3af] text-[10px] sm:text-lg font-semibold leading-tight">
                LIVE COVERAGE
              </p>
            </div>
          </div>
          <div className="text-center mt-10">
            <Link to="/wydarzenia">
              <Button className="bg-[var(--race-accent)] text-[#121212] hover:brightness-95 px-8" style={{ fontWeight: 800 }}>
                PRZEJDŹ DO KALENDARZA
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
