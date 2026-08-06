/**
 * Punkt wejścia Vite + React 18.
 *
 * `createRoot` montuje `<App />` w `#root` (index.html).
 * StrictMode: podwójne efekty w dev (wykrywanie side-effectów).
 * Leaflet CSS globalnie — wymagane przez EventsMapView / LocationMapPicker.
 * Style: `styles/index.css` → fonts + Tailwind v4 + theme (--race-accent, Oxanium).
 *
 * Produkcja (Docker nginx): build Vite → static files; SPA fallback na index.html
 * dla deep linków React Router (`/wydarzenia/:id` itd.).
 *
 * Pomysł (alt): React 19 / RSC; SSR (Remix) zamiast czystego CSR.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "leaflet/dist/leaflet.css";
import App from "./app/App";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
