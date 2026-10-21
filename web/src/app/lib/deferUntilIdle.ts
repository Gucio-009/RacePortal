/**
 * Odrocza pracę poza krytyczną ścieżkę LCP (requestIdleCallback + timeout).
 * Bez ric: setTimeout — po pierwszym paintcie.
 */
export function deferUntilIdle(fn: () => void, timeoutMs = 2500): () => void {
  if (typeof window === "undefined") {
    fn();
    return () => {};
  }

  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(() => fn(), { timeout: timeoutMs });
    return () => window.cancelIdleCallback(id);
  }

  const t = window.setTimeout(fn, Math.min(400, timeoutMs));
  return () => window.clearTimeout(t);
}
