import { describe, it, expect, beforeAll } from "vitest";

const BASE = process.env.API_BASE_URL || "http://127.0.0.1:4000";

type LoginRes = {
  token: string;
  user: { id: string; email: string; username: string; role: string };
};

async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { res, json, status: res.status };
}

async function login(email: string, password: string): Promise<LoginRes> {
  const { res, json, status } = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  expect(status).toBe(200);
  expect(res.ok).toBe(true);
  return json as LoginRes;
}

describe("API — Health", () => {
  it("TC-API-01: GET /api/health zwraca status ok i db up", async () => {
    const { status, json } = await api("/api/health");
    expect(status).toBe(200);
    expect(json).toMatchObject({ status: "ok", db: "up", service: "raceportal-api" });
  });
});

describe("API — Auth", () => {
  it("TC-API-02: logowanie kierowcy (seed) zwraca JWT i rolę USER", async () => {
    const data = await login("test@wp.pl", "test123");
    expect(data.token).toBeTruthy();
    expect(data.user.role).toBe("USER");
    expect(data.user.email).toBe("test@wp.pl");
  });

  it("TC-API-03: logowanie admina zwraca rolę ADMIN", async () => {
    const data = await login("admin@raceportal.pl", "admin123");
    expect(data.user.role).toBe("ADMIN");
  });

  it("TC-API-04: logowanie organizatora zwraca rolę ORGANIZER", async () => {
    const data = await login("org@raceportal.pl", "org123");
    expect(data.user.role).toBe("ORGANIZER");
  });

  it("TC-API-05: błędne hasło → 401", async () => {
    const { status, json } = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "test@wp.pl", password: "zle-haslo" }),
    });
    expect(status).toBe(401);
    expect((json as { error: string }).error).toBeTruthy();
  });

  it("TC-API-06: /api/auth/me bez tokena → 401", async () => {
    const { status } = await api("/api/auth/me");
    expect(status).toBe(401);
  });

  it("TC-API-07: /api/auth/me z tokenem zwraca profil", async () => {
    const { token } = await login("test@wp.pl", "test123");
    const { status, json } = await api("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(status).toBe(200);
    expect((json as { email: string }).email).toBe("test@wp.pl");
  });

  it("TC-API-08: rejestracja nowego użytkownika", async () => {
    const email = `test.auto.${Date.now()}@raceportal.test`;
    const { status, json } = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username: "AutoTester",
        email,
        password: "test1234",
      }),
    });
    expect(status).toBe(201);
    const data = json as LoginRes;
    expect(data.token).toBeTruthy();
    expect(data.user.email).toBe(email);
    expect(data.user.role).toBe("USER");
  });
});

describe("API — Events", () => {
  it("TC-API-09: lista wydarzeń jest paginowana i zawiera APPROVED przyszłe", async () => {
    const { status, json } = await api("/api/events?limit=12");
    expect(status).toBe(200);
    const data = json as { items: unknown[]; total: number; page: number; limit: number };
    expect(data.page).toBe(1);
    expect(data.limit).toBe(12);
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.total).toBeGreaterThanOrEqual(1);
    expect(data.items.length).toBeGreaterThanOrEqual(1);
  });

  it("TC-API-10: filtr wyszukiwania q zwraca dopasowania", async () => {
    const { status, json } = await api("/api/events?q=Pozna%C5%84&limit=20");
    expect(status).toBe(200);
    const data = json as { items: Array<{ name: string; city: string; track: string }> };
    expect(data.items.length).toBeGreaterThanOrEqual(1);
    const hit = data.items.some(
      (e) =>
        e.city.toLowerCase().includes("poznań") ||
        e.track.toLowerCase().includes("poznań") ||
        e.name.toLowerCase().includes("poznań") ||
        e.name.toLowerCase().includes("mistrzostwa"),
    );
    expect(hit).toBe(true);
  });

  it("TC-API-11: szczegóły wydarzenia po id", async () => {
    const list = await api("/api/events?limit=1");
    const id = (list.json as { items: Array<{ id: string }> }).items[0].id;
    const { status, json } = await api(`/api/events/${id}`);
    expect(status).toBe(200);
    expect((json as { id: string }).id).toBe(id);
    expect((json as { description: string }).description.length).toBeGreaterThan(0);
  });

  it("TC-API-12: archiwum zwraca wydarzenia historyczne", async () => {
    const { status, json } = await api("/api/events?archive=1&limit=20");
    expect(status).toBe(200);
    const data = json as { items: Array<{ status: string }>; total: number };
    expect(data.total).toBeGreaterThanOrEqual(1);
    expect(data.items.every((e) => e.status === "ARCHIVED" || e.status === "APPROVED")).toBe(true);
  });

  it("TC-API-13: kategorie meta", async () => {
    const { status, json } = await api("/api/events/meta/categories");
    expect(status).toBe(200);
    expect(Array.isArray(json)).toBe(true);
    expect((json as string[]).length).toBeGreaterThanOrEqual(1);
  });
});

