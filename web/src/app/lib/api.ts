const API_URL = import.meta.env.VITE_API_URL || "";
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
    // empty body
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      formatApiError(data.error || data.message, data.details),
      data.details,
    );
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: (path: string) => request<void>("DELETE", path),
};
