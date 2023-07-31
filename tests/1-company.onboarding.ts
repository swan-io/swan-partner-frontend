import { Page, expect, test } from "@playwright/test";
import path from "pathe";
import { AccountMembershipDocument } from "./graphql/partner";
import { UpdateAccountHolderDocument } from "./graphql/partner-admin";
import { ApiRequester, getApiRequester } from "./utils/api";
import { env } from "./utils/env";
import { assertIsDefined, assertTypename } from "./utils/functions";
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

  const nicolasBenadyTile = page.locator("section", { hasText: "nicolas benady" });
  const nicolasSaisonTile = page.locator("section", { hasText: "nicolas, rene, michel saison" });

  await nicolasBenadyTile.waitFor();
  await nicolasSaisonTile.waitFor();

  const editModal = page.locator("[aria-modal]", { hasText: "Edit an owner" });

  await clickOnButton(nicolasBenadyTile, "Edit");
  await editModal.waitFor();
  await editModal.getByLabel("Birth postal code").fill("75001");
  await clickOnButton(editModal, "Save");

  await clickOnButton(nicolasSaisonTile, "Edit");
  await editModal.waitFor();
  await editModal.getByLabel("Birth postal code").fill("75001");
  await clickOnButton(editModal, "Save");

  await page.getByRole("button", { name: "Next" }).click();

  await sca.loginWithButtonClick(browser, page.getByRole("button", { name: "Finalize" }));

  await expect(page).toHaveURL(new RegExp("^" + env.BANKING_URL));
  await waitForText(page, "Sign out");

  await saveAccountMembership("french", page, requestApi);
});

test("German company onboarding", async ({ browser, page, request }) => {
  const requestApi = getApiRequester(request);
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
  await modal.getByRole("checkbox", { name: "Directly", exact: true }).click();
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

  await sca.loginWithButtonClick(browser, page.getByRole("button", { name: "Finalize" }));

  await expect(page).toHaveURL(new RegExp("^" + env.BANKING_URL));
  await waitForText(page, "Sign out");

  await saveAccountMembership("german", page, requestApi);
});

test("Spanish company onboarding", async ({ browser, page, request }) => {
  const requestApi = getApiRequester(request);
  const { benady } = await getSession();

  await page.goto(`${env.ONBOARDING_URL}/onboarding/company/start?accountCountry=ESP`);

  const picker = page.getByLabel("Where is your organization located?");
  await picker.waitFor();
  await expect(picker).toHaveText("Spain");

  await page.getByText("Are you a legal representative?").waitFor();
  await page.getByText("What type of organization is it?").waitFor();

  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByLabel("What's your email?").fill(benady.email);

  await page.getByRole("button", { name: "Next" }).click();

  await waitForText(page, "Are you registered?");

  await page.getByLabel("Your organization", { exact: true }).fill("Swan");
  await page.getByLabel("What’s your registration number").fill("49294492H");
  await page.getByLabel("Tax identification number").fill("xxxxxxxxx");

  await page.getByRole("button", { name: "Enter manually" }).click();

  await page.getByLabel("Find your organization's address").fill("C/ de Mallorca, 401");
  await page.getByLabel("City").fill("Barcelona");
  await page.getByLabel("Postcode").fill("08013");

  await page.getByRole("button", { name: "Next" }).click();

  await page.getByLabel("What's your business activity?").click();
  await page.getByText("Education").click();

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
  await modal.getByRole("checkbox", { name: "Directly", exact: true }).click();
  await modal.getByRole("button", { name: "Next" }).click();

  await modal.getByRole("button", { name: "Enter manually" }).click();
  await modal.getByLabel("Find beneficiary address").fill("Carrer de la Riera de Sant Miquel");
  await modal.getByLabel("City").fill("Barcelona");
  await modal.getByLabel("Postcode").fill("08006");
  await modal.getByLabel("Tax identification number").fill("xxxxxxxxx");

  await page.getByRole("button", { name: "Save" }).click();

  await waitForText(page, "Nicolas Benady");
  await waitForText(page, "Directly holds 100% of the capital of Swan");

  await page.getByRole("button", { name: "Next" }).click();

  const fileInputs = page.locator('input[type="file"]');

  const uboDeclarationPath = path.resolve(__dirname, "./assets/ubo_declaration.png");
  await fileInputs.nth(0).setInputFiles(uboDeclarationPath);
  await waitForText(page, path.basename(uboDeclarationPath));

  const swornStatementPath = path.resolve(__dirname, "./assets/sworn_statement.png");
  await fileInputs.nth(1).setInputFiles(swornStatementPath);
  await waitForText(page, path.basename(swornStatementPath));

  await page.getByRole("button", { name: "Next" }).click();

  await sca.loginWithButtonClick(browser, page.getByRole("button", { name: "Finalize" }));

  await expect(page).toHaveURL(new RegExp("^" + env.BANKING_URL));
  await waitForText(page, "Sign out");

  await saveAccountMembership("spanish", page, requestApi);
});
