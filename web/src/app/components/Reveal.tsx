/**
 * Reveal — wrapper Scroll Reveal (`data-reveal` + opcjonalny delay do staggeru).
 * Obserwowany przez useScrollReveal w RootLayout.
 */
import type { CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "./ui/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Opóźnienie startu animacji (ms) – stagger kart. */
  delay?: number;
  as?: ElementType;
  style?: CSSProperties;
};

export function Reveal({ children, className, delay, as: Tag = "div", style }: RevealProps) {
  return (
    <Tag
      data-reveal=""
      data-reveal-delay={delay != null ? String(delay) : undefined}
      className={cn(className)}
      style={style}
    >
      {children}
    </Tag>
  );
}
