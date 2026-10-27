/**
 * HomePage – landing RACEPORTAL (hero + teaser wydarzeń + sekcja O nas).
 *
 * Cel: pierwsza strona dla gości – CTA rejestracja / kalendarz, podgląd 6 wydarzeń.
 * Wzorce: fetch on mount `/api/events?limit=6`, React Router Link, pełnoekranowy hero.
 * Auth: publiczna (bez JWT). Theme: tokeny `--race-*` (domyślnie czarno-złoty);
 * Arctic White tylko nadpisuje CSS – ten sam układ co Złoty tor.
 * Docker/nginx: `/` to index.html; kotwica `#o-nas` działa client-side.
 *
 * Pomysł (alt): Next.js App Router RSC + ISR listy; CMS hero; Framer Motion;
 * A/B CTA w edge config.
 */
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Calendar, MapPin, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { PaidEventBadge } from "../components/PaidEventBadge";
import { Reveal } from "../components/Reveal";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../lib/api";
import { deferUntilIdle } from "../lib/deferUntilIdle";
import type { ApiEvent, PublicStats } from "../lib/types";
import { eventImage, HERO_BG_TRACK } from "../lib/types";

const STATS_POLL_MS = 30_000;

export function HomePage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  const loadPublicStats = useCallback(async (silent = false) => {
    if (!silent) setStatsLoading(true);
    try {
      const res = await api.get<PublicStats>("/api/stats");
      if (typeof res.registeredUsers === "number" && Number.isFinite(res.registeredUsers)) {
        setRegisteredUsers(res.registeredUsers);
        setStatsError(false);
      } else {
        setStatsError(true);
      }
    } catch {
      setStatsError(true);
      // Nie zeruj poprzedniej poprawnej wartości przy błędzie odświeżenia.
    } finally {
      setStatsLoading(false);
    }
  }, []);

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
            e instanceof ApiError ? e.message : t("home.loadFail"),
          );
        })
        .finally(() => setLoading(false));
    }, 2500);
  }, [t]);

  useEffect(() => {
    void loadPublicStats(false);
    const id = window.setInterval(() => void loadPublicStats(true), STATS_POLL_MS);
    const onFocus = () => void loadPublicStats(true);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadPublicStats]);

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
        <div className="home-hero-overlay absolute inset-0" aria-hidden />
        <div className="container mx-auto px-4 text-center z-10 py-16 sm:py-20">
          <Reveal>
            <h1 className="font-display mb-4 sm:mb-6 tracking-wider text-[var(--race-hero-fg)] text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.15]">
              {t("home.heroTitleBefore")}{" "}
              <span className="text-[var(--race-accent)]">{t("home.heroTitleAccent")}</span>
            </h1>
          </Reveal>
          <Reveal delay={80}>
            <p className="mb-6 sm:mb-8 text-[var(--race-hero-muted)] max-w-2xl mx-auto text-base sm:text-lg md:text-xl font-medium leading-relaxed px-1">
              {t("home.heroSubtitle")}
            </p>
          </Reveal>
          {/* min-h: stała wysokość CTA zanim /me rozstrzygnie auth (bez skoku „Zarejestruj”) */}
          <Reveal delay={140}>
            <div className="flex gap-3 sm:gap-4 justify-center flex-col sm:flex-row items-stretch sm:items-center max-w-md sm:max-w-none mx-auto min-h-[7.5rem] sm:min-h-[3.75rem]">
              {!authLoading && !isAuthenticated && (
                <Link to="/register" className="w-full sm:w-auto">
                  <Button className="w-full h-14 sm:h-14 bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95 px-8 py-0 text-base sm:text-lg font-extrabold leading-none">
                    {t("home.ctaRegister")}
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </Link>
              )}
              <Link to="/wydarzenia" className="w-full sm:w-auto sm:hidden">
                <Button
                  variant="outline"
                  className="home-hero-cta-secondary w-full h-14 border-[var(--race-accent)] text-[var(--race-accent)] hover:bg-[var(--race-accent)] hover:text-[var(--race-on-accent)] px-8 py-0 text-base font-extrabold leading-none"
                >
                  {t("home.ctaCalendar")}
                </Button>
              </Link>
              <a href="#o-nas" className="w-full sm:w-auto hidden sm:block">
                <Button
                  variant="outline"
                  className="home-hero-cta-secondary w-full h-14 sm:h-14 border-[var(--race-accent)] text-[var(--race-accent)] hover:bg-[var(--race-accent)] hover:text-[var(--race-on-accent)] px-8 py-0 text-base sm:text-lg font-extrabold leading-none"
                >
                  {t("home.ctaMore")}
                </Button>
              </a>
            </div>
          </Reveal>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-t from-[var(--race-bg)] to-transparent" />
      </section>

      <section className="container mx-auto px-4 py-10 sm:py-16">
        <Reveal className="flex items-end justify-between mb-6 sm:mb-12 gap-4">
          <div className="min-w-0">
            <h2 className="font-display mb-1 sm:mb-2 text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight text-[var(--race-fg)]">
              {t("home.upcomingBefore")}{" "}
              <span className="text-[var(--race-accent)]">{t("home.upcomingAccent")}</span>
            </h2>
            <p className="text-[var(--race-muted)] text-sm sm:text-lg">
              {t("home.upcomingSubtitle")}
            </p>
          </div>
          <Link to="/wydarzenia" className="shrink-0">
            <Button variant="ghost" className="text-[var(--race-accent)] hover:bg-[var(--race-hover)] px-2 sm:px-4 font-bold">
              <span className="hidden sm:inline">{t("home.seeAll")}</span>
              <span className="sm:hidden">{t("home.seeAllShort")}</span>
              <ChevronRight className="ml-1 sm:ml-2 w-5 h-5" />
            </Button>
          </Link>
        </Reveal>

        {loading ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            aria-busy="true"
            aria-label={t("home.loadingEvents")}
          >
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="bg-[var(--race-card)] border border-[var(--race-border)] rounded-lg overflow-hidden shadow-[var(--race-card-shadow)]"
              >
                <div className="h-48 bg-[var(--race-muted-bg)] animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-4 w-24 bg-[var(--race-muted-bg)] rounded animate-pulse" />
                  <div className="h-6 w-3/4 max-w-[12rem] bg-[var(--race-muted-bg)] rounded animate-pulse" />
                  <div className="h-4 w-1/2 max-w-[8rem] bg-[var(--race-muted-bg)] rounded animate-pulse" />
                  <div className="h-10 w-full bg-[var(--race-muted-bg)] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <p className="text-center text-red-400 py-12 min-h-[20rem]">{loadError}</p>
        ) : upcomingEvents.length === 0 ? (
          <p className="text-center text-[var(--race-muted)] py-12 min-h-[20rem]">Brak nadchodzących wydarzeń.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {upcomingEvents.map((event, index) => (
              <Reveal key={event.id} delay={Math.min(index * 120, 480)} className="h-full">
                <Card
                  className={`event-card-lift h-full gap-0 bg-[var(--race-card)] overflow-hidden hover:border-[var(--race-accent)] group ${
                    event.paid
                      ? "border-[color-mix(in_srgb,var(--race-accent)_55%,transparent)]"
                      : "border-[var(--race-border)]"
                  }`}
                >
                  <div className="relative h-48 shrink-0 overflow-hidden">
                    <ImageWithFallback
                      src={eventImage(event, 960)}
                      alt={event.name}
                      width={960}
                      height={384}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <PaidEventBadge event={event} variant="overlay" />
                    <div
                      className="absolute top-4 right-4 bg-[var(--race-accent)] text-[var(--race-on-accent)] px-3 py-1 rounded"
                      style={{ fontWeight: 700 }}
                    >
                      {event.category}
                    </div>
                  </div>
                  <CardContent className="p-6 flex flex-1 flex-col min-h-0">
                    <div className="flex items-center gap-2 text-[var(--race-accent)] mb-3 min-h-[1.25rem]">
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span className="truncate text-sm font-bold">{event.dateLabel}</span>
                    </div>
                    <h3 className="font-display mb-2 text-[var(--race-fg)] text-xl font-bold leading-snug line-clamp-2 min-h-[2.5rem]">
                      {event.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[var(--race-muted)] mb-4 min-h-[1.25rem]">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="truncate text-sm">{event.track}</span>
                    </div>
                    <Link to={`/wydarzenia/${event.id}`} className="mt-auto block">
                      <Button
                        className="w-full bg-transparent border border-[var(--race-accent)] text-[var(--race-accent)] hover:bg-[var(--race-accent)] hover:text-[var(--race-on-accent)]"
                        style={{ fontWeight: 700 }}
                      >
                        {t("home.checkDetails")}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section id="o-nas" className="bg-[var(--race-card)] py-12 sm:py-16 mt-8 sm:mt-16 scroll-mt-24">
        <div className="container mx-auto px-4">
          <Reveal className="text-center mb-8 sm:mb-12 max-w-3xl mx-auto">
            <h2 className="text-[var(--race-fg)] mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl font-extrabold">
              {/* Oxanium „O” wygląda jak zero – łącznik w Montserrat, brand w display */}
              <span className="font-sans tracking-wide">O </span>
              <span className="font-display text-[var(--race-accent)]">RACEPORTAL</span>
            </h2>
            <p className="text-[var(--race-muted)] text-sm sm:text-lg">
              Łączymy kierowców, kibiców i organizatorów. Kalendarz wydarzeń, wyniki na żywo i galeria z torów –
              wszystko w jednym miejscu.
            </p>
          </Reveal>
          <Reveal delay={100} className="flex justify-center text-center">
            <div className="min-w-[10rem] max-w-sm">
              {statsLoading && registeredUsers == null ? (
                <div className="space-y-3" aria-busy="true" aria-label={t("home.loadingUserCount")}>
                  <div className="mx-auto h-10 sm:h-14 w-24 sm:w-32 rounded bg-[var(--race-muted-bg)] animate-pulse" />
                  <div className="mx-auto h-4 w-48 rounded bg-[var(--race-muted-bg)] animate-pulse" />
                </div>
              ) : registeredUsers != null ? (
                <>
                  <div className="font-display text-[var(--race-accent)] mb-1 sm:mb-2 text-3xl sm:text-4xl md:text-5xl font-extrabold tabular-nums">
                    {registeredUsers.toLocaleString(i18n.language === "en" ? "en-GB" : "pl-PL")}
                  </div>
                  <p className="text-[var(--race-muted)] text-xs sm:text-lg font-semibold leading-tight">
                    ZAREJESTROWANYCH UŻYTKOWNIKÓW
                  </p>
                </>
              ) : statsError ? (
                <p className="text-[var(--race-muted)] text-sm sm:text-base">
                  {t("home.statsFail")}
                </p>
              ) : null}
            </div>
          </Reveal>
          <Reveal delay={200} className="text-center mt-10">
            <Link to="/wydarzenia">
              <Button
                className="bg-[var(--race-accent)] text-[var(--race-on-accent)] hover:brightness-95 px-8"
                style={{ fontWeight: 800 }}
              >
                PRZEJDŹ DO KALENDARZA
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
