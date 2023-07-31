import { Page, expect, test } from "@playwright/test";
import { AccountMembershipDocument } from "./graphql/partner";
import { UpdateAccountHolderDocument } from "./graphql/partner-admin";
import { ApiRequester, getApiRequester } from "./utils/api";
import { env } from "./utils/env";
import { assertIsDefined, assertTypename } from "./utils/functions";
import { sca } from "./utils/sca";
import { clickOnText, waitForText } from "./utils/selectors";
import { getSession, saveSession } from "./utils/session";

const saveAccountMembership = async (
  key: "french" | "german" | "spanish",
  page: Page,
  requestApi: ApiRequester,
) => {
  const accountMembershipId = page
    .url()
    .replace(env.BANKING_URL, "")
    .split("/")
    .filter(item => item !== "")[0];

  assertIsDefined(accountMembershipId);

  const { accountMembership } = await requestApi({
    query: AccountMembershipDocument,
    variables: { accountMembershipId },
  });

  assertIsDefined(accountMembership);

  const { account } = accountMembership;
  assertIsDefined(account);

  const { updateAccountHolder } = await requestApi({
    query: UpdateAccountHolderDocument,
    api: "partner-admin",
    variables: {
      input: {
        accountHolderId: account.holder.id,
        verificationStatus: "Verified",
      },
    },
  });

  assertTypename(updateAccountHolder, "UpdateAccountHolderSuccessPayload");

  const menu = page.getByRole("navigation");
  await clickOnText(menu, "Account");

  const section = page.getByRole("region");
  const IBAN = await section.getByText(/^(FR|DE|ES)[\d\s]+$/).textContent();

  await saveSession({
    benady: {
      memberships: {
        individual: {
          [key]: {
            id: accountMembership.id,
            account: {
              id: account.id,
              number: account.number,
              IBAN,
              holder: {
                id: account.holder.id,
              },
            },
          },
        },
      },
    },
  });
};

test("French individual onboarding", async ({ browser, page, request }) => {
  const requestApi = getApiRequester(request);
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

  await saveAccountMembership("french", page, requestApi);
});

test("German individual onboarding", async ({ browser, page, request }) => {
  const requestApi = getApiRequester(request);
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

  await saveAccountMembership("german", page, requestApi);
});

test("Spanish individual onboarding", async ({ browser, page, request }) => {
  const requestApi = getApiRequester(request);
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

  await saveAccountMembership("spanish", page, requestApi);
});
