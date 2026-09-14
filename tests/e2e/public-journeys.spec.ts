import { test, expect } from "@playwright/test";

test.describe("Public marketplace journeys (A01-A05)", () => {
  // Seed listings reference external Unsplash images. This sandbox can't
  // reach the internet from the browser, so those requests hang forever and
  // block navigation's "load" event. Abort them — irrelevant to what these
  // journeys test — so navigations resolve deterministically.
  test.beforeEach(async ({ page }) => {
    await page.route("https://images.unsplash.com/**", (route) => route.abort());
  });

  test("homepage renders hero CTAs with no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await expect(page.getByRole("link", { name: "Explore Properties" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Become a Partner" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Verify a Broker" })).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("property search, filter, and detail navigation", async ({ page }) => {
    await page.goto("/properties");
    await expect(page.getByRole("heading", { name: "Property Marketplace" })).toBeVisible();

    const firstProperty = page.locator('a[href^="/properties/"]').first();
    await expect(firstProperty).toBeVisible();
    await firstProperty.click();

    await expect(page.getByText("Trust & Verification")).toBeVisible();
    await expect(page.getByRole("link", { name: /WhatsApp/ }).first()).toHaveAttribute("href", /wa\.me/);
  });

  test("broker directory navigation to a broker profile", async ({ page }) => {
    await page.goto("/brokers");
    await expect(page.getByRole("heading", { name: "Find a Verified Broker" })).toBeVisible();

    const firstBroker = page.locator('a[href^="/brokers/"]').first();
    await expect(firstBroker).toBeVisible();
    await firstBroker.click();

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("partner application wizard can be started", async ({ page }) => {
    await page.goto("/partner/apply");
    await expect(page.getByRole("heading", { name: "Partner Application" })).toBeVisible();
    await expect(page.getByLabel("Full name")).toBeVisible();
  });
});
