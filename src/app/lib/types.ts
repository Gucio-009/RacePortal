export type UserRole = "USER" | "ORGANIZER" | "ADMIN";

export type EventStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";
export type RegistrationStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  avatar?: string | null;
  memberSince: string;
}

export interface ApiEvent {
  id: string;
  name: string;
  description: string;
  category: string;
  date: string;
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
}

export interface PaginatedEvents {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: ApiEvent[];
}

export interface Car {
  id: string;
  userId: string;
  make: string;
  model: string;
  year?: number | null;
  className?: string | null;
  plate?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Registration {
  id: string;
  userId: string;
  eventId: string;
  carId?: string | null;
  status: RegistrationStatus;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  event?: ApiEvent;
  car?: Car | null;
  user?: { id: string; username: string; email: string; avatar?: string | null };
}

export interface RouteResult {
  provider: string;
  distanceMeters: number;
  durationSeconds: number;
  distanceText: string;
  durationText: string;
  polyline: [number, number][];
}

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

export interface OrganizerApplication {
  id: string;
  userId: string;
  company: string;
  message: string;
  status: RegistrationStatus;
  createdAt: string;
  user?: { id: string; username: string; email: string };
}

export const DEFAULT_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1638909469623-4fdd7758414b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

export function eventImage(event: { imageUrl?: string | null }) {
  return event.imageUrl || DEFAULT_EVENT_IMAGE;
}

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
    default:
      return status;
  }
}

export function formatEventDate(date: string): string {
  return new Date(date)
    .toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
}

export function eventDateLabel(event: { dateLabel?: string; date?: string }): string {
  return event.dateLabel || (event.date ? formatEventDate(event.date) : "");
}

export function registrationStatusLabel(status: RegistrationStatus): string {
  switch (status) {
    case "APPROVED":
      return "Zaakceptowane";
    case "PENDING":
      return "Oczekujące";
    case "REJECTED":
      return "Odrzucone";
    case "CANCELLED":
      return "Anulowane";
    default:
      return status;
  }
}
