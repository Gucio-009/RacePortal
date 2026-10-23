/**
 * Bieżący akcent z `document.documentElement.dataset.accent` (Ustawienia → applyUserSettings).
 * Reaguje na zmianę motywu bez przeładowania strony.
 */
import { useEffect, useState } from "react";
import { loadSettings, type AccentTheme } from "../lib/userSettings";

function readAccent(): AccentTheme {
  const fromDom = document.documentElement.dataset.accent;
  if (fromDom === "gold" || fromDom === "redline" || fromDom === "ice" || fromDom === "arctic") {
    return fromDom;
  }
  return loadSettings().accent;
}

export function useAccent(): AccentTheme {
  const [accent, setAccent] = useState<AccentTheme>(readAccent);

  useEffect(() => {
    setAccent(readAccent());
    const obs = new MutationObserver(() => setAccent(readAccent()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-accent"] });
    return () => obs.disconnect();
  }, []);

  return accent;
}
