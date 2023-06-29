import { expect, test } from "@playwright/test";
import { env } from "./utils/env";
import { sca } from "./utils/sca";
import { waitForText } from "./utils/selectors";
import { getSession } from "./utils/session";

test("French company onboarding", async ({ browser, page }) => {
  const { benady } = await getSession();

  await page.goto(`${env.ONBOARDING_URL}/onboarding/company/start?accountCountry=FRA`);

  const picker = page.getByLabel("Where is your organization located?");
  await picker.waitFor();
  await expect(picker).toHaveText("France");

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

test("German company onboarding", async ({ browser, page }) => {
  const { benady } = await getSession();

  await page.goto(`${env.ONBOARDING_URL}/onboarding/company/start?accountCountry=DEU`);

  const picker = page.getByLabel("Where is your organization located?");
  await picker.waitFor();
  await expect(picker).toHaveText("Germany");

  await page.getByText("Are you a legal representative?").waitFor();
  await page.getByText("What type of organization is it?").waitFor();

  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByLabel("What's your email?").fill(benady.email);

  await expect(page.getByLabel("What country do you live in?")).toHaveText("Germany");

  await page.getByRole("button", { name: "Enter manually" }).click();
  await page.getByLabel("Find your personal home address").fill("Pariser Platz 5");
  await page.getByLabel("City").fill("Berlin");
  await page.getByLabel("Postcode").fill("10117");

  await page.getByRole("checkbox").check();

  await page.getByRole("button", { name: "Next" }).click();

  await waitForText(page, "Are you registered to Handelsregister?");

  await page.getByLabel("Your organization", { exact: true }).fill("Swan");
  await page.getByLabel("What’s your registration number").fill("HRA 12345");

  await page.getByRole("button", { name: "Enter manually" }).click();
  await page.getByLabel("Find your organization's address").fill("Mariendorfer Damm 342-358");
  await page.getByLabel("City").fill("Berlin");
  await page.getByLabel("Postcode").fill("12107");

  await page.getByRole("button", { name: "Next" }).click();

  await page.getByLabel("What's your business activity?").click();
  await page.getByText("Health").click();

  await page
    .getByLabel("Description of your business, service, or product")
    .fill("Ignore this, I'm an end-to-end test");

  await page.getByLabel("Your company's expected monthly payments through this account").click();
  await page.getByText("Between €10,000 and €50,000").click();

  await page.getByRole("button", { name: "Next" }).click();

  await waitForText(page, "Who has ownership at your organization?");
  await page.getByRole("button", { name: "Add" }).click();

  const modal = page.locator("[aria-modal]");

  await modal.getByLabel("First name").fill("Nicolas");
  await modal.getByLabel("Last name").fill("Benady");
  await modal.getByLabel("Birth date").fill("01/01/1970");

  await modal.getByLabel("Birth country").click();

  const listbox = page.getByRole("listbox");
  await listbox.type("F");
  await listbox.getByText("France").click();

  await modal.getByLabel("Birth city").fill("Paris");
  await modal.getByLabel("Birth postal code").fill("75001");

  await modal.getByLabel("Total percentage of capital held").fill("100");

  // TODO: Replace with getByRole checkbox once lake is updated
  await page
    .locator("[aria-checked]", { has: page.getByText("Directly", { exact: true }) })
    .click();

  await modal.getByRole("button", { name: "Next" }).click();

  await modal.getByRole("button", { name: "Enter manually" }).click();
  await modal.getByLabel("Find beneficiary address").fill("Pariser Platz 5");
  await modal.getByLabel("City").fill("Berlin");
  await modal.getByLabel("Postcode").fill("10117");
  await modal.getByLabel("Tax identification number").fill("00000000000");

  await page.getByRole("button", { name: "Save" }).click();

  await waitForText(page, "Nicolas Benady");
  await waitForText(page, "Directly holds 100% of the capital of Swan");

  await page.getByRole("button", { name: "Next" }).click();

  const startDate = new Date();
  await page.getByRole("button", { name: "Finalize" }).click();
  await sca.consent(browser, startDate);

  await page.waitForURL(value => value.origin === env.BANKING_URL);
});
