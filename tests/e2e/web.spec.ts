import { test, expect, type Page } from "@playwright/test";

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByPlaceholder("twoj@email.com").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 20000 }),
    page.locator('main button[type="submit"]').click(),
  ]);
}

test.describe("Web — publiczne strony", () => {
  test("TC-WEB-01: strona główna ładuje hero RACEPORTAL", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/DOŁĄCZ DO/i)).toBeVisible();
    await expect(page.getByText(/WYŚCIGU/i)).toBeVisible();
  });

  test("TC-WEB-02: kalendarz wydarzeń pokazuje karty", async ({ page }) => {
    await page.goto("/wydarzenia");
    await expect(page.getByRole("heading", { name: /KALENDARZ/i })).toBeVisible();
    await expect(page.locator("main a[href*='/wydarzenia/']").first()).toBeVisible({ timeout: 20000 });
  });

  test("TC-WEB-03: wyszukiwarka filtruje listę", async ({ page }) => {
    await page.goto("/wydarzenia");
    await page.getByPlaceholder(/Szukaj/i).fill("Drift");
    await page.waitForTimeout(700);
    await expect(page.getByText(/Drift/i).first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-WEB-04: szczegóły wydarzenia", async ({ page }) => {
    await page.goto("/wydarzenia");
    const link = page.locator("main a[href*='/wydarzenia/']").first();
    await expect(link).toBeVisible({ timeout: 20000 });
    await link.click();
    await expect(page).toHaveURL(/\/wydarzenia\/.+/);
  });

  test("TC-WEB-05: mapa wydarzeń", async ({ page }) => {
    await page.goto("/wydarzenia");
    await page.getByRole("button", { name: /^Mapa$/i }).click();
    await expect(page.locator(".leaflet-container")).toBeVisible({ timeout: 20000 });
  });

  test("TC-WEB-06: archiwum", async ({ page }) => {
    await page.goto("/archiwum");
    await expect(page.getByText(/ARCHIWUM/i).first()).toBeVisible();
  });
});

test.describe("Web — auth i panel kierowcy", () => {
  test("TC-WEB-07: logowanie kierowcy i wejście na dashboard", async ({ page }) => {
    await loginAs(page, "test@wp.pl", "test123");
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("main").getByText(/test|KIEROWCA|dashboard|profil|garaż/i).first()).toBeVisible();
  });

  test("TC-WEB-08: błędne logowanie pokazuje błąd", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("twoj@email.com").fill("test@wp.pl");
    await page.getByPlaceholder("••••••••").fill("zlehaslo");
    await page.locator('main button[type="submit"]').click();
    await expect(page.getByText(/Nieprawidłowy|Zbyt wiele|hasło|błąd/i).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("TC-WEB-09: garaż po zalogowaniu pokazuje auta", async ({ page }) => {
    await loginAs(page, "test@wp.pl", "test123");
    await page.goto("/garaz");
    await expect(page.getByText(/GARAŻ|BMW|Porsche|Dodaj/i).first()).toBeVisible({
      timeout: 20000,
    });
  });
});

test.describe("Web — RBAC", () => {
  test("TC-WEB-10: admin widzi panel admina", async ({ page }) => {
    await loginAs(page, "admin@raceportal.pl", "admin123");
    await page.goto("/admin");
    await expect(page.locator("main h1, main h2").filter({ hasText: /ADMIN/i }).first()).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByText(/Użytkownicy|Oczekujące|Wydarzenia/i).first()).toBeVisible();
  });

  test("TC-WEB-11: organizator widzi panel organizatora", async ({ page }) => {
    await loginAs(page, "org@raceportal.pl", "org123");
    await page.goto("/organizer");
    await expect(page.locator("main h1, main h2").filter({ hasText: /ORGANIZATOR/i }).first()).toBeVisible({
      timeout: 20000,
    });
  });

  test("TC-WEB-12: zwykły user nie wejdzie na /admin", async ({ page }) => {
    await loginAs(page, "test@wp.pl", "test123");
    await page.goto("/admin");
    await page.waitForTimeout(1500);
    await expect(page).not.toHaveURL(/\/admin$/);
  });
});
