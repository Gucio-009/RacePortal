/**
 * Walidacja pól profilu (imię, nazwisko, telefon, Instagram) — web.
 * Wspólne reguły UI; backend dodatkowo egzekwuje Bean Validation.
 */

const NAME_RE = /^[\p{L}][\p{L}\s'-]{1,49}$/u;
/** E.164-ish: opcjonalnie +, potem 9–15 cyfr (po usunięciu spacji/myślników). */
const PHONE_DIGITS_RE = /^\+?[0-9\s-]{9,16}$/;

export function validatePersonName(value: string, label: string): string | null {
  const t = value.trim();
  if (!t) return null; // opcjonalne przy edycji konta
  if (t.length < 2 || t.length > 50) return `${label}: 2–50 znaków`;
  if (!NAME_RE.test(t)) return `${label}: tylko litery (dozwolone spacje, -, ')`;
  return null;
}

export function validatePhone(value: string): string | null {
  const t = value.trim();
  if (!t) return null;
  if (!PHONE_DIGITS_RE.test(t)) {
    return "Telefon: nieprawidłowy format (np. +48 600 100 200)";
  }
  const digits = t.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) {
    return "Telefon: podaj 9–15 cyfr (z kierunkowym kraju)";
  }
  return null;
}

export function validateInstagramUrl(value: string): string | null {
  const t = value.trim();
  if (!t) return null;
  let url: URL;
  try {
    url = new URL(t);
  } catch {
    return "Instagram: podaj pełny adres URL (https://…)";
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return "Instagram: użyj http:// lub https://";
  }
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (host !== "instagram.com") {
    return "Instagram: link musi prowadzić do instagram.com";
  }
  return null;
}

export function validateHttpUrl(value: string, label: string): string | null {
  const t = value.trim();
  if (!t) return `${label} jest wymagany`;
  if (t.length > 2000) return `${label}: maksymalnie 2000 znaków`;
  try {
    const url = new URL(t);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return `${label}: użyj http:// lub https://`;
    }
  } catch {
    return `${label}: nieprawidłowy adres URL`;
  }
  return null;
}
