/**
 * Scroll Reveal – IntersectionObserver na `[data-reveal]` w kontenerze (np. <main>).
 * Progressive enhancement: bez JS elementy zostają widoczne.
 * Już widoczne w viewport → od razu `.reveal-in` (bez migania).
 * Poniżej foldu → `.reveal-ready`, potem `.reveal-in` przy scrollu.
 * Stagger: `data-reveal-delay`. Szanuje prefers-reduced-motion i pit-stop.
 */
import { useEffect, type RefObject } from "react";

function motionReduced(): boolean {
  if (typeof window === "undefined") return true;
  if (document.documentElement.dataset.pitStop === "on") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function inViewport(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  return rect.top < vh * 0.88 && rect.bottom > 32;
}

export function useScrollReveal(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    let observer: IntersectionObserver | null = null;

    const reveal = (el: HTMLElement) => {
      el.classList.add("reveal-in");
      el.classList.remove("reveal-ready");
      observer?.unobserve(el);
    };

    const prepare = (el: HTMLElement, reduce: boolean) => {
      if (el.dataset.revealBound) return;
      el.dataset.revealBound = "1";
      const delay = el.dataset.revealDelay;
      if (delay) el.style.setProperty("--reveal-delay", `${delay}ms`);
      if (reduce || inViewport(el)) {
        el.classList.add("reveal-in");
        return;
      }
      el.classList.add("reveal-ready");
      observer?.observe(el);
    };

    const scan = () => {
      const reduce = motionReduced();
      root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => prepare(el, reduce));
    };

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target as HTMLElement);
        }
      },
      { root: null, rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    );

    scan();

    const mo = new MutationObserver(() => scan());
    mo.observe(root, { childList: true, subtree: true });

    const onMotion = () => {
      if (!motionReduced()) return;
      root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        el.classList.add("reveal-in");
        el.classList.remove("reveal-ready");
      });
    };
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", onMotion);
    const pitObs = new MutationObserver(onMotion);
    pitObs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-pit-stop"],
    });

    return () => {
      observer?.disconnect();
      mo.disconnect();
      pitObs.disconnect();
      mq.removeEventListener("change", onMotion);
    };
  }, [containerRef]);
}
