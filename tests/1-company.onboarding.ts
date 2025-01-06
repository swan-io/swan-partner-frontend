import { Page, expect, test } from "@playwright/test";
import path from "pathe";
import { AccountMembershipDocument } from "./graphql/partner";
import { EndorseSandboxUserDocument, UpdateAccountHolderDocument } from "./graphql/partner-admin";
import { ApiRequester, getApiRequester } from "./utils/api";
import { env } from "./utils/env";
import { assertIsDefined, assertTypename } from "./utils/functions";
import { t } from "./utils/i18n";
import { sca } from "./utils/sca";
import { clickOnButton, clickOnText, waitForText } from "./utils/selectors";
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
        company: {
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

test("French company onboarding", async ({ browser, page, request }) => {
  const requestApi = getApiRequester(request);
  const { benady } = await getSession();

  await page.goto(`${env.ONBOARDING_URL}/onboarding/company/start?accountCountry=FRA`);

  const picker = page.getByLabel(t("onboarding.company.step.basicInfo.countryLabel"));
  await picker.waitFor();
  await expect(picker).toHaveText("France");

  await page.getByText(t("onboarding.company.step.basicInfo.legalRepresentativeLabel")).waitFor();
  await page.getByText(t("onboarding.company.step.basicInfo.organisationTypeLabel")).waitFor();

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();
  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await page.getByLabel(t("onboarding.company.step.registration.emailLabel")).fill(benady.email);

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await waitForText(page, "Are you registered with Registre du Commerce et des Sociétés (RCS)?");
  await page.getByText("Yes").click();

  await page
    .getByLabel(t("onboarding.company.step.organisation1.organisationLabel"), { exact: true })
    .fill("Swan");
  await page.getByText("853827103 - SWAN").click();

  await expect(page.getByLabel("What’s your registration number")).toHaveValue("853827103");

  await expect(page.getByLabel(t("onboarding.company.step.organisation1.vatLabel"))).toHaveValue(
    "FR90853827103",
  );

  await expect(
    page.getByLabel(t("onboarding.company.step.organisation1.addressLabel")),
  ).toHaveValue("95 AVENUE DU PRESIDENT WILSON");

  await expect(page.getByLabel(t("onboarding.company.step.organisation1.cityLabel"))).toHaveValue(
    "MONTREUIL",
  );
  await expect(
    page.getByLabel(t("onboarding.company.step.organisation1.postCodeLabel")),
  ).toHaveValue("93100");

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await page.getByLabel(t("onboarding.company.step.organisation2.activityLabel")).click();
  await page.getByText(t("shared.businessActivity.financialAndInsuranceOperations")).click();

  await page
    .getByLabel(t("onboarding.company.step.organisation2.descriptionLabel"))
    .fill("Ignore this, I'm an end-to-end test");

  await page.getByLabel(t("onboarding.company.step.organisation2.monthlyPaymentLabel")).click();
  await page.getByText(t("shared.monthlyPaymentVolume.moreThan100000")).click();

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  const tiles = page.locator("section");
  const nicolasBenadyTile = tiles.filter({ hasText: "nicolas" }).filter({ hasText: "benady" });
  const nicolasSaisonTile = tiles.filter({ hasText: "nicolas" }).filter({ hasText: "saison" });

  await nicolasBenadyTile.waitFor();
  await nicolasSaisonTile.waitFor();

  const editModal = page.locator("[aria-modal]", {
    hasText: /Edit|Fill/,
  });

  await clickOnButton(nicolasBenadyTile, t("onboarding.company.step.owners.editButton"));
  await editModal.waitFor();
  await editModal
    .getByLabel(t("onboarding.company.step.owners.beneficiary.birthPostalCode"))
    .fill("75001");
  await clickOnButton(editModal, t("onboarding.common.next"));
  await waitForText(page, t("onboarding.common.save"));
  await clickOnButton(editModal, t("onboarding.common.save"));

  await clickOnButton(nicolasSaisonTile, t("onboarding.company.step.owners.editButton"));
  await editModal.waitFor();
  await editModal
    .getByLabel(t("onboarding.company.step.owners.beneficiary.birthPostalCode"))
    .fill("75001");
  await clickOnButton(editModal, t("onboarding.common.next"));
  await waitForText(page, t("onboarding.common.save"));
  await clickOnButton(editModal, t("onboarding.common.save"));

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await sca.loginWithButtonClick(
    browser,
    page.getByRole("button", { name: t("onboarding.company.step.presentation.step5") }),
  );

  await expect(page).toHaveURL(new RegExp("^" + env.BANKING_URL));
  await waitForText(page, "Sign out");

  await saveAccountMembership("french", page, requestApi);
});

test("German company onboarding", async ({ browser, page, request }) => {
  const requestApi = getApiRequester(request);
  const { benady } = await getSession();

  await page.goto(`${env.ONBOARDING_URL}/onboarding/company/start?accountCountry=DEU`);

  const picker = page.getByLabel(t("onboarding.company.step.basicInfo.countryLabel"));
  await picker.waitFor();
  await expect(picker).toHaveText("Germany");

  await page.getByText(t("onboarding.company.step.basicInfo.legalRepresentativeLabel")).waitFor();
  await page.getByText(t("onboarding.company.step.basicInfo.organisationTypeLabel")).waitFor();

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();
  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await page.getByLabel(t("onboarding.company.step.registration.emailLabel")).fill(benady.email);

  await expect(page.getByLabel(t("onboarding.company.step.registration.countryLabel"))).toHaveText(
    "Germany",
  );

  await page
    .getByLabel(t("onboarding.company.step.registration.searchAddressLabel"))
    .fill("Pariser Platz 5");
  await page.getByLabel(t("onboarding.company.step.registration.cityLabel")).fill("Berlin");
  await page.getByLabel(t("onboarding.company.step.registration.postalCodeLabel")).fill("10117");

  await page.getByRole("checkbox").click({ position: { x: 0, y: 0 } });

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await waitForText(page, "Are you registered with Handelsregister?");
  await page.getByText("Yes").click();

  await page
    .getByLabel(t("onboarding.company.step.organisation1.organisationLabel"), { exact: true })
    .fill("Swan");
  await page.getByLabel("What’s your registration number").fill("HRA 12345");

  await page
    .getByLabel(t("onboarding.company.step.organisation1.addressLabel"))
    .fill("Mariendorfer Damm 342-358");
  await page.getByLabel(t("onboarding.individual.step.location.cityLabel")).fill("Berlin");
  await page.getByLabel(t("onboarding.individual.step.location.postCodeLabel")).fill("12107");

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await page.getByLabel(t("onboarding.company.step.organisation2.activityLabel")).click();
  await page.getByText(t("shared.businessActivity.health")).click();

  await page
    .getByLabel(t("onboarding.company.step.organisation2.descriptionLabel"))
    .fill("Ignore this, I'm an end-to-end test");

  await page.getByLabel(t("onboarding.company.step.organisation2.monthlyPaymentLabel")).click();
  await page.getByText(t("shared.monthlyPaymentVolume.between10000And50000")).click();

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await waitForText(page, t("onboarding.company.step.owners.title"));
  await page.getByRole("button", { name: t("onboarding.company.step.owners.addTitle") }).click();

  const modal = page.locator("[aria-modal]");

  await modal.getByLabel(t("onboarding.company.step.owners.beneficiary.firstName")).fill("Nicolas");
  await modal.getByLabel(t("onboarding.company.step.owners.beneficiary.lastName")).fill("Benady");

  await modal.getByPlaceholder(t("shared.datePicker.day")).fill("01");
  await modal.getByRole("button", { name: t("shared.datePicker.month") }).click();
  await page.getByText(t("shared.datePicker.month.january")).click();
  await modal.getByPlaceholder(t("shared.datePicker.year")).fill("1990");

  await modal.getByLabel(t("onboarding.company.step.owners.beneficiary.birthCountry")).click();

  const listbox = page.getByRole("listbox");
  await listbox.type("F");
  await listbox.getByText("France").click();

  await modal.getByLabel(t("onboarding.company.step.owners.beneficiary.birthCity")).fill("Paris");
  await modal
    .getByLabel(t("onboarding.company.step.owners.beneficiary.birthPostalCode"))
    .fill("75001");
  await modal
    .getByLabel(t("onboarding.company.step.owners.beneficiary.totalCapitalPercentage"))
    .fill("100");
  await modal
    .getByRole("checkbox", {
      name: t("onboarding.company.step.owners.beneficiary.directly"),
      exact: true,
    })
    .click();
  await modal.getByRole("button", { name: t("onboarding.common.next") }).click();

  await modal
    .getByLabel(t("onboarding.company.step.owners.beneficiary.residencyAddress"))
    .fill("Pariser Platz 5");
  await modal
    .getByLabel(t("onboarding.company.step.owners.beneficiary.residencyAddressCity"))
    .fill("Berlin");
  await modal
    .getByLabel(t("onboarding.company.step.owners.beneficiary.residencyAddressPostalCode"))
    .fill("10117");
  await modal
    .getByLabel(t("onboarding.step.finalizeError.taxIdentificationNumber"))
    .fill("00000000000");

  await page.getByRole("button", { name: t("onboarding.common.save") }).click();

  await waitForText(page, "Nicolas Benady");
  await waitForText(page, "Directly holds 100% of the capital of Swan");

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await sca.loginWithButtonClick(
    browser,
    page.getByRole("button", { name: t("onboarding.company.step.presentation.step5") }),
  );

  await expect(page).toHaveURL(new RegExp("^" + env.BANKING_URL));
  await waitForText(page, "Sign out");

  await saveAccountMembership("german", page, requestApi);
});

test("Spanish company onboarding", async ({ browser, page, request }) => {
  const requestApi = getApiRequester(request);
  const { benady } = await getSession();

  await page.goto(`${env.ONBOARDING_URL}/onboarding/company/start?accountCountry=ESP`);

  const picker = page.getByLabel(t("onboarding.company.step.basicInfo.countryLabel"));
  await picker.waitFor();
  await expect(picker).toHaveText("Spain");

  await page.getByText(t("onboarding.company.step.basicInfo.legalRepresentativeLabel")).waitFor();
  await page.getByText(t("onboarding.company.step.basicInfo.organisationTypeLabel")).waitFor();

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();
  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await page.getByLabel(t("onboarding.company.step.registration.emailLabel")).fill(benady.email);

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await waitForText(page, "Are you registered with Registro Mercantil?");
  await page.getByText("Yes").click();

  await page
    .getByLabel(t("onboarding.company.step.organisation1.organisationLabel"), { exact: true })
    .fill("Swan");
  await page.getByLabel("What’s your registration number").fill("49294492H");
  await page
    .getByLabel(t("onboarding.step.finalizeError.taxIdentificationNumber"))
    .fill("xxxxxxxxx");

  await page
    .getByLabel(t("onboarding.company.step.organisation1.addressLabel"))
    .fill("C/ de Mallorca, 401");
  await page.getByLabel(t("onboarding.company.step.organisation1.cityLabel")).fill("Barcelona");
  await page.getByLabel(t("onboarding.company.step.organisation1.postCodeLabel")).fill("08013");

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await page.getByLabel(t("onboarding.company.step.organisation2.activityLabel")).click();
  await page.getByText(t("shared.businessActivity.education")).click();

  await page
    .getByLabel(t("onboarding.company.step.organisation2.descriptionLabel"))
    .fill("Ignore this, I'm an end-to-end test");

  await page.getByLabel(t("onboarding.company.step.organisation2.monthlyPaymentLabel")).click();
  await page.getByText(t("shared.monthlyPaymentVolume.between10000And50000")).click();

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await waitForText(page, t("onboarding.company.step.owners.title"));
  await page.getByRole("button", { name: t("onboarding.company.step.owners.addTitle") }).click();

  const modal = page.locator("[aria-modal]");

  await modal.getByLabel(t("onboarding.company.step.owners.beneficiary.firstName")).fill("Nicolas");
  await modal.getByLabel(t("onboarding.company.step.owners.beneficiary.lastName")).fill("Benady");
  await modal.getByPlaceholder(t("shared.datePicker.day")).fill("01");
  await modal.getByRole("button", { name: t("shared.datePicker.month") }).click();
  await page.getByText(t("shared.datePicker.month.january")).click();
  await modal.getByPlaceholder(t("shared.datePicker.year")).fill("1990");

  await modal.getByLabel(t("onboarding.company.step.owners.beneficiary.birthCountry")).click();

  const listbox = page.getByRole("listbox");
  await listbox.type("F");
  await listbox.getByText("France").click();

  await modal.getByLabel(t("onboarding.company.step.owners.beneficiary.birthCity")).fill("Paris");
  await modal
    .getByLabel(t("onboarding.company.step.owners.beneficiary.birthPostalCode"))
    .fill("75001");
  await modal
    .getByLabel(t("onboarding.company.step.owners.beneficiary.totalCapitalPercentage"))
    .fill("100");
  await modal
    .getByRole("checkbox", {
      name: t("onboarding.company.step.owners.beneficiary.directly"),
      exact: true,
    })
    .click();
  await modal.getByRole("button", { name: t("onboarding.common.next") }).click();

  await modal
    .getByLabel(t("onboarding.company.step.owners.beneficiary.residencyAddress"))
    .fill("Carrer de la Riera de Sant Miquel");
  await modal
    .getByLabel(t("onboarding.company.step.owners.beneficiary.residencyAddressCity"))
    .fill("Barcelona");
  await modal
    .getByLabel(t("onboarding.company.step.owners.beneficiary.residencyAddressPostalCode"))
    .fill("08006");
  await modal
    .getByLabel(t("onboarding.step.finalizeError.taxIdentificationNumber"))
    .fill("xxxxxxxxx");

  await page.getByRole("button", { name: t("onboarding.common.save") }).click();

  await waitForText(page, "Nicolas Benady");
  await waitForText(page, "Directly holds 100% of the capital of Swan");

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  const fileInputs = page.locator('input[type="file"]');

  const uboDeclarationPath = path.resolve(__dirname, "./assets/ubo_declaration.png");
  await fileInputs.nth(0).setInputFiles(uboDeclarationPath);
  await waitForText(page, path.basename(uboDeclarationPath));

  const swornStatementPath = path.resolve(__dirname, "./assets/sworn_statement.png");
  await fileInputs.nth(1).setInputFiles(swornStatementPath);
  await waitForText(page, path.basename(swornStatementPath));

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await sca.loginWithButtonClick(
    browser,
    page.getByRole("button", { name: t("onboarding.company.step.presentation.step5") }),
  );

  await expect(page).toHaveURL(new RegExp("^" + env.BANKING_URL));
  await waitForText(page, "Sign out");

  await saveAccountMembership("spanish", page, requestApi);
});

test("Dutch company onboarding", async ({ browser, page, request }) => {
  const requestApi = getApiRequester(request);
  const { benady } = await getSession();

  await page.goto(`${env.ONBOARDING_URL}/onboarding/company/start?accountCountry=NLD`);

  const picker = page.getByLabel(t("onboarding.company.step.basicInfo.countryLabel"));
  await picker.waitFor();
  await expect(picker).toHaveText("Netherlands");

  await page.getByText(t("onboarding.company.step.basicInfo.legalRepresentativeLabel")).waitFor();
  await page.getByText(t("onboarding.company.step.basicInfo.organisationTypeLabel")).waitFor();

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();
  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await page.getByLabel(t("onboarding.company.step.registration.emailLabel")).fill(benady.email);

  await expect(page.getByLabel(t("onboarding.company.step.registration.countryLabel"))).toHaveText(
    "Netherlands",
  );

  await page
    .getByLabel(t("onboarding.company.step.registration.searchAddressLabel"))
    .fill("Anna Paulownastraat 76");
  await page.getByLabel(t("onboarding.company.step.registration.cityLabel")).fill("Den Haag");
  await page.getByLabel(t("onboarding.company.step.registration.postalCodeLabel")).fill("2518 BJ");

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await waitForText(page, "Are you registered with Handelsregister?");
  await page.getByText("Yes").click();

  await page
    .getByLabel(t("onboarding.company.step.organisation1.organisationLabel"), { exact: true })
    .fill("Swan");
  await page.getByLabel("What’s your registration number").fill("HRA 12345");

  await page
    .getByLabel(t("onboarding.company.step.organisation1.addressLabel"))
    .fill("Anna Paulownastraat 76");
  await page.getByLabel(t("onboarding.company.step.organisation1.cityLabel")).fill("Den Haag");
  await page.getByLabel(t("onboarding.company.step.organisation1.postCodeLabel")).fill("2518 BJ");

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await page.getByLabel(t("onboarding.company.step.organisation2.activityLabel")).click();
  await page.getByText(t("shared.businessActivity.health")).click();

  await page
    .getByLabel(t("onboarding.company.step.organisation2.descriptionLabel"))
    .fill("Ignore this, I'm an end-to-end test");

  await page.getByLabel(t("onboarding.company.step.organisation2.monthlyPaymentLabel")).click();
  await page.getByText(t("shared.monthlyPaymentVolume.between10000And50000")).click();

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await waitForText(page, t("onboarding.company.step.owners.title"));
  await page.getByRole("button", { name: t("onboarding.company.step.owners.addTitle") }).click();

  const modal = page.locator("[aria-modal]");

  await modal.getByLabel(t("onboarding.company.step.owners.beneficiary.firstName")).fill("Nicolas");
  await modal.getByLabel(t("onboarding.company.step.owners.beneficiary.lastName")).fill("Benady");
  await modal.getByPlaceholder(t("shared.datePicker.day")).fill("01");
  await modal.getByRole("button", { name: t("shared.datePicker.month") }).click();
  await page.getByText(t("shared.datePicker.month.january")).click();
  await modal.getByPlaceholder(t("shared.datePicker.year")).fill("1990");

  await modal.getByLabel(t("onboarding.company.step.owners.beneficiary.birthCountry")).click();

  const listbox = page.getByRole("listbox");
  await listbox.type("F");
  await listbox.getByText("France").click();

  await modal.getByLabel(t("onboarding.company.step.owners.beneficiary.birthCity")).fill("Paris");
  await modal
    .getByLabel(t("onboarding.company.step.owners.beneficiary.birthPostalCode"))
    .fill("75001");
  await modal
    .getByLabel(t("onboarding.company.step.owners.beneficiary.totalCapitalPercentage"))
    .fill("100");
  await modal
    .getByRole("checkbox", {
      name: t("onboarding.company.step.owners.beneficiary.directly"),
      exact: true,
    })
    .click();

  await modal.getByRole("button", { name: t("onboarding.common.next") }).click();

  await modal
    .getByLabel(t("onboarding.company.step.owners.beneficiary.residencyAddress"))
    .fill("Anna Paulownastraat 76");
  await modal
    .getByLabel(t("onboarding.company.step.owners.beneficiary.residencyAddressCity"))
    .fill("Den Haag");
  await modal
    .getByLabel(t("onboarding.company.step.owners.beneficiary.residencyAddressPostalCode"))
    .fill("2518 BJ");

  await page.getByRole("button", { name: t("onboarding.common.save") }).click();

  await waitForText(page, "Nicolas Benady");
  await waitForText(page, "Directly holds 100% of the capital of Swan");

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  const fileInputs = page.locator('input[type="file"]');

  const uboDeclarationPath = path.resolve(__dirname, "./assets/ubo_declaration.png");
  await fileInputs.nth(0).setInputFiles(uboDeclarationPath);
  await waitForText(page, path.basename(uboDeclarationPath));

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await sca.loginWithButtonClick(
    browser,
    page.getByRole("button", { name: t("onboarding.company.step.presentation.step5") }),
  );

  await expect(page).toHaveURL(new RegExp("^" + env.BANKING_URL));
  await waitForText(page, "Sign out");

  await saveAccountMembership("dutch", page, requestApi);
});
