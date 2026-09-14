/**
 * Klient HTTP API RacePortal — mobilka-wizytówka (tylko publiczne GET).
 *
 * URL API: `EXPO_PUBLIC_API_URL` albo IP z Expo Go / localhost / 10.0.2.2 (Android).
 * URL weba (CTA zapisu): `EXPO_PUBLIC_WEB_URL` (domyślnie http://127.0.0.1:8081).
 */
import Constants from "expo-constants";
import { Platform } from "react-native";

function resolveExpoGoHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri || "";
  const host = hostUri.split(":")[0];
  return host || null;
}

/** Domyślnie API Dockera; w Expo Go próbuje użyć IP hosta dev-serwera. */
export const API_URL = (() => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
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

/** Publiczne GET/POST bez JWT (katalog wizytówki). */
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
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
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
};
