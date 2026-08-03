import { test, expect } from "@playwright/test";

async function loginAsDriver(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByText(/WYDARZENIA/i)).toBeVisible({ timeout: 30000 });
  await page.getByText("Zaloguj", { exact: true }).first().click();
  await expect(page.getByText("ZALOGUJ", { exact: true })).toBeVisible({ timeout: 15000 });
  await page.getByPlaceholder("email@example.com").fill("test@wp.pl");
  await page.getByPlaceholder("••••••••").fill("test123");
  await page.getByText("ZALOGUJ", { exact: true }).click();
  await expect(page.getByText("Wyloguj", { exact: true }).first()).toBeVisible({ timeout: 20000 });
}

test.describe("Mobile Expo (web preview)", () => {
  test("TC-MOB-01: gość widzi listę wydarzeń i może otworzyć logowanie", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.getByText(/WYDARZENIA/i)).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Zaloguj", { exact: true }).first()).toBeVisible();
    await page.getByText("Zaloguj", { exact: true }).first().click();
    await expect(page.getByText("RACE")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("PORTAL")).toBeVisible();
    await expect(page.getByText(/Uproszczona wersja mobilna/i)).toBeVisible();
    await expect(page.getByText("ZALOGUJ", { exact: true })).toBeVisible();
  });

  test("TC-MOB-02: logowanie demo kierowcy i lista wydarzeń", async ({ page }) => {
    await loginAsDriver(page);
    await expect(page.getByText(/WYDARZENIA/i)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/Poznań|Drift|Track|Racing|Endurance|GT|Mistrzostwa/i).first()).toBeVisible({
      timeout: 20000,
    });
  });

  test("TC-MOB-03: błędne hasło pokazuje komunikat", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByText("Zaloguj", { exact: true }).first().click();
    await page.getByPlaceholder("email@example.com").fill("test@wp.pl");
    await page.getByPlaceholder("••••••••").fill("zlehaslo");
    await page.getByText("ZALOGUJ", { exact: true }).click();
    await expect(page.getByText(/Nieprawidłowy|Błąd|hasło|powiodło|Zbyt wiele/i).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("TC-MOB-04: wejście w szczegóły i przycisk zapisu", async ({ page }) => {
    await loginAsDriver(page);
    await page.getByText(/Mistrzostwa|Puchar|Drift|Festival|Endurance|Trackday/i).first().click();
    await expect(page.getByText(/ZAPISZ SIĘ/i)).toBeVisible({ timeout: 20000 });
  });

  test("TC-MOB-05: wylogowanie wraca do trybu gościa", async ({ page }) => {
    await loginAsDriver(page);
    await page.getByText("Wyloguj", { exact: true }).first().click();
    await expect(page.getByText("Zaloguj", { exact: true }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Gość/i)).toBeVisible();
  });
});
