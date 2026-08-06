/**
 * ResultsPage — alias / stub wyników na obecną implementację ArchivePage.
 *
 * Cel (user-facing): trasa „wyniki” w nawigacji ma dokąd iść; na razie wyniki
 * nie mają osobnego modelu — pokazujemy archiwum zakończonych wydarzeń.
 * Wzorce: re-export `ArchivePage` + cienki wrapper `ResultsPage` → ten sam UI.
 * Auth: jak Archive (publiczne). Theme/Docker: dziedziczone z ArchivePage
 * (deep link `/wyniki` wymaga nginx SPA try_files).
 *
 * Pomysł (alt): osobne `/api/results` z klasyfikacją, podium, PDF timing;
 * TanStack Table; Next.js SSR pod SEO wyników sezonu.
 */
import { ArchivePage } from "./ArchivePage";

export { ArchivePage };

/** Wrapper: routing „wyniki” renderuje archiwum do czasu dedykowanej strony. */
export function ResultsPage() {
  return <ArchivePage />;
}
