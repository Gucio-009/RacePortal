/**
 * PaidEventBadge — widoczny marker „Płatne” (+ opcjonalna kwota wpisowego).
 *
 * Renderuje się tylko gdy `event.paid === true`.
 * Warianty: `overlay` (absolutnie na zdjęciu karty) vs `inline` (w tekście szczegółów).
 * Kolor z `--race-accent` (gradient złoty) — spójny z motywem RacePortal.
 *
 * Pomysł (alt): osobny badge „Wymaga przelewu” gdy status ACCEPTED bez proof.
 */

import { Banknote } from "lucide-react";
import type { ApiEvent } from "../lib/types";
import { formatEntryFee } from "../lib/types";

type Props = {
  event: Pick<ApiEvent, "paid" | "entryFee">;
  /** Overlay na zdjęciu (karty listy) vs badge inline w treści */
  variant?: "overlay" | "inline";
  className?: string;
};

/** Widoczny marker „Płatne” z opcjonalną kwotą wpisowego. */
export function PaidEventBadge({ event, variant = "inline", className = "" }: Props) {
  if (!event.paid) return null;

  const fee = formatEntryFee(event.entryFee);
  const label = fee ? `Płatne · ${fee}` : "Płatne";

  if (variant === "overlay") {
    return (
      <div
        className={`absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded px-3 py-1 shadow-lg ${className}`}
        style={{
          fontWeight: 800,
          fontSize: "12px",
          letterSpacing: "0.04em",
          background: "linear-gradient(135deg, var(--race-accent) 0%, #f5a623 100%)",
          color: "#121212",
        }}
      >
        <Banknote className="w-3.5 h-3.5" />
        {label.toUpperCase()}
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 ${className}`}
      style={{
        fontWeight: 800,
        fontSize: "12px",
        background: "linear-gradient(135deg, var(--race-accent) 0%, #f5a623 100%)",
        color: "#121212",
      }}
    >
      <Banknote className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}
