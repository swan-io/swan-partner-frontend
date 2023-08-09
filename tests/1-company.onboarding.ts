import { Page, expect, test } from "@playwright/test";
import path from "pathe";
import { AccountMembershipDocument } from "./graphql/partner";
import { UpdateAccountHolderDocument } from "./graphql/partner-admin";
import { ApiRequester, getApiRequester } from "./utils/api";
import { env } from "./utils/env";
import { assertIsDefined, assertTypename } from "./utils/functions";
import { t } from "./utils/i18n";
import { sca } from "./utils/sca";
import { clickOnButton, clickOnText, waitForText } from "./utils/selectors";
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

test("French company onboarding", async ({ browser, page, request }) => {
  const requestApi = getApiRequester(request);
  const { benady } = await getSession();

  await page.goto(`${env.ONBOARDING_URL}/onboarding/company/start?accountCountry=FRA`);

  const picker = page.getByLabel(t("onboarding.company.step.basicInfo.countryLabel"));
  await picker.waitFor();
  await expect(picker).toHaveText(t("shared.country.FRA"));

  await page.getByText(t("onboarding.company.step.basicInfo.legalRepresentativeLabel")).waitFor();
  await page.getByText(t("onboarding.company.step.basicInfo.organisationTypeLabel")).waitFor();

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();
  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await page.getByLabel(t("onboarding.company.step.registration.emailLabel")).fill(benady.email);

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await waitForText(page, "Are you registered to RCS?");
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
  ).toHaveValue("95 AV DU PRESIDENT WILSON");

  await expect(page.getByLabel(t("onboarding.individual.step.location.cityLabel"))).toHaveValue(
    "MONTREUIL",
  );
  await expect(page.getByLabel(t("onboarding.individual.step.location.postCodeLabel"))).toHaveValue(
    "93100",
  );

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
    hasText: t("onboarding.company.step.owners.editTitle"),
  });

  await clickOnButton(nicolasBenadyTile, t("onboarding.company.step.owners.editButton"));
  await editModal.waitFor();
  await editModal.getByLabel(t("shared.beneficiaryForm.beneficiary.birthPostalCode")).fill("75001");
  await clickOnButton(editModal, t("onboarding.common.save"));

  await clickOnButton(nicolasSaisonTile, t("onboarding.company.step.owners.editButton"));
  await editModal.waitFor();
  await editModal.getByLabel(t("shared.beneficiaryForm.beneficiary.birthPostalCode")).fill("75001");
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
  await expect(picker).toHaveText(t("shared.country.DEU"));

  await page.getByText(t("onboarding.company.step.basicInfo.legalRepresentativeLabel")).waitFor();
  await page.getByText(t("onboarding.company.step.basicInfo.organisationTypeLabel")).waitFor();

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();
  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await page.getByLabel(t("onboarding.company.step.registration.emailLabel")).fill(benady.email);

  await expect(page.getByLabel(t("onboarding.company.step.registration.countryLabel"))).toHaveText(
    t("shared.country.DEU"),
  );

  await page.getByRole("button", { name: t("onboarding.addressInput.button") }).click();
  await page
    .getByLabel(t("onboarding.company.step.registration.searchAddressLabel"))
    .fill("Pariser Platz 5");
  await page.getByLabel(t("onboarding.individual.step.location.cityLabel")).fill("Berlin");
  await page.getByLabel(t("onboarding.individual.step.location.postCodeLabel")).fill("10117");

  await page.getByRole("checkbox").check();

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await waitForText(page, "Are you registered to Handelsregister?");

  await page
    .getByLabel(t("onboarding.company.step.organisation1.organisationLabel"), { exact: true })
    .fill("Swan");
  await page.getByLabel("What’s your registration number").fill("HRA 12345");

  await page.getByRole("button", { name: t("onboarding.addressInput.button") }).click();
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
  await page.getByRole("button", { name: t("onboarding.common.add") }).click();

  const modal = page.locator("[aria-modal]");

  await modal.getByLabel(t("shared.beneficiaryForm.beneficiary.firstName")).fill("Nicolas");
  await modal.getByLabel(t("shared.beneficiaryForm.beneficiary.lastName")).fill("Benady");
  await modal.getByLabel(t("shared.beneficiaryForm.beneficiary.birthDate")).fill("01/01/1970");

  await modal.getByLabel(t("shared.beneficiaryForm.beneficiary.birthCountry")).click();

  const listbox = page.getByRole("listbox");
  await listbox.type("F");
  await listbox.getByText(t("shared.country.FRA")).click();

  await modal.getByLabel(t("shared.beneficiaryForm.beneficiary.birthCity")).fill("Paris");
  await modal.getByLabel(t("shared.beneficiaryForm.beneficiary.birthPostalCode")).fill("75001");
  await modal
    .getByLabel(t("shared.beneficiaryForm.beneficiary.totalCapitalPercentage"))
    .fill("100");
  await modal
    .getByRole("checkbox", { name: t("shared.beneficiaryForm.beneficiary.directly"), exact: true })
    .click();
  await modal.getByRole("button", { name: t("onboarding.common.next") }).click();

  await modal.getByRole("button", { name: t("onboarding.addressInput.button") }).click();
  await modal.getByLabel(t("shared.beneficiaryForm.beneficiary.address")).fill("Pariser Platz 5");
  await modal.getByLabel(t("onboarding.individual.step.location.cityLabel")).fill("Berlin");
  await modal.getByLabel(t("onboarding.individual.step.location.postCodeLabel")).fill("10117");
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
  await expect(picker).toHaveText(t("shared.country.ESP"));

  await page.getByText(t("onboarding.company.step.basicInfo.legalRepresentativeLabel")).waitFor();
  await page.getByText(t("onboarding.company.step.basicInfo.organisationTypeLabel")).waitFor();

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();
  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await page.getByLabel(t("onboarding.company.step.registration.emailLabel")).fill(benady.email);

  await page.getByRole("button", { name: t("onboarding.common.next") }).click();

  await waitForText(page, t("onboarding.company.step.organisation1.isRegisteredLabel"));

  await page
    .getByLabel(t("onboarding.company.step.organisation1.organisationLabel"), { exact: true })
    .fill("Swan");
  await page.getByLabel("What’s your registration number").fill("49294492H");
  await page
    .getByLabel(t("onboarding.step.finalizeError.taxIdentificationNumber"))
    .fill("xxxxxxxxx");

  await page.getByRole("button", { name: t("onboarding.addressInput.button") }).click();

  await page
    .getByLabel(t("onboarding.company.step.organisation1.addressLabel"))
    .fill("C/ de Mallorca, 401");
  await page.getByLabel(t("onboarding.individual.step.location.cityLabel")).fill("Barcelona");
  await page.getByLabel(t("onboarding.individual.step.location.postCodeLabel")).fill("08013");

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
  await page.getByRole("button", { name: t("onboarding.common.add") }).click();

  const modal = page.locator("[aria-modal]");

  await modal.getByLabel(t("shared.beneficiaryForm.beneficiary.firstName")).fill("Nicolas");
  await modal.getByLabel(t("shared.beneficiaryForm.beneficiary.lastName")).fill("Benady");
  await modal.getByLabel(t("shared.beneficiaryForm.beneficiary.birthDate")).fill("01/01/1970");

  await modal.getByLabel(t("shared.beneficiaryForm.beneficiary.birthCountry")).click();

  const listbox = page.getByRole("listbox");
  await listbox.type("F");
  await listbox.getByText(t("shared.country.FRA")).click();

  await modal.getByLabel(t("shared.beneficiaryForm.beneficiary.birthCity")).fill("Paris");
  await modal.getByLabel(t("shared.beneficiaryForm.beneficiary.birthPostalCode")).fill("75001");
  await modal
    .getByLabel(t("shared.beneficiaryForm.beneficiary.totalCapitalPercentage"))
    .fill("100");
  await modal
    .getByRole("checkbox", { name: t("shared.beneficiaryForm.beneficiary.directly"), exact: true })
    .click();
  await modal.getByRole("button", { name: t("onboarding.common.next") }).click();

  await modal.getByRole("button", { name: t("onboarding.addressInput.button") }).click();
  await modal
    .getByLabel(t("shared.beneficiaryForm.beneficiary.address"))
    .fill("Carrer de la Riera de Sant Miquel");
  await modal.getByLabel(t("onboarding.individual.step.location.cityLabel")).fill("Barcelona");
  await modal.getByLabel(t("onboarding.individual.step.location.postCodeLabel")).fill("08006");
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
