import { Page, expect, test } from "@playwright/test";
import { env } from "./utils/env";
import { clickOnLink, clickOnText, waitForText } from "./utils/selectors";
import { getSession } from "./utils/session";

const createAndCheck = async (
  page: Page,
  product: "Basic" | "Premium",
  kind: "Virtual" | "Single use",
  name: string,
) => {
  const { benady } = await getSession();
  await page.goto(`${env.BANKING_URL}/${benady.memberships.individual.french.id}/cards`);

  await page.getByRole("button", { name: "New" }).click();

  await waitForText(page, "Which card?");
  await clickOnText(page.locator("#full-page-layer-root"), product);
  await page.getByRole("button", { name: "Next" }).click();

  await waitForText(page, "Which format?");
  await clickOnText(page.locator("#full-page-layer-root"), kind);
  await page.getByRole("button", { name: "Next" }).click();

  //   await page.pause()

  await waitForText(page, "Pick your settings");
  await page.getByLabel("Card name - (optional)").type(name);

  if (kind === "Single use") {
    await page.getByLabel("Amount").type("42");
  }

  await page.getByRole("button", { name: "Next" }).click();

  await page.waitForLoadState("networkidle");
  await page.getByRole("heading", { name: "My account" }).waitFor({ state: "visible" });


//   await page.pause();

//   const rows = await page.getByRole("link", {
//     name: /^Nicolas Benady\s+[A-Za-z,;'"\-\s]+e2e card/,
//   }).all();
//   //   console.log('[NC] a.length', (await a.all()).length);


//   if (rows.length) {
//     await page.waitForLoadState("networkidle");
//     await rows[0]?.click();
//   }

  const row = page.getByRole("link", { name }).first();
  if (await row.isVisible()) {
    await row.click();
  }

  await clickOnLink(page, "Settings");
  await expect(page.getByLabel("Card name")).toHaveValue(name);
};

test("Card creation - basic virtual", async ({ page }) => {
  await createAndCheck(page, "Basic", "Virtual", "e2e card - basic virtual");
});

test("Card creation - basic single use", async ({ page }) => {
  await createAndCheck(page, "Basic", "Single use", "e2e card - basic single use");
});

test("Card creation - premium virtual", async ({ page }) => {
  await createAndCheck(page, "Premium", "Virtual", "e2e card - premium virtual");
});
