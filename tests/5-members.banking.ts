import { APIRequestContext, Browser, Page, expect, test } from "@playwright/test";
import { EndorseSandboxUserDocument } from "./graphql/partner-admin";
import { getApiRequester } from "./utils/api";
import { env } from "./utils/env";
import { t } from "./utils/i18n";
import { sca } from "./utils/sca";
import { clickOnButton, waitForText } from "./utils/selectors";
import { getSession } from "./utils/session";

test.beforeAll(async ({ request }) => {
  const requestApi = getApiRequester(request);
  await requestApi({
    query: EndorseSandboxUserDocument,
    as: "user",
    api: "partner-admin",
    variables: {
      id: env.SANDBOX_USER_BENADY_ID,
    },
  });
});

const create = async (
  browser: Browser,
  page: Page,
  request: APIRequestContext,
  country: "french" | "german",
) => {
  const date = new Date();
  const requestApi = getApiRequester(request);
  const { benady, saison } = await getSession();
  const MEMBERS_PAGE_URL = `${env.BANKING_URL}/${benady.memberships.individual[country].id}/members`;
  await page.goto(MEMBERS_PAGE_URL);
  const main = page.getByRole("main");
  await clickOnButton(main, t("banking.common.new"));
  const modal = page
    .getByRole("dialog")
    .filter({ hasText: t("banking.membershipList.newMember.title") });

  // await page.pause();
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

  // await page.pause();

  if (country === "german") {
    await clickOnButton(modal, t("banking.membershipList.newMember.next"));
    await page
      .getByLabel(t("banking.cardWizard.address.line1"))
      .type("Pariser Platz 5 Berlin", { delay: 100 });
    await page.getByText("Pariser Platz 5").click();
    await page
      .getByLabel(t("shared.beneficiaryForm.beneficiary.taxIdentificationNumber"))
      .fill("00000000000");
  }

  await clickOnButton(modal, t("banking.membershipList.newMember.sendInvitation"));

  await waitForText(page, t("banking.members.invitationLink"));

  const invitation = page
    .getByRole("dialog")
    .filter({ hasText: t("banking.members.invitationLink") });

  await requestApi({
    query: EndorseSandboxUserDocument,
    as: "user",
    api: "partner-admin",
    variables: {
      id: env.SANDBOX_USER_SAISON_ID,
    },
  });

  const url = await invitation.getByLabel(t("banking.members.invitationLink")).inputValue();
  await page.goto(url);

  await waitForText(page, "Check your phone");
  if (await page.getByRole("heading", { name: "Check your phone" }).isVisible()) {
    await sca.consent(browser, date);
  }

  await waitForText(page, t("banking.login.signout"));

  await requestApi({
    query: EndorseSandboxUserDocument,
    as: "user",
    api: "partner-admin",
    variables: {
      id: env.SANDBOX_USER_BENADY_ID,
    },
  });

  await page.goto(MEMBERS_PAGE_URL);

  await expect(page.getByRole("main").getByRole("link", { name: "Nicolas Saison" })).toBeAttached();
};

test("Members - create french", async ({ browser, page, request }) => {
  await create(browser, page, request, "french");
});

test("Members - create german", async ({ browser, page, request }) => {
  await create(browser, page, request, "german");
});
