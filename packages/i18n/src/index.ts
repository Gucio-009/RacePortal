/**
 * Wspólne słowniki PL/EN dla web + mobile.
 * Maile systemowe są po stronie Javy (`MailTexts`) — nie tutaj.
 */
import pl from "./pl.json";
import en from "./en.json";

export type Locale = "pl" | "en";

export const LOCALES: Locale[] = ["pl", "en"];

export const defaultLocale: Locale = "pl";

export const messages = { pl, en } as const;

export type Messages = typeof pl;

export function isLocale(value: unknown): value is Locale {
  return value === "pl" || value === "en";
}

export function normalizeLocale(value: unknown): Locale {
  return isLocale(value) ? value : defaultLocale;
}

/** Prosty lookup bez i18next — mobile / skrypty. Wspiera `a.b.c` i `{{var}}`. */
export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const parts = key.split(".");
  let node: unknown = messages[locale];
  for (const part of parts) {
    if (node == null || typeof node !== "object") return key;
    node = (node as Record<string, unknown>)[part];
  }
  if (typeof node !== "string") return key;
  if (!vars) return node;
  return node.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    vars[name] != null ? String(vars[name]) : `{{${name}}}`,
  );
}

export { pl, en };
