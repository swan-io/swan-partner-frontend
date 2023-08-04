import { Page, expect, test } from "@playwright/test";
import { env } from "./utils/env";
import { clickOnLink, clickOnText, waitForText } from "./utils/selectors";
import { getSession } from "./utils/session";

const create = async (
  page: Page,
  product: "Basic" | "Premium",
  kind: "Virtual" | "Virtual and Physical" | "Single use",
  name: string,
  variant?: "One-off" | "Recurring",
) => {
  const { benady } = await getSession();
  const CARDS_URL = `${env.BANKING_URL}/${benady.memberships.individual.french.id}/cards`;
  await page.goto(CARDS_URL);

  await page.getByRole("button", { name: "New" }).click();

  await waitForText(page, "Which card?");
  await clickOnText(page.locator("#full-page-layer-root"), product);
  await page.getByRole("button", { name: "Next" }).click();
  await page.pause();
  await waitForText(page, "Which format?");
  await clickOnText(page.locator("#full-page-layer-root"), kind);
  await page.getByRole("button", { name: "Next" }).click();
  await page.pause();

  await waitForText(page, "Pick your settings");
  await page.getByLabel("Card name - (optional)").type(name);

  if (kind === "Single use" && variant) {
    await page.getByLabel("Amount").type("42");
    await clickOnText(page.locator("#full-page-layer-root"), variant);
  }

  await page.getByRole("button", { name: "Next" }).click();
  await page.pause();
  await page.waitForLoadState();

  await page.locator("[data-testid=user-card-item]").isVisible();
  const count = await page.locator("[data-testid=user-card-item]").count();
  if (count > 1) {
    await page.locator("[data-testid=user-card-item]").first().click();
  }
  await page.pause();

  await clickOnLink(page, "Settings");

  await expect(page.getByLabel("Card name")).toHaveValue(name);
};

test("Card creation - basic virtual", async ({ page }) => {
  await create(page, "Basic", "Virtual", "e2e card - basic virtual");
});

test("Card creation - basic single use one-off", async ({ page }) => {
  await create(page, "Basic", "Single use", "e2e card - basic single use one-off", "One-off");
});

test("Card creation - basic single use recurring", async ({ page }) => {
  await create(page, "Basic", "Single use", "e2e card - basic single use recurring", "Recurring");
});

test("Card creation - premium virtual", async ({ page }) => {
  await create(page, "Premium", "Virtual", "e2e card - premium virtual");
});

test("Card creation - premium single use one-off", async ({ page }) => {
  await create(page, "Premium", "Single use", "e2e card - premium single use one-off", "One-off");
});

test("Card creation - premium single use recurring", async ({ page }) => {
  await create(
    page,
    "Premium",
    "Single use",
    "e2e card - premium single use recurring",
    "Recurring",
  );
});
