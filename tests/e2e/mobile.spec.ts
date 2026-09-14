import { test, expect } from "@playwright/test";

test.describe("Mobile Expo (web preview) — wizytówka", () => {
  test("TC-MOB-01: gość widzi katalog wydarzeń bez logowania", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/WYDARZENIA/i)).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/wizytówka|Katalog wydarzeń/i).first()).toBeVisible();
    await expect(page.getByText("Zaloguj", { exact: true })).toHaveCount(0);
  });

  test("TC-MOB-02: lista zawiera wydarzenia z API", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/WYDARZENIA/i)).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/Poznań|Drift|Track|Racing|Endurance|GT|Mistrzostwa|Puchar/i).first()).toBeVisible({
      timeout: 20000,
    });
  });

  test("TC-MOB-03: zakładki Lista / Kalendarz / Mapa są dostępne", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/WYDARZENIA/i)).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Lista", { exact: true })).toBeVisible();
    await expect(page.getByText("Kalendarz", { exact: true })).toBeVisible();
    await expect(page.getByText("Mapa", { exact: true })).toBeVisible();
  });

  test("TC-MOB-04: szczegóły i CTA zapisu na stronie", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/WYDARZENIA/i)).toBeVisible({ timeout: 30000 });
    await page.getByText(/Mistrzostwa|Puchar|Drift|Festival|Endurance|Trackday|Racing/i).first().click();
    await expect(page.getByText(/ZAPISZ SIĘ NA STRONIE/i)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/aplikacji webowej|stronie/i).first()).toBeVisible();
  });
});
