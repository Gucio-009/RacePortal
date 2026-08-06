/**
 * AvatarPicker — wybór awatara z galerii presetów albo inicjałów (puste `value`).
 *
 * Presety: `AVATAR_PRESETS` z `@raceportal/api-types` (przez `lib/types`).
 * Zaznaczenie: border + ring w `--race-accent` (zmienny z Ustawień).
 * Puste `value` → awatar z inicjałów (`userInitials`); to domyślny stan profilu.
 *
 * Pomysł (alt): upload własnego pliku (S3/MinIO) zamiast wyłącznie URL-i presetów.
 */

import { AVATAR_PRESETS, userInitials } from "../lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from "./ui/utils";

/** Wybór z kuratorowanej galerii albo powrót do inicjałów (domyślnie). */
export function AvatarPicker({
  value,
  onChange,
  username,
  firstName,
  lastName,
}: {
  value: string;
  onChange: (url: string) => void;
  username?: string;
  firstName?: string;
  lastName?: string;
}) {
  const initials = userInitials({ username, firstName, lastName });
  const isInitials = !value.trim();

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#9ca3af]">
        Domyślnie awatar z inicjałów. Wybierz gotowy styl albo wróć do inicjałów.
      </p>
      <div className="flex flex-wrap gap-3">
        {/* Puste value = inicjały; onChange("") czyści URL awatara po stronie API */}
        <button
          type="button"
          onClick={() => onChange("")}
          className={cn(
            "rounded-full border-2 p-0.5 transition-all",
            isInitials ? "border-[var(--race-accent)] ring-2 ring-[color-mix(in_srgb,var(--race-accent)_40%,transparent)]" : "border-[#2a2a2a] hover:border-[color-mix(in_srgb,var(--race-accent)_60%,transparent)]",
          )}
          title="Inicjały"
          aria-label="Awatar z inicjałów"
        >
          <Avatar className="w-14 h-14">
            <AvatarFallback className="bg-[var(--race-accent)] text-[#121212]" style={{ fontWeight: 800 }}>
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
        {AVATAR_PRESETS.map((preset) => {
          const selected = value === preset.url;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(preset.url)}
              className={cn(
                "rounded-full border-2 p-0.5 transition-all",
                selected ? "border-[var(--race-accent)] ring-2 ring-[color-mix(in_srgb,var(--race-accent)_40%,transparent)]" : "border-[#2a2a2a] hover:border-[color-mix(in_srgb,var(--race-accent)_60%,transparent)]",
              )}
              title={preset.label}
              aria-label={`Awatar ${preset.label}`}
            >
              <Avatar className="w-14 h-14">
                <AvatarImage src={preset.url} alt={preset.label} />
                <AvatarFallback className="bg-[#2a2a2a] text-white text-xs">{preset.label.slice(0, 2)}</AvatarFallback>
              </Avatar>
            </button>
          );
        })}
      </div>
    </div>
  );
}
