import { test } from "@playwright/test";
import { storagePath } from "../playwright.config";
import { EndorseSandboxUserDocument, ResetSandboxUserDocument } from "./graphql/partner-admin";
import { getApiRequester } from "./utils/api";
import { env } from "./utils/env";
import { assertTypename } from "./utils/functions";
import { sca } from "./utils/sca";
import { getButtonByName, waitForText } from "./utils/selectors";
import { saveSession } from "./utils/session";
import { getProjectAccessToken } from "./utils/tokens";
import { createEmailAddress } from "./utils/webhook";

test("Setup", async ({ browser, page, request }) => {
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
      variables: {
        id: env.SANDBOX_USER_BENADY_ID,
        lastName: "Benady",
        firstName: "Nicolas",
      },
    }).then(response => response.updateSandboxUser),

    requestApi({
      query: ResetSandboxUserDocument,
      as: "user",
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
    variables: {
      id: env.SANDBOX_USER_BENADY_ID,
    },
  });

  await page.goto(env.BANKING_URL);
  await sca.loginWithButtonClick(browser, getButtonByName(page, "Sign into Web Banking"));
  await waitForText(page, "Sign out");

  await page.context().storageState({ path: storagePath });
});
