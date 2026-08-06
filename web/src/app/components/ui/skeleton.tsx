/**
 * Skeleton — placeholder ładowania shadcn/ui (Tailwind).
 * Wygenerowany / wzorowany na shadcn; wariantami steruje class-variance-authority.
 * Pomysł (alt): własny design system albo MUI / Chakra zamiast Radix+CVA.
 */

import { cn } from "./utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
