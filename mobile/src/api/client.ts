/**
 * Klient HTTP API RacePortal — mobilka-wizytówka (tylko publiczne GET).
 *
 * Lokalnie: API `:4000`, web CTA `:8081` (Compose).
 * Demo / prod CTA: `EXPO_PUBLIC_WEB_URL=https://raceportal.pl`
 * (API nadal lokalne albo `EXPO_PUBLIC_API_URL` na origin VM).
 */
import Constants from "expo-constants";
import { Platform } from "react-native";
import { DEFAULT_IMAGE, eventImage } from "./types";

function resolveExpoGoHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri || "";
  const host = hostUri.split(":")[0];
  return host || null;
}

/** Domyślnie API Dockera; w Expo Go próbuje użyć IP hosta dev-serwera. */
export const API_URL = (() => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "");
  const expoGoHost = resolveExpoGoHost();
  if (expoGoHost && expoGoHost !== "localhost" && expoGoHost !== "127.0.0.1") {
    return `http://${expoGoHost}:4000`;
  }
  return Platform.OS === "android" ? "http://10.0.2.2:4000" : "http://127.0.0.1:4000";
})();

/** Bazowy URL aplikacji webowej — CTA „Zapisz się na stronie”. */
export const WEB_URL = (() => {
  if (process.env.EXPO_PUBLIC_WEB_URL) return process.env.EXPO_PUBLIC_WEB_URL.replace(/\/$/, "");
  const expoGoHost = resolveExpoGoHost();
  if (expoGoHost && expoGoHost !== "localhost" && expoGoHost !== "127.0.0.1") {
    return `http://${expoGoHost}:8081`;
  }
  return Platform.OS === "android" ? "http://10.0.2.2:8081" : "http://127.0.0.1:8081";
})();

export function webEventUrl(eventId: string): string {
  return `${WEB_URL}/wydarzenia/${encodeURIComponent(eventId)}`;
}

/**
 * URL zdjęcia eventu dla `<Image>` — relative `/api/uploads/...` dostaje prefiks API_URL
 * (web ma same-origin; native nie).
 */
export function eventMediaUrl(event: { imageUrl?: string | null }): string {
  const src = eventImage(event);
  if (!src) return DEFAULT_IMAGE;
  if (src.startsWith("/")) return `${API_URL}${src}`;
  return src;
}

export class ApiError extends Error {
  status: number;
  details?: Record<string, string>;
  constructor(status: number, message: string, details?: Record<string, string>) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function formatApiError(error?: string, details?: Record<string, string>): string {
  const base = error || "Żądanie nie powiodło się";
  if (!details || Object.keys(details).length === 0) return base;
  const fields = Object.entries(details)
    .map(([field, msg]) => `${field}: ${msg}`)
    .join("; ");
  return `${base} (${fields})`;
}

/** Publiczne GET bez JWT (katalog wizytówki). */
async function getJson<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new ApiError(0, `Brak połączenia z API (${API_URL})`);
  }

  if (res.status === 204) return undefined as T;

  let data: { error?: string; message?: string; details?: Record<string, string> } = {};
  try {
    data = await res.json();
  } catch {
    /* empty */
  }

  if (!res.ok) {
    throw new ApiError(res.status, formatApiError(data.error || data.message, data.details), data.details);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => getJson<T>(path),
};
