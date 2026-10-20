/**
 * AspectRatio — komponent proporcji obrazu shadcn/ui (Radix UI).
 * Wygenerowany / wzorowany na shadcn; wariantami steruje class-variance-authority.
 * Pomysł (alt): własny design system albo MUI / Chakra zamiast Radix+CVA.
 */

"use client";

import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";

function AspectRatio({
  ...props
}: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />;
}

export { AspectRatio };
