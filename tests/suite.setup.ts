import { test } from "@playwright/test";
import { storagePath } from "../playwright.config";
import {
  FinalizeOnboardingDocument,
  OnboardIndividualAccountHolderDocument,
  OnboardingDocument,
} from "./graphql/partner";
import { EndorseSandboxUserDocument, ResetSandboxUserDocument } from "./graphql/partner-admin";
import { getApiRequester } from "./utils/api";
import { env } from "./utils/env";
import { assertIsDefined, assertTypename } from "./utils/functions";
import { sca } from "./utils/sca";
import { getButtonByName, waitForText } from "./utils/selectors";
import { saveSession } from "./utils/session";
import { getProjectAccessToken } from "./utils/tokens";
import { createEmailAddress } from "./utils/webhook";

test("Test suite setup", async ({ browser, page, request }) => {
  const requestApi = getApiRequester(request);

  const [projectAccessToken, userTokens, benadyEmail, saisonEmail] = await Promise.all([
    getProjectAccessToken(),
    sca.loginWithAuthLink(browser),
    createEmailAddress(),
    createEmailAddress(),
  ]);

  await saveSession({
    project: { accessToken: projectAccessToken },
    user: userTokens,
    benady: { email: benadyEmail },
    saison: { email: saisonEmail },
  });

  const [updateBenady, updateSaison] = await Promise.all([
    requestApi({
      query: ResetSandboxUserDocument,
      as: "user",
      api: "partner-admin",
      variables: {
        id: env.SANDBOX_USER_BENADY_ID,
        lastName: "Benady",
        firstName: "Nicolas",
      },
    }).then(response => response.updateSandboxUser),

    requestApi({
      query: ResetSandboxUserDocument,
      as: "user",
      api: "partner-admin",
      variables: {
        id: env.SANDBOX_USER_SAISON_ID,
        lastName: "Saison",
        firstName: "Nicolas",
      },
    }).then(response => response.updateSandboxUser),
  ]);

  assertTypename(updateBenady, "UpdateSandboxUserSuccessPayload");
  assertTypename(updateSaison, "UpdateSandboxUserSuccessPayload");

  await requestApi({
    query: EndorseSandboxUserDocument,
    as: "user",
    api: "partner-admin",
    variables: {
      id: env.SANDBOX_USER_BENADY_ID,
    },
  });

  await page.goto(env.BANKING_URL);
  await sca.loginWithButtonClick(browser, getButtonByName(page, "Sign into Web Banking"));
  await waitForText(page, "Sign out");

  await page.context().storageState({ path: storagePath });

  const { onboardIndividualAccountHolder } = await requestApi({
    query: OnboardIndividualAccountHolderDocument,
    variables: {
      input: {
        accountCountry: "FRA",
        accountName: "Test account",
        email: benadyEmail,
        employmentStatus: "Entrepreneur",
        language: "en",
        monthlyIncome: "Between3000And4500",
        residencyAddress: {
          addressLine1: "71 Rue du Faubourg Saint-Martin",
          city: "Paris",
          country: "FRA",
          postalCode: "75010",
          state: "Île-de-France",
        },
      },
    },
  });

  assertTypename(onboardIndividualAccountHolder, "OnboardIndividualAccountHolderSuccessPayload");
  const onboardingId = onboardIndividualAccountHolder.onboarding.id;

  const { finalizeOnboarding } = await requestApi({
    query: FinalizeOnboardingDocument,
    as: "user",
    variables: {
      onboardingId,
    },
  });

  assertTypename(finalizeOnboarding, "FinalizeOnboardingSuccessPayload");

  const { onboarding } = await requestApi({
    query: OnboardingDocument,
    variables: {
      onboardingId,
    },
  });

  const { account, statusInfo } = onboarding;
  assertIsDefined(account);
  assertTypename(statusInfo, "OnboardingFinalizedStatusInfo");

  await saveSession({
    benady: {
      account: {
        id: account.id,
        number: account.number,
        holder: {
          id: account.holder.id,
        },
      },
    },
  });
});
