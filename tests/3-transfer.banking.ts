import { Page, test } from "@playwright/test";
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

  await clickOnButton(main, t("banking.transfer.newTransfer"));

  const type = match(options.type)
    .with(
      "transfer",
      () =>
        `${t("banking.transfer.tile.transfer.title")}  ${t(
          "banking.transfer.tile.transfer.subtitle",
        )}`,
    )
    .with(
      "standingOrder",
      () =>
        `${t("banking.transfer.tile.recurringTransfer.title")}  ${t(
          "banking.transfer.tile.recurringTransfer.subtitle",
        )}`,
    )
    .exhaustive();

  await clickOnLink(main, type);

  const layer = page.locator("#full-page-layer-root");
  const beneficiary = `${label.replace(/\d+/g, "")} - beneficiary`;

  await waitForText(layer, t("banking.transfer.new.beneficiary.title"));
  await layer.getByLabel(t("banking.transfer.new.beneficiary.name")).fill(beneficiary);
  await layer.getByLabel(t("banking.transfer.new.iban.label")).fill(options.iban);

  if (options.bank) {
    await waitForText(layer, options.bank);
  }

  await clickOnButton(layer, t("banking.common.continue"));

  return { url, main, layer, id, label, beneficiary };
};

test("Transfer - instant", async ({ page }) => {
  const { id, layer, label } = await initiate(page, {
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
  await waitForText(page, t("banking.transactions.availableBalance"));
});

test("Transfer - not instant", async ({ page }) => {
  const { id, layer, label } = await initiate(page, {
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
  await waitForText(page, t("banking.transactions.availableBalance"));
});

test("Transfer - differed", async ({ page }) => {
  const { id, layer, label } = await initiate(page, {
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

  await waitForText(page, t("banking.transactions.availableBalance"));
});

test("Standing order - standard", async ({ page }) => {
  const { id, layer, label } = await initiate(page, {
    iban: "FR7699999001001782785744160",
    bank: "Swan (FR)",
    type: "standingOrder",
  });

  await layer.getByLabel(t("banking.transfer.new.details.amount")).fill("42");
  await layer.getByLabel(t("banking.transfer.new.details.label")).fill(`${label} - label`);
  await layer.getByLabel(t("banking.transfer.new.details.reference")).fill(id);

  await clickOnButton(layer, t("banking.common.continue"));

  await clickOnText(layer, t("banking.payments.new.standingOrder.details.weekly"));
  await layer
    .getByLabel(t("banking.recurringTransfer.new.firstExecutionDate.label"))
    .fill(dayjs().add(1, "day").format("DD/MM/YYYY"));
  await layer.getByLabel(t("banking.recurringTransfer.new.firstExecutionTime.label")).fill("12:12");

  await clickOnButton(layer, t("banking.common.continue"));
});

test("Standing order - with end date", async ({ page }) => {
  const { id, layer, label } = await initiate(page, {
    iban: "FR7699999001001782785744160",
    bank: "Swan (FR)",
    type: "standingOrder",
  });

  await layer.getByLabel(t("banking.transfer.new.details.amount")).fill("42");
  await layer.getByLabel(t("banking.transfer.new.details.label")).fill(`${label} - label`);
  await layer.getByLabel(t("banking.transfer.new.details.reference")).fill(id);

  await clickOnButton(layer, t("banking.common.continue"));

  await clickOnText(layer, t("banking.payments.new.standingOrder.details.weekly"));
  await layer
    .getByLabel(t("banking.recurringTransfer.new.firstExecutionDate.label"))
    .fill(dayjs().add(1, "day").format("DD/MM/YYYY"));
  await layer.getByLabel(t("banking.recurringTransfer.new.firstExecutionTime.label")).fill("12:12");

  await layer.getByRole("switch").check();

  await layer
    .getByLabel(t("banking.recurringTransfer.new.lastExecutionDate.label"))
    .fill(dayjs().add(1, "month").format("DD/MM/YYYY"));
  await layer.getByLabel(t("banking.recurringTransfer.new.lastExecutionTime.label")).fill("13:13");

  await clickOnButton(layer, t("banking.common.continue"));
});

test("Standing order - standard full balance", async ({ page }) => {
  const { id, layer, label } = await initiate(page, {
    iban: "FR7699999001001782785744160",
    bank: "Swan (FR)",
    type: "standingOrder",
  });

  await layer
    .getByRole("button")
    .filter({ hasText: t("banking.transfer.new.sendFullBalance") })
    .click();

  await layer.getByLabel(t("banking.transfer.new.details.targetAmount")).fill("42");
  await layer.getByLabel(t("banking.transfer.new.details.label")).fill(`${label} - label`);
  await layer.getByLabel(t("banking.transfer.new.details.reference")).fill(id);

  await clickOnButton(layer, t("banking.common.continue"));

  await clickOnText(layer, t("banking.payments.new.standingOrder.details.weekly"));
  await layer
    .getByLabel(t("banking.recurringTransfer.new.firstExecutionDate.label"))
    .fill(dayjs().add(1, "day").format("DD/MM/YYYY"));
  await layer.getByLabel(t("banking.recurringTransfer.new.firstExecutionTime.label")).fill("12:12");

  await clickOnButton(layer, t("banking.common.continue"));
});

test("Standing order - full balance with end date", async ({ page }) => {
  const { id, layer, label } = await initiate(page, {
    iban: "FR7699999001001782785744160",
    bank: "Swan (FR)",
    type: "standingOrder",
  });

  await layer
    .getByRole("button")
    .filter({ hasText: t("banking.transfer.new.sendFullBalance") })
    .click();

  await layer.getByLabel(t("banking.transfer.new.details.targetAmount")).fill("42");
  await layer.getByLabel(t("banking.transfer.new.details.label")).fill(`${label} - label`);
  await layer.getByLabel(t("banking.transfer.new.details.reference")).fill(id);

  await clickOnButton(layer, t("banking.common.continue"));

  await clickOnText(layer, t("banking.payments.new.standingOrder.details.weekly"));
  await layer
    .getByLabel(t("banking.recurringTransfer.new.firstExecutionDate.label"))
    .fill(dayjs().add(1, "day").format("DD/MM/YYYY"));
  await layer.getByLabel(t("banking.recurringTransfer.new.firstExecutionTime.label")).fill("12:12");

  await layer.getByRole("switch").check();

  await layer
    .getByLabel(t("banking.recurringTransfer.new.lastExecutionDate.label"))
    .fill(dayjs().add(1, "month").format("DD/MM/YYYY"));
  await layer.getByLabel(t("banking.recurringTransfer.new.lastExecutionTime.label")).fill("13:13");

  await clickOnButton(layer, t("banking.common.continue"));
});