describe("API — Garage & Registrations", () => {
  let driverToken: string;
  let eventId: string;

  beforeAll(async () => {
    driverToken = (await login("test@wp.pl", "test123")).token;
    const list = await api("/api/events?limit=1");
    eventId = (list.json as { items: Array<{ id: string }> }).items[0].id;
  });

  it("TC-API-14: garaż kierowcy zwraca listę aut", async () => {
    const { status, json } = await api("/api/garage", {
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    expect(status).toBe(200);
    expect(Array.isArray(json)).toBe(true);
    expect((json as unknown[]).length).toBeGreaterThanOrEqual(1);
  });

  it("TC-API-15: zgłoszenie na wydarzenie", async () => {
    const { status, json } = await api("/api/registrations", {
      method: "POST",
      headers: { Authorization: `Bearer ${driverToken}` },
      body: JSON.stringify({ eventId, note: "Test automatyczny" }),
    });
    expect([200, 201]).toContain(status);
    expect((json as { eventId: string }).eventId).toBe(eventId);
  });

  it("TC-API-16: lista moich zgłoszeń", async () => {
    const { status, json } = await api("/api/registrations/mine", {
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    expect(status).toBe(200);
    expect(Array.isArray(json)).toBe(true);
  });
});

describe("API — RBAC Admin / Organizer", () => {
  it("TC-API-17: panel admin stats wymaga ADMIN", async () => {
    const user = await login("test@wp.pl", "test123");
    const denied = await api("/api/admin/stats", {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    expect(denied.status).toBe(403);

    const admin = await login("admin@raceportal.pl", "admin123");
    const ok = await api("/api/admin/stats", {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    expect(ok.status).toBe(200);
    expect(ok.json).toHaveProperty("users");
    expect(ok.json).toHaveProperty("events");
  });

  it("TC-API-18: organizer events dostępne dla ORGANIZER", async () => {
    const org = await login("org@raceportal.pl", "org123");
    const { status, json } = await api("/api/organizer/events", {
      headers: { Authorization: `Bearer ${org.token}` },
    });
    expect(status).toBe(200);
    expect(Array.isArray(json)).toBe(true);
  });

  it("TC-API-19: pending events widoczne dla admina", async () => {
    const admin = await login("admin@raceportal.pl", "admin123");
    const { status, json } = await api("/api/admin/events/pending", {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    expect(status).toBe(200);
    expect(Array.isArray(json)).toBe(true);
  });
});

describe("API — Maps", () => {
  it("TC-API-20: wytyczanie trasy (OSRM/Google)", async () => {
    const { status, json } = await api("/api/maps/route", {
      method: "POST",
      body: JSON.stringify({
        fromLat: 52.23,
        fromLng: 21.01,
        toLat: 52.33,
        toLng: 16.85,
      }),
    });
    expect(status).toBe(200);
    const data = json as {
      provider: string;
      distanceText: string;
      durationText: string;
      polyline: unknown[];
    };
    expect(["osrm", "google"]).toContain(data.provider);
    expect(data.distanceText).toBeTruthy();
    expect(data.polyline.length).toBeGreaterThan(1);
  });
});
