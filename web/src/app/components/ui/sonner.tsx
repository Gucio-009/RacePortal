/**
 * Sonner — toast notifications shadcn/ui (biblioteka sonner + next-themes).
 * Wygenerowany / wzorowany na shadcn; Toaster renderuje powiadomienia toast.
 * Pomysł (alt): react-hot-toast, Radix Toast albo własny system powiadomień.
 */

"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
