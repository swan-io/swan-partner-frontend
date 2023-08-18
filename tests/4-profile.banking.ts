import { expect, test } from "@playwright/test";
import IT from "../clients/banking/src/locales/it.json";
import { env } from "./utils/env";
import { t } from "./utils/i18n";
import { getSession } from "./utils/session";

test("Profile - info is present", async ({ page }) => {
  const { benady } = await getSession();
  await page.goto(`${env.BANKING_URL}/${benady.memberships.individual.french.id}/profile`);

  const main = page.getByRole("main");
  const section = main.locator("section").first();
  await expect(section.getByRole("heading", { name: "Nicolas Benady" })).toBeAttached();
  await expect(section.getByText(benady.email)).toBeAttached();
});

test("Profile - change language", async ({ page }) => {
  const { benady } = await getSession();
  await page.goto(`${env.BANKING_URL}/${benady.memberships.individual.french.id}/profile`);

  const main = page.getByRole("main");
  const select = main.getByLabel(t("banking.profile.language"));
  await select.click();
  const options = page.getByRole("listbox");
  await options.getByRole("option", { name: "Italiano" }).click();
  await expect(
    main.getByRole("heading", { name: IT["profile.personalInformation"] }),
  ).toBeAttached();
});
