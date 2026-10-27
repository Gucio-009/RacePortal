/**
 * Cinematic intro RacePortal — raz na sesję karty (`sessionStorage`).
 *
 * Pełna sekwencja nie czeka na API i nie przedłuża bootu: aplikacja renderuje
 * się pod spodem, a intro schodzi, gdy skończy się krótka choreografia.
 * Odświeżenie, nawigacja i login nie odtwarzają sekwencji.
 * Gdy sesja jest już oznaczona, a `/api/auth/me` jeszcze trwa — cienki pasek.
 *
 * Animacja: CSS (transform, opacity). Biblioteka `motion` nie jest używana
 * w aplikacji; dociąganie jej tylko do intra zwiększyłoby bundle.
 */

import { Component, useCallback, useEffect, useLayoutEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { loadSettings } from "../lib/userSettings";
import "../../styles/cinematic-intro.css";

const INTRO_SEEN_KEY = "raceportal_intro_seen";
const INTRO_DONE = "raceportal-intro-done";

/** Czas choreografii, nie sztuczne czekanie na dane. */
const SEQUENCE_MS = 1500;
const COMPLETE_MS = 260;
const EXIT_MS = 700;
const FAILSAFE_MS = 5000;

const REDUCED_SEQUENCE_MS = 320;
const REDUCED_EXIT_MS = 200;

let introActive = false;

function motionReduced(): boolean {
  try {
    if (loadSettings().pitStopMode) return true;
  } catch {
    /* storage niedostępny — zostaw pełny ruch */
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Zwraca true tylko przy pierwszym odczycie w tej sesji. */
function claimIntro(): boolean {
  try {
    if (sessionStorage.getItem(INTRO_SEEN_KEY) === "1") return false;
    sessionStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    return false;
  }
  introActive = true;
  return true;
}

function releaseIntro() {
  if (!introActive) return;
  introActive = false;
  window.dispatchEvent(new Event(INTRO_DONE));
}

function Letters({ word, from, accent }: { word: string; from: number; accent?: boolean }) {
  return (
    <span className={accent ? "cinematic-intro__portal" : "cinematic-intro__race"}>
      {word.split("").map((char, index) => {
        const i = from + index;
        return (
          <span
            key={`${char}-${i}`}
            className="cinematic-intro__letter"
            style={{ "--i": i, "--spread": `${(i - 4.5) * 14}px` } as CSSProperties}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
}

function Sequence({ reduced, onDone }: { reduced: boolean; onDone: () => void }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<"play" | "complete" | "exit" | "done">("play");

  useEffect(() => {
    const sequence = reduced ? REDUCED_SEQUENCE_MS : SEQUENCE_MS;
    const complete = reduced ? 0 : COMPLETE_MS;
    const exit = reduced ? REDUCED_EXIT_MS : EXIT_MS;
    const failsafe = reduced ? 1400 : FAILSAFE_MS;
    let cancelled = false;
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => {
      timers.push(
        window.setTimeout(() => {
          if (!cancelled) fn();
        }, ms),
      );
    };

    at(sequence, () => setPhase("complete"));
    at(sequence + complete, () => setPhase("exit"));
    at(sequence + complete + exit, () => setPhase("done"));
    at(failsafe, () => setPhase("done"));

    return () => {
      cancelled = true;
      for (const id of timers) window.clearTimeout(id);
    };
  }, [reduced]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    const prevPad = body.style.paddingRight;
    const gap = window.innerWidth - html.clientWidth;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      body.style.paddingRight = prevPad;
    };
  }, []);

  useEffect(() => {
    if (phase === "done") onDone();
  }, [phase, onDone]);

  useEffect(() => () => releaseIntro(), []);

  useLayoutEffect(() => {
    document.documentElement.classList.remove("intro-cover");
  }, []);

  if (phase === "done") return null;

  const className = [
    "cinematic-intro",
    reduced ? "is-reduced" : "",
    phase === "complete" || phase === "exit" ? "is-complete" : "",
    phase === "exit" ? "is-exit" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} role="status" aria-live="polite" aria-busy={phase === "play"}>
      <span className="sr-only">{t("intro.loading")}</span>
      <div className="cinematic-intro__half cinematic-intro__half--left" aria-hidden="true" />
      <div className="cinematic-intro__half cinematic-intro__half--right" aria-hidden="true" />
      <div className="cinematic-intro__stage" aria-hidden="true">
      <div className="cinematic-intro__wash" />
      <div className="cinematic-intro__vignette" aria-hidden="true" />
      <svg className="cinematic-intro__track-art" viewBox="0 0 1200 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path d="M-40 430 C 200 300, 380 520, 680 360 S 1040 210, 1280 300" />
        <path d="M-40 470 C 220 350, 400 560, 700 400 S 1060 250, 1280 340" />
        <path d="M80 560 C 260 480, 520 600, 860 470" />
      </svg>
      <div className="cinematic-intro__sweep" aria-hidden="true" />
      <div className="cinematic-intro__telemetry cinematic-intro__telemetry--tl" aria-hidden="true">
        <span>RP-01</span>
        <span>GRID</span>
      </div>
      <div className="cinematic-intro__telemetry cinematic-intro__telemetry--br" aria-hidden="true">
        <span>SECTOR</span>
        <span>START</span>
      </div>
      <div className="cinematic-intro__scene" aria-hidden="true">
        <div className="cinematic-intro__brand-wrap">
          <div className="cinematic-intro__startline" />
          <div className="cinematic-intro__brand">
            <Letters word="RACE" from={0} />
            <Letters word="PORTAL" from={4} accent />
          </div>
        </div>
        <p className="cinematic-intro__tagline">TWOJE CENTRUM MOTORSPORTU</p>
        <div className="cinematic-intro__progress">
          <div className="cinematic-intro__lights">
            {Array.from({ length: 5 }, (_, n) => (
              <span key={n} className="cinematic-intro__light" style={{ "--n": n } as CSSProperties} />
            ))}
          </div>
          <div className="cinematic-intro__track">
            <div className="cinematic-intro__shimmer" />
            <div className="cinematic-intro__done" />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

class IntroBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch() {
    releaseIntro();
    document.documentElement.classList.remove("intro-cover");
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

/** Pełne intro. Montowane poza StrictMode, żeby sekwencja nie startowała drugi raz. */
export function CinematicIntro() {
  const [play] = useState(claimIntro);
  const [reduced] = useState(motionReduced);
  const [finished, setFinished] = useState(false);
  const finish = useCallback(() => setFinished(true), []);
  useLayoutEffect(() => {
    if (!play) document.documentElement.classList.remove("intro-cover");
  }, [play]);
  if (!play || finished) return null;
  return (
    <IntroBoundary>
      <Sequence reduced={reduced} onDone={finish} />
    </IntroBoundary>
  );
}

/**
 * Dyskretny pasek, gdy sesja widziała już intro, a bootstrap sesji jeszcze trwa.
 * Bez tokena auth rozwiązuje się od razu — pasek się nie pojawia.
 */
export function BootPulse() {
  const { t } = useTranslation();
  const { isLoading } = useAuth();
  const [blocked, setBlocked] = useState(introActive);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!introActive) return;
    const onDone = () => setBlocked(false);
    window.addEventListener(INTRO_DONE, onDone);
    return () => window.removeEventListener(INTRO_DONE, onDone);
  }, []);

  useEffect(() => {
    if (blocked || !isLoading) {
      setVisible(false);
      return;
    }
    const id = window.setTimeout(() => setVisible(true), 200);
    return () => window.clearTimeout(id);
  }, [blocked, isLoading]);

  if (!visible) return null;

  return (
    <div className="cinematic-boot" role="status" aria-live="polite">
      <span className="sr-only">{t("intro.loadingData")}</span>
      <div className="cinematic-boot__bar" aria-hidden="true" />
    </div>
  );
}
