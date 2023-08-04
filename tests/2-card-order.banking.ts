import { Page, expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { env } from "./utils/env";
import { clickOnButton, clickOnLink, clickOnText, getByText, waitForText } from "./utils/selectors";
import { getSession } from "./utils/session";

type Options = {
  product: "Basic" | "Premium";
} & (
  | { kind: "Virtual" | "Virtual and Physical" }
  | { kind: "Single use"; variant: "One-off" | "Recurring" }
);

const create = async (page: Page, options: Options) => {
  const { benady } = await getSession();
  const name = `E2E card - ${randomUUID()}`;

  await page.goto(`${env.BANKING_URL}/${benady.memberships.individual.french.id}/cards`);

  const main = page.getByRole("main");
  await clickOnButton(main, "New");

  const layer = page.locator("#full-page-layer-root");

  await waitForText(layer, "Which card?");
  const products = layer.getByRole("region");
  await clickOnText(products, options.product);
  await clickOnButton(layer, "Next");

  await waitForText(layer, "Which format?");
  const kinds = layer.getByRole("region");
  await clickOnText(kinds, options.kind);
  await clickOnButton(layer, "Next");

  await waitForText(layer, "Pick your settings");
  await layer.getByLabel("Card name - (optional)").fill(name);

  if (options.kind === "Single use") {
    await layer.getByLabel("Amount").fill("42");
    await clickOnText(layer, options.variant);
  }

  await clickOnButton(layer, "Next");
  await layer.waitFor({ state: "detached" });

  const title = "Full name and card format";
  await waitForText(main, new RegExp(`${title}|Reveal card numbers`));

  if (await getByText(main, title).isVisible()) {
    const cards = main.getByTestId("user-card-item");
    await cards.getByText(name, { exact: true }).click();
  }

  await clickOnLink(main, "Settings");
  await expect(main.getByLabel("Card name")).toHaveValue(name);
};

test("Card creation - basic virtual", async ({ page }) => {
  await create(page, {
    product: "Basic",
    kind: "Virtual",
  });
});

test("Card creation - basic single use one-off", async ({ page }) => {
  await create(page, {
    product: "Basic",
    kind: "Single use",
    variant: "One-off",
  });
});

test("Card creation - basic single use recurring", async ({ page }) => {
  await create(page, {
    product: "Basic",
    kind: "Single use",
    variant: "Recurring",
  });
});

test("Card creation - premium virtual", async ({ page }) => {
  await create(page, {
    product: "Premium",
    kind: "Virtual",
  });
});

test("Card creation - premium single use one-off", async ({ page }) => {
  await create(page, {
    product: "Premium",
    kind: "Single use",
    variant: "One-off",
  });
});

test("Card creation - premium single use recurring", async ({ page }) => {
  await create(page, {
    product: "Premium",
    kind: "Single use",
    variant: "Recurring",
  });
});
