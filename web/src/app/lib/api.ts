/**
 * api.ts — cienki klient HTTP do backendu Spring Boot.
 *
 * Baza URL: `import.meta.env.VITE_API_URL` (Vite); puste = relative `/api/...`
 * (proxy dev albo same-origin za nginx w Docker).
 *
 * Auth: Bearer JWT z localStorage (`raceportal_token` / TOKEN_KEY).
 * getToken / setToken — używane przez AuthContext.persistAuth.
 *
 * ApiError: status + message (+ opcjonalne details walidacji Bean Validation).
 * 204 No Content → `undefined` (DELETE bez body).
 *
 * 401 przy obecnym Bearer → clear token + opcjonalny handler (AuthContext logout UI).
 *
 * Pomysł (alt): axios / ky; OpenAPI generated client; httpOnly cookie.
 */

const API_URL = import.meta.env.VITE_API_URL || "";
/** Klucz JWT w localStorage — ten sam kontrakt co mobile / Guidelines.md. */
export const TOKEN_KEY = "raceportal_token";

export class ApiError extends Error {
  status: number;
  details?: Record<string, string>;

  constructor(status: number, message: string, details?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

type AuthExpiredHandler = () => void;
let onAuthExpired: AuthExpiredHandler | null = null;

/** AuthContext rejestruje handler — czyści user state po wygaśnięciu JWT. */
export function setOnAuthExpired(handler: AuthExpiredHandler | null) {
  onAuthExpired = handler;
}

/** Składa czytelny komunikat z `error` + mapy `details` (pola formularza). */
function formatApiError(error?: string, details?: Record<string, string>): string {
  const base = error || "Żądanie nie powiodło się";
  if (!details || Object.keys(details).length === 0) return base;
  const fields = Object.entries(details)
    .map(([field, msg]) => `${field}: ${msg}`)
    .join("; ");
  return `${base} (${fields})`;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  let data: { error?: string; message?: string; details?: Record<string, string> } = {};
  try {
    data = await res.json();
  } catch {
    // puste body (np. niektóre błędy proxy)
  }

  if (!res.ok) {
    if (res.status === 401 && token) {
      setToken(null);
      onAuthExpired?.();
    }
    throw new ApiError(
      res.status,
      formatApiError(data.error || data.message, data.details),
      data.details,
    );
  }

  return data as T;
}

/** Max upload obrazu — zsynchronizowane z `app.upload.max-bytes` (5 MB). */
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: (path: string) => request<void>("DELETE", path),
  /** Multipart upload → `{ url }` (ścieżka `/api/uploads/...`). */
  uploadImage: async (file: File): Promise<{ url: string; contentType: string; sizeBytes: number }> => {
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      throw new ApiError(400, "Plik za duży (max 5 MB)");
    }
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      throw new ApiError(400, "Dozwolone formaty: JPG, PNG, WebP");
    }
    const token = getToken();
    const form = new FormData();
    form.append("file", file);
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/api/uploads/image`, { method: "POST", headers, body: form });
    let data: { error?: string; message?: string; url?: string; contentType?: string; sizeBytes?: number } = {};
    try {
      data = await res.json();
    } catch {
      /* empty */
    }
    if (!res.ok) {
      if (res.status === 401 && token) {
        setToken(null);
        onAuthExpired?.();
      }
      throw new ApiError(res.status, data.error || data.message || "Upload nie powiódł się");
    }
    if (!data.url) {
      throw new ApiError(500, "Brak URL w odpowiedzi uploadu");
    }
    return { url: data.url, contentType: data.contentType || file.type, sizeBytes: data.sizeBytes ?? file.size };
  },
};
