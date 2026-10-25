/**
 * api.ts — cienki klient HTTP do backendu Spring Boot.
 *
 * Baza URL: `import.meta.env.VITE_API_URL` (Vite); puste = relative `/api/...`
 * (proxy dev albo same-origin za nginx w Docker).
 *
 * Auth: httpOnly cookies (`rp_at` / `rp_rt`) + credentials:include.
 * Legacy `raceportal_token` w localStorage jest kasowany przy starcie.
 * Przy 401: jedna próba POST /api/auth/refresh, potem onAuthExpired.
 */

const API_URL = import.meta.env.VITE_API_URL || "";
/** Legacy — tylko do wyczyszczenia starych sesji XSS-exposed. */
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

/** Usuwa stary JWT z localStorage (pentest #2). */
export function clearLegacyToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode */
  }
}

type AuthExpiredHandler = () => void;
let onAuthExpired: AuthExpiredHandler | null = null;
let refreshInFlight: Promise<boolean> | null = null;

/** AuthContext rejestruje handler — czyści user state po wygaśnięciu sesji. */
export function setOnAuthExpired(handler: AuthExpiredHandler | null) {
  onAuthExpired = handler;
}

function formatApiError(error?: string, details?: Record<string, string>): string {
  const base = error || "Żądanie nie powiodło się";
  if (!details || Object.keys(details).length === 0) return base;
  const fields = Object.entries(details)
    .map(([field, msg]) => `${field}: ${msg}`)
    .join("; ");
  return `${base} (${fields})`;
}

async function tryRefreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: "{}",
        });
        return res.ok;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  retried = false,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  let data: { error?: string; message?: string; details?: Record<string, string> } = {};
  try {
    data = await res.json();
  } catch {
    // puste body
  }

  if (!res.ok) {
    if (res.status === 401 && !retried && path !== "/api/auth/refresh" && path !== "/api/auth/login") {
      const ok = await tryRefreshSession();
      if (ok) {
        return request<T>(method, path, body, true);
      }
      clearLegacyToken();
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

function resolveImageType(file: File): string | null {
  const raw = file.type.trim().toLowerCase();
  if (raw === "image/jpg" || raw === "image/pjpeg" || raw === "image/x-citrix-jpeg") return "image/jpeg";
  if (raw === "image/x-png") return "image/png";
  if (raw === "image/jpeg" || raw === "image/png" || raw === "image/webp") return raw;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return null;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: (path: string) => request<void>("DELETE", path),
  uploadImage: async (file: File): Promise<{ url: string; contentType: string; sizeBytes: number }> => {
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      throw new ApiError(400, "Plik za duży (max 5 MB)");
    }
    if (!resolveImageType(file)) {
      throw new ApiError(400, "Dozwolone formaty: JPG, PNG, WebP");
    }
    const form = new FormData();
    form.append("file", file, file.name || "image");
    const doUpload = async () =>
      fetch(`${API_URL}/api/uploads/image`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
        body: form,
      });
    let res = await doUpload();
    if (res.status === 401) {
      const ok = await tryRefreshSession();
      if (ok) res = await doUpload();
    }
    let data: { error?: string; message?: string; url?: string; contentType?: string; sizeBytes?: number } = {};
    try {
      data = await res.json();
    } catch {
      /* HTML z proxy / nginx */
    }
    if (!res.ok) {
      if (res.status === 401) {
        clearLegacyToken();
        onAuthExpired?.();
      }
      const fallback = res.status === 413 ? "Plik za duży (max 5 MB)" : "Upload nie powiódł się";
      throw new ApiError(res.status, data.error || data.message || fallback);
    }
    if (!data.url) {
      throw new ApiError(500, "Brak URL w odpowiedzi uploadu");
    }
    return { url: data.url, contentType: data.contentType || file.type, sizeBytes: data.sizeBytes ?? file.size };
  },
};
