/**
 * utils — helper cn() łączący clsx + tailwind-merge.
 * Używany w komponentach shadcn/ui do bezpiecznego łączenia klas Tailwind.
 * Pomysł (alt): classnames, cn z shadcn/cli albo ręczne łączenie stringów.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
