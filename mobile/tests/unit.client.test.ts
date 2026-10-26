/**
 * Unit testy klienta API mobile (URL API / WEB / media) bez runtime Expo.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Mobile — logika API / WEB URL (unit)", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.EXPO_PUBLIC_API_URL;
    delete process.env.EXPO_PUBLIC_WEB_URL;
  });

  it("TC-MOB-U01: WEB_URL i webEventUrl budują link do weba", async () => {
    vi.doMock("react-native", () => ({ Platform: { OS: "ios" } }));
    vi.doMock("expo-constants", () => ({ default: { expoConfig: {} } }));
    const { WEB_URL, webEventUrl } = await import("../src/api/client");
    expect(WEB_URL).toBe("http://127.0.0.1:8081");
    expect(webEventUrl("abc-123")).toBe("http://127.0.0.1:8081/wydarzenia/abc-123");
  });

  it("TC-MOB-U02: API_URL ma port API i fallback localhost", async () => {
    vi.doMock("react-native", () => ({ Platform: { OS: "ios" } }));
    vi.doMock("expo-constants", () => ({ default: { expoConfig: {} } }));
    const { API_URL } = await import("../src/api/client");
    expect(API_URL).toBe("http://127.0.0.1:4000");
  });

  it("TC-MOB-U03: Expo Go host ustawia API_URL i WEB_URL na IP hosta", async () => {
    vi.doMock("react-native", () => ({ Platform: { OS: "ios" } }));
    vi.doMock("expo-constants", () => ({ default: { expoConfig: { hostUri: "192.168.1.77:8081" } } }));
    const { API_URL, WEB_URL } = await import("../src/api/client");
    expect(API_URL).toBe("http://192.168.1.77:4000");
    expect(WEB_URL).toBe("http://192.168.1.77:8081");
  });

  it("TC-MOB-U04: eventMediaUrl dokleja API_URL do /api/uploads", async () => {
    vi.doMock("react-native", () => ({ Platform: { OS: "ios" } }));
    vi.doMock("expo-constants", () => ({ default: { expoConfig: {} } }));
    const { eventMediaUrl } = await import("../src/api/client");
    expect(eventMediaUrl({ imageUrl: "/api/uploads/abc.jpg" })).toBe(
      "http://127.0.0.1:4000/api/uploads/abc.jpg",
    );
    expect(eventMediaUrl({ imageUrl: "https://cdn.example/a.jpg" })).toBe("https://cdn.example/a.jpg");
  });

  it("TC-MOB-U05: EXPO_PUBLIC_WEB_URL może wskazywać produkcję", async () => {
    process.env.EXPO_PUBLIC_WEB_URL = "https://raceportal.pl";
    vi.doMock("react-native", () => ({ Platform: { OS: "ios" } }));
    vi.doMock("expo-constants", () => ({ default: { expoConfig: {} } }));
    const { WEB_URL, webEventUrl } = await import("../src/api/client");
    expect(WEB_URL).toBe("https://raceportal.pl");
    expect(webEventUrl("evt-1")).toBe("https://raceportal.pl/wydarzenia/evt-1");
  });
});
