/**
 * Punkt wejścia Vite + React 18.
 *
 * `createRoot` montuje `<App />` w `#root` (index.html).
 * StrictMode: podwójne efekty w dev (wykrywanie side-effectów).
 * Leaflet CSS: import w EventsMapView / LocationMapPicker (lazy z trasą mapy).
 * Style: `styles/index.css` → fonts + Tailwind v4 + theme (--race-accent, Oxanium).
 *
 * Produkcja (Docker nginx): build Vite → static files; SPA fallback na index.html
 * dla deep linków React Router (`/wydarzenia/:id` itd.).
 *
 * Pomysł (alt): React 19 / RSC; SSR (Remix) zamiast czystego CSR.
 */

import "./boot/criticalAssets";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import { CinematicIntro } from "./app/components/CinematicIntro";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <>
    {/* Poza StrictMode: intro ma jedną sekwencję, bez drugiego startu w dev. */}
    <CinematicIntro />
    <StrictMode>
      <App />
    </StrictMode>
  </>,
);

/** PWA: manifest + SW po `load` — poza critical request chain Lighthouse. */
window.addEventListener("load", () => {
  if (!document.querySelector('link[rel="manifest"]')) {
    const manifest = document.createElement("link");
    manifest.rel = "manifest";
    manifest.href = "/manifest.webmanifest";
    document.head.appendChild(manifest);
  }
  if (import.meta.env.PROD && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* ignore — brak SW nie blokuje SPA */
    });
  }
});
