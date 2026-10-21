/**
 * Promuje style poza krytyczną ścieżką renderu (LCP).
 *
 * CSS aplikacji (prod): preload → stylesheet od razu (potrzebne do layoutu).
 * Google Fonts: media=all po idle — nie konkurują z hero Unsplash o pasmo.
 */

import { deferUntilIdle } from "../app/lib/deferUntilIdle";

for (const link of document.querySelectorAll<HTMLLinkElement>(
  'link[rel="preload"][as="style"]',
)) {
  link.rel = "stylesheet";
}

deferUntilIdle(() => {
  const googleFonts = document.getElementById("google-fonts");
  if (googleFonts instanceof HTMLLinkElement) {
    googleFonts.media = "all";
  }
}, 3000);
