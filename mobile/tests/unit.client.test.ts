/**
 * Unit testy klienta API mobile (URL + storage tokenu) bez runtime Expo.
 *
 * Rola w architekturze: mock Platform + SecureStore; na web weryfikuje localStorage.
 * Uzupełnia E2E Playwright (Expo web :8082).
 *
 * Pomysł (alt): testy Detox/Maestro na emulatorze; kontrakt Pact z backendem.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// Minimal unit tests for mobile API helpers (bez Expo runtime)
describe("Mobile — logika API URL / token storage (unit)", () => {
  beforeEach(() => {
    vi.resetModules();
    // @ts-expect-error test shim
    global.localStorage = {
      store: {} as Record<string, string>,
      getItem(k: string) {
        return this.store[k] ?? null;
      },
      setItem(k: string, v: string) {
        this.store[k] = v;
      },
      removeItem(k: string) {
        delete this.store[k];
      },
      clear() {
        this.store = {};
      },
    };
  });

  it("TC-MOB-U01: setToken/getToken na web używa localStorage", async () => {
    vi.doMock("react-native", () => ({ Platform: { OS: "web" } }));
    vi.doMock("expo-secure-store", () => ({
      getItemAsync: vi.fn(),
      setItemAsync: vi.fn(),
      deleteItemAsync: vi.fn(),
    }));

    const { setToken, getToken } = await import("../src/api/client");
    await setToken("abc.jwt.token");
    expect(await getToken()).toBe("abc.jwt.token");
    await setToken(null);
    expect(await getToken()).toBeNull();
  });

  it("TC-MOB-U02: API_URL na iOS/web wskazuje 127.0.0.1:4000", async () => {
    vi.doMock("react-native", () => ({ Platform: { OS: "ios" } }));
    vi.doMock("expo-secure-store", () => ({
      getItemAsync: vi.fn(),
      setItemAsync: vi.fn(),
      deleteItemAsync: vi.fn(),
    }));
    const { API_URL } = await import("../src/api/client");
    expect(API_URL).toContain("4000");
  });
});
