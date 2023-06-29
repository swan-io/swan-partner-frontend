import { expect, test } from "@playwright/test";
import { env } from "./utils/env";
import { sca } from "./utils/sca";
import { waitForText } from "./utils/selectors";
import { getSession } from "./utils/session";

test("French individual onboarding", async ({ browser, page }) => {
  const { benady } = await getSession();

  await page.goto(`${env.ONBOARDING_URL}/onboarding/individual/start?accountCountry=FRA`);
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByLabel("What's your email?").fill(benady.email);

  await page.getByRole("button", { name: "Next" }).click();

  await page.getByRole("button", { name: "Enter manually" }).click();
  await page.getByLabel("Type your personal home address").fill("95 Av. du Président Wilson");
  await page.getByLabel("City").fill("Montreuil");
  await page.getByLabel("Postcode").fill("93100");

  await page.getByRole("button", { name: "Next" }).click();

  await page.getByLabel("What's your current occupation?").click();
  await page.getByRole("option", { name: "Entrepreneur" }).click();
  await page.getByText("Between €3000 and €4500").click();

  await page.getByRole("button", { name: "Next" }).click();

  await sca.loginWithButtonClick(browser, page.getByRole("button", { name: "Finalize" }));

  await expect(page).toHaveURL(new RegExp("^" + env.BANKING_URL));
  await waitForText(page, "Sign out");
});

test("German individual onboarding", async ({ browser, page }) => {
  const { benady } = await getSession();

  await page.goto(`${env.ONBOARDING_URL}/onboarding/individual/start?accountCountry=DEU`);
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByLabel("What's your email?").fill(benady.email);
  await page.getByRole("checkbox").check();

  await page.getByRole("button", { name: "Next" }).click();

  await page.waitForLoadState("networkidle");
  await page.getByLabel("Type your personal home address").fill("Pariser Platz 5 Berlin");
  await page.getByText("Pariser Platz 5").click();

  expect(await page.getByLabel("City").inputValue()).toBe("Berlin");
  expect(await page.getByLabel("Postcode").inputValue()).toBe("10117");

  await page.getByRole("button", { name: "Next" }).click();

  await page.getByLabel("What's your current occupation?").click();
  await page.getByRole("option", { name: "Entrepreneur" }).click();
  await page.getByText("Between €3000 and €4500").click();
  await page.getByLabel("Tax identification number").fill("00000000000");

  await page.getByRole("button", { name: "Next" }).click();

  await sca.loginWithButtonClick(browser, page.getByRole("button", { name: "Finalize" }));

  await expect(page).toHaveURL(new RegExp("^" + env.BANKING_URL));
  await waitForText(page, "Sign out");
});

test("Spanish individual onboarding", async ({ browser, page }) => {
  const { benady } = await getSession();

  await page.goto(`${env.ONBOARDING_URL}/onboarding/individual/start?accountCountry=ESP`);
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByLabel("What's your email?").fill(benady.email);

  await page.getByRole("button", { name: "Next" }).click();

  await page.getByRole("button", { name: "Enter manually" }).click();

  await page
    .getByLabel("Type your personal home address")
    .fill("Carrer de la Riera de Sant Miquel");

  await page.getByLabel("City").fill("Barcelona");
  await page.getByLabel("Postcode").fill("08006");

  await page.getByRole("button", { name: "Next" }).click();

  await page.getByLabel("What's your current occupation?").click();
  await page.getByRole("option", { name: "Entrepreneur" }).click();
  await page.getByText("Between €3000 and €4500").click();
  await page.getByLabel("Tax identification number").fill("xxxxxxxxx");

  await page.getByRole("button", { name: "Next" }).click();

  await sca.loginWithButtonClick(browser, page.getByRole("button", { name: "Finalize" }));

  await expect(page).toHaveURL(new RegExp("^" + env.BANKING_URL));
  await waitForText(page, "Sign out");
});
