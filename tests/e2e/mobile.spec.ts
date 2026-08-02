import { test, expect } from "@playwright/test";

test.describe("Mobile Expo (web preview)", () => {
  test("TC-MOB-01: ekran logowania RACEPORTAL", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("RACE")).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("PORTAL")).toBeVisible();
    await expect(page.getByText(/Uproszczona wersja mobilna/i)).toBeVisible();
    await expect(page.getByText("ZALOGUJ")).toBeVisible();
  });

  test("TC-MOB-02: logowanie demo kierowcy i lista wydarzeń", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByPlaceholder("email@example.com").fill("test@wp.pl");
    await page.getByPlaceholder("••••••••").fill("test123");
    await page.getByText("ZALOGUJ").click();
    await expect(page.getByText(/WYDARZENIA/i)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/Wyloguj/i)).toBeVisible();
    await expect(page.getByText(/Poznań|Drift|Track|Racing|Endurance|GT|Mistrzostwa/i).first()).toBeVisible({
      timeout: 20000,
    });
  });

  test("TC-MOB-03: błędne hasło pokazuje komunikat", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByPlaceholder("email@example.com").fill("test@wp.pl");
    await page.getByPlaceholder("••••••••").fill("zlehaslo");
    await page.getByText("ZALOGUJ").click();
    await expect(page.getByText(/Nieprawidłowy|Błąd|hasło|powiodło|Zbyt wiele/i).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("TC-MOB-04: wejście w szczegóły i przycisk zapisu", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByPlaceholder("email@example.com").fill("test@wp.pl");
    await page.getByPlaceholder("••••••••").fill("test123");
    await page.getByText("ZALOGUJ").click();
    await expect(page.getByText(/WYDARZENIA/i)).toBeVisible({ timeout: 20000 });
    await page.getByText(/Mistrzostwa|Puchar|Drift|Festival|Endurance|Trackday/i).first().click();
    await expect(page.getByText(/ZAPISZ SIĘ/i)).toBeVisible({ timeout: 20000 });
  });

  test("TC-MOB-05: wylogowanie wraca do logowania", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByPlaceholder("email@example.com").fill("test@wp.pl");
    await page.getByPlaceholder("••••••••").fill("test123");
    await page.getByText("ZALOGUJ").click();
    await expect(page.getByText(/Wyloguj/i)).toBeVisible({ timeout: 20000 });
    await page.getByText(/Wyloguj/i).click();
    await expect(page.getByText("ZALOGUJ")).toBeVisible({ timeout: 15000 });
  });
});
