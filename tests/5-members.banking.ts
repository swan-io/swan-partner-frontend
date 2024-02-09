import { expect, test } from "@playwright/test";
import { EndorseSandboxUserDocument } from "./graphql/partner-admin";
import { getApiRequester } from "./utils/api";
import { env } from "./utils/env";
import { t } from "./utils/i18n";
import { clickOnButton, waitForText } from "./utils/selectors";
import { getSession } from "./utils/session";

test.beforeEach(async ({ request }) => {
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

test("Members - create french", async ({ browser, page, request }) => {
  const date = new Date();
  const requestApi = getApiRequester(request);
  const { benady, saison } = await getSession();
  const MEMBERS_PAGE_URL = `${env.BANKING_URL}/${benady.memberships.individual.french.id}/members`;
  await page.goto(MEMBERS_PAGE_URL);
  const main = page.getByRole("main");
  await clickOnButton(main, t("banking.common.new"));
  const modal = page
    .getByRole("dialog")
    .filter({ hasText: t("banking.membershipList.newMember.title") });

  await modal.getByLabel(t("banking.membershipDetail.edit.firstName")).fill("Nicolas");
  await modal.getByLabel(t("banking.membershipDetail.edit.lastName")).fill("Saison");
  await modal.getByLabel(t("banking.membershipDetail.edit.birthDate")).fill("01/01/1070");
  await modal.getByLabel(t("banking.membershipDetail.edit.phoneNumber")).fill(env.PHONE_NUMBER);
  await modal.getByLabel(t("banking.membershipDetail.edit.email")).fill(saison.email);

  await modal
    .getByRole("checkbox", { name: t("banking.membershipDetail.edit.canViewAccount") })
    .check();
  await modal
    .getByRole("checkbox", { name: t("banking.membershipDetail.edit.canManageBeneficiaries") })
    .check();
  await modal
    .getByRole("checkbox", { name: t("banking.membershipDetail.edit.canInitiatePayments") })
    .check();
  await modal
    .getByRole("checkbox", { name: t("banking.membershipDetail.edit.canManageAccountMembership") })
    .check();

  await clickOnButton(modal, t("banking.membershipList.newMember.sendInvitation"));

  await waitForText(page, t("banking.members.invitationLink"));

  await expect(page.getByRole("main").getByRole("link", { name: "Nicolas Saison" })).toBeAttached();
});

test("Members - create german", async ({ browser, page, request }) => {
  const date = new Date();
  const requestApi = getApiRequester(request);
  const { benady, saison } = await getSession();
  const MEMBERS_PAGE_URL = `${env.BANKING_URL}/${benady.memberships.individual.german.id}/members`;
  await page.goto(MEMBERS_PAGE_URL);
  const main = page.getByRole("main");
  await clickOnButton(main, t("banking.common.new"));
  const modal = page
    .getByRole("dialog")
    .filter({ hasText: t("banking.membershipList.newMember.title") });

  await modal.getByLabel(t("banking.membershipDetail.edit.firstName")).fill("Nicolas");
  await modal.getByLabel(t("banking.membershipDetail.edit.lastName")).fill("Saison");
  await modal.getByLabel(t("banking.membershipDetail.edit.birthDate")).fill("01/01/1070");
  await modal.getByLabel(t("banking.membershipDetail.edit.phoneNumber")).fill(env.PHONE_NUMBER);
  await modal.getByLabel(t("banking.membershipDetail.edit.email")).fill(saison.email);

  await modal
    .getByRole("checkbox", { name: t("banking.membershipDetail.edit.canViewAccount") })
    .check();
  await modal
    .getByRole("checkbox", { name: t("banking.membershipDetail.edit.canManageBeneficiaries") })
    .check();
  await modal
    .getByRole("checkbox", { name: t("banking.membershipDetail.edit.canInitiatePayments") })
    .check();
  await modal
    .getByRole("checkbox", { name: t("banking.membershipDetail.edit.canManageAccountMembership") })
    .check();

  await clickOnButton(modal, t("banking.membershipList.newMember.next"));

  await page.getByLabel(t("banking.cardWizard.address.line1")).fill("Pariser Platz 5");
  await page.getByLabel(t("banking.membershipDetail.edit.city")).fill("Berlin");
  await page.getByLabel(t("banking.membershipDetail.edit.postalCode")).fill("10117");

  await page
    .getByLabel(t("shared.beneficiaryForm.beneficiary.taxIdentificationNumber"))
    .fill("00000000000");

  await clickOnButton(modal, t("banking.membershipList.newMember.sendInvitation"));

  await waitForText(page, t("banking.members.invitationLink"));

  await expect(page.getByRole("main").getByRole("link", { name: "Nicolas Saison" })).toBeAttached();
});
