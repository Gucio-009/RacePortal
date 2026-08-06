/**
 * Typy kontraktu API RacePortal (warstwa współdzielona web + mobile).
 *
 * Opisują kształty JSON zwracane przez Spring Boot (`/api/...`): użytkownicy,
 * wydarzenia, zgłoszenia, auta garażu, trasy, panel admina. Daty w stringach ISO;
 * role i statusy to unie literałów zgodne z enumami po stronie Javy.
 *
 * Pomysł (alt): Zod/io-ts do walidacji runtime odpowiedzi API zamiast samego typing.
 */

/** Role użytkownika — USER (zawodnik), ORGANIZER (organizator), ADMIN. */
export type UserRole = "USER" | "ORGANIZER" | "ADMIN";

/**
 * Cykl życia wydarzenia w moderacji / kalendarzu.
 * DRAFT → PENDING → APPROVED|REJECTED; ARCHIVED/CANCELLED kończą widoczność.
 */
export type EventStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "ARCHIVED"
  | "CANCELLED";

/**
 * Statusy rejestracji (zgłoszenia na event) + aliasy legacy nadal akceptowane przez API.
 * Np. APPROVED ≈ ACCEPTED, CANCELLED ≈ CANCELED — UI mapuje je wspólnymi labelkami.
 */
export type RegistrationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "CONFIRMED"
  | "CANCELED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

/** Status wniosku o rolę organizatora. */
export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

/** Profil użytkownika z GET /api/auth/me i list admina. */
export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  /** URL presetu Dicebear lub null — wtedy UI pokazuje inicjały (patrz avatars.ts). */
  avatar?: string | null;
  memberSince: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  hasDrivingLicenseB?: boolean;
  pzmLicense?: string | null;
}

/** Pełne wydarzenie z list/szczegółów (GET /api/events). */
export interface ApiEvent {
  id: string;
  name: string;
  description: string;
  /** Nazwa kategorii z EVENT_CATEGORY_GROUPS / ALL_EVENT_CATEGORIES. */
  category: string;
  date: string;
  /** Gotowa etykieta PL z backendu; jeśli brak — formatEventDate(date). */
  dateLabel?: string;
  time: string;
  track: string;
  city: string;
  voivodeship: string;
  imageUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
  status: EventStatus;
  organizerId?: string | null;
  organizer?: { id: string; username: string } | null;
  registrationsCount?: number;
  /** Legacy / opcjonalny kształt licznika, który część klientów nadal czyta. */
  _count?: { registrations: number };
  paid?: boolean;
  entryFee?: number | null;
  bankAccount?: string | null;
  paymentDeadlineHours?: number | null;
  freeCancelDays?: number | null;
  acceptRegistrations?: boolean;
  endDate?: string | null;
  endTime?: string | null;
  street?: string | null;
  spectatorFee?: number | null;
  externalUrl?: string | null;
  requireDrivingLicense?: boolean;
  requirePzmLicense?: boolean;
  requireOc?: boolean;
  requirePt?: boolean;
  requireCage?: boolean;
  requireRegistered?: boolean;
}

/** Lekki marker mapy/kalendarza z GET /api/events/markers (bez pełnego opisu). */
export interface EventMarker {
  id: string;
  name: string;
  category: string;
  date: string;
  dateLabel?: string;
  time: string;
  track: string;
  city: string;
  lat?: number | null;
  lng?: number | null;
  paid?: boolean;
  entryFee?: number | null;
  imageUrl?: string | null;
}

export interface EventMarkersResponse {
  total: number;
  items: EventMarker[];
}

/** Odpowiedź paginacji listy wydarzeń. */
export interface PaginatedEvents {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: ApiEvent[];
}

/**
 * Auto w garażu użytkownika — className to klasa/kategoria sportowa
 * (CAR_CLASS_OPTIONS), używana przy dopasowaniu do kategorii eventu (carMatch).
 */
