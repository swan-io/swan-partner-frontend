import { Page, expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { match } from "ts-pattern";
import { env } from "./utils/env";
import { t } from "./utils/i18n";
import { clickOnButton, clickOnLink, clickOnText, getByText, waitForText } from "./utils/selectors";
import { getSession } from "./utils/session";

type Options = {
  product: "basic" | "premium";
} & (
  | { kind: "virtual" | "virtualAndPhysical" }
  | { kind: "singleUse"; variant: "oneOff" | "recurring" }
);

const create = async (page: Page, options: Options) => {
  const { benady } = await getSession();
  const name = `E2E card - ${randomUUID()}`;

  await page.goto(`${env.BANKING_URL}/${benady.memberships.individual.french.id}/cards`);

  const main = page.getByRole("main");
  await clickOnButton(main, t("banking.common.new"));

  const layer = page.locator("#full-page-layer-root");

  await waitForText(layer, t("banking.cardWizard.header.cardProduct"));
  const products = layer.getByRole("region");
  await clickOnText(products, options.product);
  await clickOnButton(layer, t("banking.common.next"));

  await waitForText(layer, t("banking.cardWizard.header.cardFormat"));
  const kinds = layer.getByRole("region");
  const kind = match(options.kind)
    .with("virtual", () => t("banking.cards.format.virtual"))
    .with("virtualAndPhysical", () => t("banking.cards.format.virtualAndPhysical"))
    .with("singleUse", () => t("banking.cards.format.singleUse"))
    .exhaustive();

  await clickOnText(kinds, kind);
  await clickOnButton(layer, t("banking.common.next"));

  await waitForText(layer, t("banking.cardWizard.header.cardSettings"));
  await layer.getByLabel("Card name - (optional)").fill(name);

  if (options.kind === "singleUse") {
    await layer.getByLabel(t("banking.cardSettings.amount")).fill("42");
    const variant = match(options.variant)
      .with("oneOff", () => t("banking.cards.periodicity.oneOff"))
      .with("recurring", () => t("banking.cards.periodicity.recurring"))
      .exhaustive();
    await clickOnText(layer, variant);
  }

  await clickOnButton(layer, t("banking.common.next"));
  await layer.waitFor({ state: "detached" });

  const title = t("banking.cardList.fullNameAndCardType");
  await waitForText(main, new RegExp(`${title}|Reveal card numbers`));

  if (await getByText(main, title).isVisible()) {
    const cards = main.getByTestId("user-card-item");
    await cards.getByText(name, { exact: true }).click();
  }

  await clickOnLink(main, t("banking.accountDetails.settings.tab"));
  await expect(main.getByLabel(t("banking.cardList.cardName"))).toHaveValue(name);
};

test("Card creation - basic virtual", async ({ page }) => {
  await create(page, {
    product: "basic",
    kind: "virtual",
  });
});

test("Card creation - basic single use one-off", async ({ page }) => {
  await create(page, {
    product: "basic",
    kind: "singleUse",
    variant: "oneOff",
  });
});

test("Card creation - basic single use recurring", async ({ page }) => {
  await create(page, {
    product: "basic",
    kind: "singleUse",
    variant: "recurring",
  });
});

test("Card creation - premium virtual", async ({ page }) => {
  await create(page, {
    product: "premium",
    kind: "virtual",
  });
});

test("Card creation - premium single use one-off", async ({ page }) => {
  await create(page, {
    product: "premium",
    kind: "singleUse",
    variant: "oneOff",
  });
});

test("Card creation - premium single use recurring", async ({ page }) => {
  await create(page, {
    product: "premium",
    kind: "singleUse",
    variant: "recurring",
  });
});
