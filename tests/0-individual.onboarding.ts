import { Page, expect, test } from "@playwright/test";
import { AccountMembershipDocument } from "./graphql/partner";
import { EndorseSandboxUserDocument, UpdateAccountHolderDocument } from "./graphql/partner-admin";
import { ApiRequester, getApiRequester } from "./utils/api";
import { env } from "./utils/env";
import { assertIsDefined, assertTypename } from "./utils/functions";
import { t } from "./utils/i18n";
import { sca } from "./utils/sca";
import { clickOnText, waitForText } from "./utils/selectors";
import { getSession, saveSession } from "./utils/session";

const saveAccountMembership = async (
  key: "french" | "german" | "spanish" | "dutch",
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
  const IBAN = await section.getByText(/^(FR|DE|ES|NL(?:\d{2}\s\w{4}\s))[\d\s]+$/).textContent();

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

test.beforeAll(async ({ request }) => {
  const requestApi = getApiRequester(request);
  const { benady } = await getSession();

  await requestApi({
    query: EndorseSandboxUserDocument,
    as: "user",
    api: "partner-admin",
    variables: {
      id: benady.id,
    },
  });
});

test("French individual onboarding", async ({ browser, page, request }) => {
  const requestApi = getApiRequester(request);
  const { benady } = await getSession();

  await page.goto(`${env.ONBOARDING_URL}/onboarding/individual/start?accountCountry=FRA`);
  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await page.getByLabel(t("onboarding.company.step.registration.emailLabel")).fill(benady.email);

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await page
    .getByLabel(t("onboarding.individual.step.location.addressLabel"))
    .fill("95 Av. du Président Wilson");
  await page.getByLabel(t("onboarding.individual.step.location.cityLabel")).fill("Montreuil");
  await page.getByLabel(t("onboarding.individual.step.location.postCodeLabel")).fill("93100");

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await page.getByLabel(t("onboarding.occupationPage.statusLabel")).click();
  await page.getByRole("option", { name: t("onboarding.employmentStatus.entrepreneur") }).click();
  await page.getByText(t("onboarding.monthlyIncome.between3000And4500")).click();

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await sca.loginWithButtonClick(
    browser,
    page.getByRole("button", { name: t("onboarding.company.step.presentation.step5") }),
  );

  await expect(page).toHaveURL(new RegExp("^" + env.BANKING_URL));
  await waitForText(page, "Sign out");

  await saveAccountMembership("french", page, requestApi);
});

test("German individual onboarding", async ({ browser, page, request }) => {
  const requestApi = getApiRequester(request);
  const { benady } = await getSession();

  await page.goto(`${env.ONBOARDING_URL}/onboarding/individual/start?accountCountry=DEU`);
  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await page.getByLabel(t("onboarding.company.step.registration.emailLabel")).fill(benady.email);
  await page.getByRole("checkbox").click({ position: { x: 0, y: 0 } });

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await page.waitForLoadState("networkidle");
  await page
    .getByLabel(t("onboarding.individual.step.location.addressLabel"))
    .fill("Pariser Platz 5");
  await page.getByLabel(t("onboarding.individual.step.location.cityLabel")).fill("Berlin");
  await page.getByLabel(t("onboarding.individual.step.location.postCodeLabel")).fill("10117");

  expect(
    await page.getByLabel(t("onboarding.individual.step.location.cityLabel")).inputValue(),
  ).toBe("Berlin");
  expect(
    await page.getByLabel(t("onboarding.individual.step.location.postCodeLabel")).inputValue(),
  ).toBe("10117");

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await page.getByLabel(t("onboarding.occupationPage.statusLabel")).click();
  await page.getByRole("option", { name: t("onboarding.employmentStatus.entrepreneur") }).click();
  await page.getByText(t("onboarding.monthlyIncome.between3000And4500")).click();
  await page
    .getByLabel(t("onboarding.step.finalizeError.taxIdentificationNumber"))
    .fill("00000000000");

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await sca.loginWithButtonClick(
    browser,
    page.getByRole("button", { name: t("onboarding.company.step.presentation.step5") }),
  );

  await expect(page).toHaveURL(new RegExp("^" + env.BANKING_URL));
  await waitForText(page, "Sign out");

  await saveAccountMembership("german", page, requestApi);
});

test("Spanish individual onboarding", async ({ browser, page, request }) => {
  const requestApi = getApiRequester(request);
  const { benady } = await getSession();

  await page.goto(`${env.ONBOARDING_URL}/onboarding/individual/start?accountCountry=ESP`);
  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await page.getByLabel(t("onboarding.company.step.registration.emailLabel")).fill(benady.email);

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await page
    .getByLabel(t("onboarding.individual.step.location.addressLabel"))
    .fill("Carrer de la Riera de Sant Miquel");

  await page.getByLabel(t("onboarding.individual.step.location.cityLabel")).fill("Barcelona");
  await page.getByLabel(t("onboarding.individual.step.location.postCodeLabel")).fill("08006");

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await page.getByLabel(t("onboarding.occupationPage.statusLabel")).click();
  await page.getByRole("option", { name: t("onboarding.employmentStatus.entrepreneur") }).click();
  await page.getByText(t("onboarding.monthlyIncome.between3000And4500")).click();
  await page
    .getByLabel(t("onboarding.step.finalizeError.taxIdentificationNumber"))
    .fill("xxxxxxxxx");

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await sca.loginWithButtonClick(
    browser,
    page.getByRole("button", { name: t("onboarding.company.step.presentation.step5") }),
  );

  await expect(page).toHaveURL(new RegExp("^" + env.BANKING_URL));
  await waitForText(page, "Sign out");

  await saveAccountMembership("spanish", page, requestApi);
});

test("Dutch individual onboarding", async ({ browser, page, request }) => {
  const requestApi = getApiRequester(request);
  const { benady } = await getSession();

  await page.goto(`${env.ONBOARDING_URL}/onboarding/individual/start?accountCountry=NLD`);
  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await page.getByLabel(t("onboarding.company.step.registration.emailLabel")).fill(benady.email);

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await page.waitForLoadState("networkidle");
  await page
    .getByLabel(t("onboarding.individual.step.location.addressLabel"))
    .fill("Anna Paulownastraat 76");
  await page.getByLabel(t("onboarding.individual.step.location.cityLabel")).fill("Den Haag");
  await page.getByLabel(t("onboarding.individual.step.location.postCodeLabel")).fill("2518 BJ");

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await page.getByLabel(t("onboarding.occupationPage.statusLabel")).click();
  await page.getByRole("option", { name: t("onboarding.employmentStatus.entrepreneur") }).click();
  await page.getByText(t("onboarding.monthlyIncome.between3000And4500")).click();

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await sca.loginWithButtonClick(
    browser,
    page.getByRole("button", { name: t("onboarding.company.step.presentation.step5") }),
  );

  await expect(page).toHaveURL(new RegExp("^" + env.BANKING_URL));
  await waitForText(page, "Sign out");

  await saveAccountMembership("dutch", page, requestApi);
});
