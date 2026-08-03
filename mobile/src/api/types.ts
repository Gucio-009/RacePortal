export type UserRole = "USER" | "ORGANIZER" | "ADMIN";

export type EventStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "ARCHIVED"
  | "CANCELLED";

export type RegistrationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "CONFIRMED"
  | "CANCELED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  avatar?: string | null;
  memberSince: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  hasDrivingLicenseB?: boolean;
  pzmLicense?: string | null;
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
  _count?: { registrations: number };
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
  status: ApplicationStatus;
  createdAt: string;
  user?: { id: string; username: string; email: string };
}

export const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1638909469623-4fdd7758414b?w=800&q=80";

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

export function isOpenRegistration(status: RegistrationStatus): boolean {
  return status === "PENDING" || status === "ACCEPTED" || status === "APPROVED" || status === "CONFIRMED";
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
    case "CANCELLED":
      return "Anulowane";
    case "DRAFT":
      return "Szkic";
    default:
      return status;
  }
}
