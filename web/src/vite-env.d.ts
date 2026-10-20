/**
 * Typy środowiska Vite (`import.meta.env`) + deklaracja `canvas-confetti`.
 *
 * VITE_API_URL — baza HTTP dla `lib/api.ts` (puste = same-origin / proxy Vite).
 * VITE_GOOGLE_CLIENT_ID — Google Identity Services (opcjonalne; bez niego brak przycisku).
 *
 * Prefiks VITE_ jest wymagany przez Vite, żeby zmienna trafiła do bundla klienta.
 * Pomysł (alt): runtime config.json zamiast build-time env.
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Minimalne typy dla confetti (logout w RootLayout) — pakiet bez pełnych @types. */
declare module "canvas-confetti" {
  interface Options {
    particleCount?: number;
    spread?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
  }
  export default function confetti(options?: Options): void;
}
