import { test, expect } from "@playwright/test";

test.describe("Phase 2 public journeys", () => {
  // Seed listings reference external Unsplash images. This sandbox can't
  // reach the internet from the browser, so those requests hang forever and
  // block navigation's "load" event. Abort them — irrelevant to what these
  // journeys test — so navigations resolve deterministically.
  test.beforeEach(async ({ page }) => {
    await page.route("https://images.unsplash.com/**", (route) => route.abort());
  });

  test("developer directory navigation to a developer profile and project detail", async ({ page }) => {
    await page.goto("/developers");
    await expect(page.getByRole("heading", { name: "Developers" })).toBeVisible();

    const firstDeveloper = page.locator('a[href^="/developers/"]:not([href*="/projects/"])').first();
    await expect(firstDeveloper).toBeVisible();
    await Promise.all([page.waitForURL(/\/developers\/[^/]+$/), firstDeveloper.click()]);

    const firstProject = page.locator('a[href^="/developers/projects/"]').first();
    await expect(firstProject).toBeVisible();
    await Promise.all([page.waitForURL(/\/developers\/projects\//), firstProject.click()]);

    await expect(page.getByText("Available Units")).toBeVisible();
  });

  test("investor hub property advisor returns recommendations", async ({ page }) => {
    await page.goto("/investors");
    await expect(page.getByRole("heading", { name: "Investor Hub" })).toBeVisible();

    await page.getByRole("button", { name: "Get Recommendations" }).click();
    // First hit compiles the API route in dev mode on this slow VM — allow more time than the 5s default.
    await expect(page.getByText(/Calculated from listed property data/)).toBeVisible({ timeout: 20_000 });
  });

  test("investment calculators compute a mortgage payment", async ({ page }) => {
    await page.goto("/calculators");
    await expect(page.getByRole("heading", { name: "Investment Calculators" })).toBeVisible();

    await page.getByRole("button", { name: "Mortgage" }).click();
    await expect(page.getByText("Monthly payment")).toBeVisible();
  });

  test("blog list renders and navigates to a published post", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.getByRole("heading", { name: "Blog & Guides" })).toBeVisible();

    const firstPost = page.locator('a[href^="/blog/"]').first();
    await expect(firstPost).toBeVisible();
    await firstPost.click();

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("List My Property form is reachable from the partners page", async ({ page }) => {
    await page.goto("/list-property");
    await expect(page.getByRole("heading", { name: "List My Property" })).toBeVisible();
    await expect(page.getByLabel("Full name")).toBeVisible();
  });
});
