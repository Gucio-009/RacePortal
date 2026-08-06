/**
 * Klient HTTP API RacePortal dla aplikacji mobilnej (Expo / React Native).
 *
 * Rola w architekturze: jedyny punkt wyjścia do Spring Boot (`/api/*`) —
 * dokłada Bearer JWT, mapuje błędy na `ApiError`, trzyma token w bezpiecznym
 * magazynie (natywnie) lub `localStorage` (Expo web).
 *
 * SecureStore vs localStorage:
 * - iOS/Android: `expo-secure-store` (Keychain / EncryptedSharedPreferences) —
 *   token nie trafia do zwykłego AsyncStorage.
 * - web (`Platform.OS === "web"`): SecureStore nie jest dostępne → `localStorage`
 *   (jak w aplikacji webowej; wystarczające do Expo web / E2E, nie jest Keychain).
 *
 * URL API: `EXPO_PUBLIC_API_URL` albo domyślnie `127.0.0.1:4000` (iOS/web)
 * / `10.0.2.2:4000` (emulator Android = host maszyny).
 *
 * Technologie: fetch, expo-secure-store, React Native Platform.
 *
 * Pomysł (alt): axios + interceptory; React Query/SWR nad tym klientem;
 * Flutter `dio` + `flutter_secure_storage`; RN CLI bez Expo + `react-native-keychain`.
 */
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/** Domyślnie API Dockera. Na fizycznym telefonie ustaw EXPO_PUBLIC_API_URL=http://IP_KOMPUTERA:4000 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "android" ? "http://10.0.2.2:4000" : "http://127.0.0.1:4000");

const TOKEN_KEY = "raceportal_token";

export class ApiError extends Error {
  status: number;
  details?: Record<string, string>;
  constructor(status: number, message: string, details?: Record<string, string>) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const isWeb = Platform.OS === "web";

export async function getToken(): Promise<string | null> {
  try {
    // Expo web: SecureStore niedostępne — ten sam klucz co w webzie (localStorage).
    if (isWeb && typeof localStorage !== "undefined") {
      return localStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string | null): Promise<void> {
  try {
    if (isWeb && typeof localStorage !== "undefined") {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
      return;
    }
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    /* ignore storage errors */
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

/** Wspólne wywołanie REST — Authorization: Bearer gdy token obecny. */
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

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
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: (path: string) => request<void>("DELETE", path),
};
