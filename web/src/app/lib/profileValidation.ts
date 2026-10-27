/**
 * Walidacja pól profilu (imię, nazwisko, telefon, Instagram) — web.
 * Komunikaty przez i18next (aktualny język UI).
 */
import i18n from "../i18n";

/** Synchronizacja z AuthDtos.STRONG_PASSWORD_REGEXP (rejestracja / zmiana hasła). */
export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export function strongPasswordHint(): string {
  return i18n.t("validation.strongPassword");
}

/** @deprecated prefer strongPasswordHint() — zostawione dla starych importów. */
export const STRONG_PASSWORD_HINT =
  "Min. 8 znaków, wielka litera, cyfra i znak specjalny";

const NAME_RE = /^[\p{L}][\p{L}\s'-]{1,49}$/u;
const PHONE_DIGITS_RE = /^\+?[0-9\s-]{9,16}$/;

export function validatePersonName(value: string, label: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  if (raw.length < 2 || raw.length > 50) return i18n.t("validation.nameLen", { label });
  if (!NAME_RE.test(raw)) return i18n.t("validation.nameChars", { label });
  return null;
}

export function validatePhone(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  if (!PHONE_DIGITS_RE.test(raw)) {
    return i18n.t("validation.phoneFormat");
  }
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) {
    return i18n.t("validation.phoneDigits");
  }
  return null;
}

export function validateInstagramUrl(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return i18n.t("validation.instagramFullUrl");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return i18n.t("validation.instagramProtocol");
  }
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (host !== "instagram.com") {
    return i18n.t("validation.instagramHost");
  }
  return null;
}

export function validateHttpUrl(value: string, label: string): string | null {
  const raw = value.trim();
  if (!raw) return i18n.t("validation.urlRequired", { label });
  if (raw.length > 2000) return i18n.t("validation.urlMax", { label });
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return i18n.t("validation.urlProtocol", { label });
    }
  } catch {
    return i18n.t("validation.urlInvalid", { label });
  }
  return null;
}

const UPLOADED_IMAGE = /^\/api\/uploads\/[a-f0-9]{32}\.(jpg|png|webp)$/;

export function validateImageReference(value: string, required: boolean): string | null {
  const raw = value.trim();
  if (!raw) return required ? i18n.t("validation.imageRequired") : null;
  if (UPLOADED_IMAGE.test(raw)) return null;
  return validateHttpUrl(raw, i18n.t("validation.imageUrlLabel"));
}