export interface Car {
  id: string;
  userId: string;
  make: string;
  model: string;
  year?: number | null;
  className?: string | null;
  plate?: string | null;
  imageUrl?: string | null;
  driveType?: string | null;
  powerHp?: number | null;
  engineCc?: number | null;
  weightKg?: number | null;
  registered?: boolean;
  registrationType?: string | null;
  kssNumber?: string | null;
  hasRollCage?: boolean;
  hasOc?: boolean;
  hasPt?: boolean;
  socialUrl?: string | null;
  videoUrl?: string | null;
  modifications?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Zgłoszenie zawodnika na wydarzenie (ew. z dowodem płatności). */
export interface Registration {
  id: string;
  userId: string;
  eventId: string;
  carId?: string | null;
  status: RegistrationStatus;
  note?: string | null;
  organizerComment?: string | null;
  paymentProofUrl?: string | null;
  paymentDueAt?: string | null;
  createdAt: string;
  updatedAt: string;
  event?: ApiEvent;
  car?: Car | null;
  user?: { id: string; username: string; email: string; avatar?: string | null };
}

/** Wynik trasy (np. OSRM/Google) — polyline jako pary [lat, lng]. */
export interface RouteResult {
  provider: string;
  distanceMeters: number;
  durationSeconds: number;
  distanceText: string;
  durationText: string;
  polyline: [number, number][];
}

/** Agregaty panelu admina. */
export interface AdminStats {
  users: number;
  events: number;
  pendingEvents: number;
  registrations: number;
  pendingApps: number;
}

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  avatar?: string | null;
  createdAt: string;
}

/** Wniosek o uprawnienia organizatora. */
export interface OrganizerApplication {
  id: string;
  userId: string;
  company: string;
  message: string;
  status: ApplicationStatus;
  createdAt: string;
  user?: { id: string; username: string; email: string };
}

/** Domyślne zdjęcie wydarzenia (Unsplash) gdy brak imageUrl. */
export const DEFAULT_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1638909469623-4fdd7758414b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

/** Krótszy URL Unsplash tego samego assetu — wygodniejszy na mobile. */
export const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1638909469623-4fdd7758414b?w=800&q=80";

/** Zwraca imageUrl eventu albo DEFAULT_EVENT_IMAGE. */
export function eventImage(event: { imageUrl?: string | null }) {
  return event.imageUrl || DEFAULT_EVENT_IMAGE;
}

/** Polskie etykiety statusu wydarzenia do UI. */
export function eventStatusLabel(status: EventStatus): string {
  switch (status) {
    case "APPROVED":
      return "Potwierdzone";
    case "PENDING":
      return "Oczekujące";
    case "REJECTED":
      return "Odrzucone";
    case "ARCHIVED":
      return "Zakończone";
    case "CANCELLED":
      return "Anulowane";
    case "DRAFT":
      return "Szkic";
    default:
      return status;
  }
}

/** Format daty wydarzenia w locale pl-PL, wielkimi literami (np. „15 SIERPNIA 2026”). */
export function formatEventDate(date: string): string {
  return new Date(date)
    .toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
}

/** Preferuje dateLabel z API; w przeciwnym razie formatuje date. */
export function eventDateLabel(event: { dateLabel?: string; date?: string }): string {
  return event.dateLabel || (event.date ? formatEventDate(event.date) : "");
}

/**
 * Etykiety statusu zgłoszenia — aliasy legacy (APPROVED/CANCELLED) mapowane
 * tak samo jak ACCEPTED / CANCELED.
 */
export function registrationStatusLabel(status: RegistrationStatus): string {
  switch (status) {
    case "PENDING":
      return "Oczekujące";
    case "ACCEPTED":
    case "APPROVED":
      return "Zaakceptowane — czekam na płatność";
    case "CONFIRMED":
      return "Potwierdzone";
    case "CANCELED":
    case "CANCELLED":
    case "REJECTED":
      return "Anulowane";
    default:
      return status;
  }
}

/** Czy zgłoszenie jest nadal „aktywne” (nie anulowane/odrzucone). */
export function isOpenRegistration(status: RegistrationStatus): boolean {
  return status === "PENDING" || status === "ACCEPTED" || status === "APPROVED" || status === "CONFIRMED";
}

/** Czy organizator już pozytywnie przeszedł akceptację (przed/po płatności). */
export function isPositiveRegistration(status: RegistrationStatus): boolean {
  return status === "ACCEPTED" || status === "APPROVED" || status === "CONFIRMED";
}

/**
 * Format opłaty startowej w PLN (locale pl-PL).
 * null/NaN → null (UI może ukryć pole).
 */
export function formatEntryFee(fee?: number | null): string | null {
  if (fee == null || Number.isNaN(Number(fee))) return null;
  return `${Number(fee).toLocaleString("pl-PL", {
    minimumFractionDigits: Number(fee) % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })} PLN`;
}
