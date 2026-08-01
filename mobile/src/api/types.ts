export type UserRole = "USER" | "ORGANIZER" | "ADMIN";

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
  status: string;
}

export interface PaginatedEvents {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: ApiEvent[];
}

export const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1638909469623-4fdd7758414b?w=800&q=80";
