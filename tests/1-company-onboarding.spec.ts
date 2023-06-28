import { expect, test } from "@playwright/test";
import { env } from "./utils/env";
import { sca } from "./utils/sca";
import { waitForText } from "./utils/selectors";
import { getSession } from "./utils/session";

test("French company onboarding", async ({ browser, page }) => {
  const { benady } = await getSession();

  await page.goto(`${env.ONBOARDING_URL}/onboarding/company/start?accountCountry=FRA`);

  // We don't update values here, only check section existence
  await page.getByText("Where is your organization located?").waitFor();
  await page.getByText("Are you a legal representative?").waitFor();
  await page.getByText("What type of organization is it?").waitFor();

  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByLabel("What's your email?").fill(benady.email);

  await page.getByRole("button", { name: "Next" }).click();

  await waitForText(page, "Are you registered to RCS?");
  await page.getByLabel("Your organization", { exact: true }).fill("Swan");
  await page.getByText("853827103 - SWAN").click();

  await expect(page.getByLabel("What’s your registration number")).toHaveValue("853827103");
  await expect(page.getByLabel("What’s your VAT number?")).toHaveValue("FR90853827103");

  await expect(page.getByLabel("Find your organization's address")).toHaveValue(
    "95 AV DU PRESIDENT WILSON",
  );

  await expect(page.getByLabel("City")).toHaveValue("MONTREUIL");
  await expect(page.getByLabel("Postcode")).toHaveValue("93100");

  await page.getByRole("button", { name: "Next" }).click();

  await page.getByLabel("What's your business activity?").click();
  await page.getByText("Financial and insurance operations").click();

  await page
    .getByLabel("Description of your business, service, or product")
    .fill("Ignore this, I'm an end-to-end test");

  await page.getByLabel("Your company's expected monthly payments through this account").click();
  await page.getByText("More than €100,000").click();

  await page.getByRole("button", { name: "Next" }).click();

  await waitForText(page, "Nicolas BENADY");
  await waitForText(page, "Nicolas, René, Michel SAISON");

  await page.getByRole("button", { name: "Next" }).click();

  const startDate = new Date();
  await page.getByRole("button", { name: "Finalize" }).click();
  await sca.consent(browser, startDate);

  await page.waitForURL(value => value.origin === env.BANKING_URL);
});
