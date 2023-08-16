import { Page, expect, test } from "@playwright/test";
import dayjs from "dayjs";
import { randomUUID } from "node:crypto";
import { match } from "ts-pattern";
import { env } from "./utils/env";
import { t } from "./utils/i18n";
import { clickOnButton, clickOnLink, clickOnText, waitForText } from "./utils/selectors";
import { getSession } from "./utils/session";

type Options = {
  iban: string;
  bank: string;
  type: "transfer" | "standingOrder";
};

const initiate = async (page: Page, options: Options) => {
  const { benady } = await getSession();
  const id = randomUUID().replaceAll("-", "");
  const label = `E2E transfer - ${id}`;
  const url = `${env.BANKING_URL}/${benady.memberships.individual.french.id}`;

  await page.goto(`${url}/payments`);

  const main = page.getByRole("main");

  const type = match(options.type)
    .with("transfer", () => t("banking.transfer.newTransfer"))
    .with("standingOrder", () => t("banking.transfer.newRecurringTransfer"))
    .exhaustive();

  await clickOnButton(main, type);
  await clickOnButton(
    main,
    `${t("banking.transfer.tile.transfer.title")}  ${t("banking.transfer.tile.transfer.subtitle")}`,
  );

  const layer = page.locator("#full-page-layer-root");

  await waitForText(layer, t("banking.transfer.new.benefiary.title"));
  await layer.getByLabel(t("banking.transfer.new.beneficiary.name")).fill(`${label} - beneficiary`);
  await layer.getByLabel(t("banking.transfer.new.iban.label")).fill(options.iban);

  if (options.bank) {
    await waitForText(layer, options.bank);
  }

  await clickOnButton(layer, t("banking.common.continue"));

  return { url, main, layer, id, label };
};

test("Transfer - instant", async ({ page }) => {
  const { url, id, layer, label } = await initiate(page, {
    iban: "FR7699999001001782785744160",
    bank: "Swan (FR)",
    type: "transfer",
  });

  await layer.getByLabel(t("banking.transfer.new.details.amount")).fill("42");
  await layer.getByLabel(t("banking.transfer.new.details.label")).fill(`${label} - label`);
  await layer.getByLabel(t("banking.transfer.new.details.reference")).fill(id);

  await clickOnButton(layer, t("banking.common.continue"));

  await clickOnText(layer, t("banking.transfer.new.schedule.today"));
  await layer
    .getByRole("checkbox", { name: t("banking.transactions.method.InstantTransfer") })
    .check();

  await clickOnButton(layer, t("banking.common.continue"));

  await expect(page).toHaveURL(`${url}/transactions`);
  await expect(page.getByRole("heading", { name: `${label} - label` })).toBeAttached();
});

test("Transfer - not instant", async ({ page }) => {
  const { url, id, layer, label } = await initiate(page, {
    iban: "FR7699999001001782785744160",
    bank: "Swan (FR)",
    type: "transfer",
  });

  await layer.getByLabel(t("banking.transfer.new.details.amount")).fill("42");
  await layer.getByLabel(t("banking.transfer.new.details.label")).fill(`${label} - label`);
  await layer.getByLabel(t("banking.transfer.new.details.reference")).fill(id);

  await clickOnButton(layer, t("banking.common.continue"));

  await clickOnText(layer, t("banking.transfer.new.schedule.today"));
  await layer
    .getByRole("checkbox", { name: t("banking.transactions.method.InstantTransfer") })
    .uncheck();

  await clickOnButton(layer, t("banking.common.continue"));

  await expect(page).toHaveURL(`${url}/transactions`);
  await expect(page.getByRole("heading", { name: `${label} - label` })).toBeAttached();
});

test("Transfer - differed", async ({ page }) => {
  const { url, id, layer, label } = await initiate(page, {
    iban: "FR7699999001001782785744160",
    bank: "Swan (FR)",
    type: "transfer",
  });

  await layer.getByLabel(t("banking.transfer.new.details.amount")).fill("42");
  await layer.getByLabel(t("banking.transfer.new.details.label")).fill(`${label} - label`);
  await layer.getByLabel(t("banking.transfer.new.details.reference")).fill(id);

  await clickOnButton(layer, t("banking.common.continue"));

  await clickOnText(layer, t("banking.transfer.new.schedule.later"));

  await layer
    .getByLabel(t("banking.transfer.new.scheduleDate.label"))
    .fill(dayjs().add(1, "day").format("DD/MM/YYYY"));
  await layer.getByLabel(t("banking.transfer.new.scheduleTime.label")).fill("12:00");

  await clickOnButton(layer, t("banking.common.continue"));

  await expect(page).toHaveURL(`${url}/transactions`);

  await clickOnLink(page, t("banking.transactions.upcoming"), { exact: false });

  await expect(page.getByRole("heading", { name: `${label} - label` })).toBeAttached();
});
