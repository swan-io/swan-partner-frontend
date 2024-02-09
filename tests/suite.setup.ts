import { test } from "@playwright/test";
import { storagePath } from "../playwright.config";
import { CreateSandboxUserDocument, EndorseSandboxUserDocument } from "./graphql/partner-admin";
import { getApiRequester } from "./utils/api";
import { env } from "./utils/env";
import { assertTypename } from "./utils/functions";
import { sca } from "./utils/sca";
import { getButtonByName, waitForText } from "./utils/selectors";
import { saveSession } from "./utils/session";
import { getProjectAccessToken } from "./utils/tokens";
import { createEmailAddress } from "./utils/webhook";

const SHOULD_RECREATE = true;

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
  });

  if (SHOULD_RECREATE) {
    const [createBenady, createSaison] = await Promise.all([
      requestApi({
        query: CreateSandboxUserDocument,
        as: "user",
        api: "partner-admin",
        variables: {
          lastName: "Benady",
          firstName: "Nicolas",
        },
      }).then(response => response.createSandboxUser),

      requestApi({
        query: CreateSandboxUserDocument,
        as: "user",
        api: "partner-admin",
        variables: {
          lastName: "Saison",
          firstName: "Nicolas",
        },
      }).then(response => response.createSandboxUser),
    ]);

    assertTypename(createBenady, "CreateSandboxUserSuccessPayload");
    assertTypename(createSaison, "CreateSandboxUserSuccessPayload");

    await saveSession({
      benady: { id: createBenady.sandboxUser.id, email: benadyEmail },
      saison: { id: createSaison.sandboxUser.id, email: saisonEmail },
    });

    await requestApi({
      query: EndorseSandboxUserDocument,
      as: "user",
      api: "partner-admin",
      variables: {
        id: createBenady.sandboxUser.id,
      },
    });
  }

  await page.goto(env.BANKING_URL);
  await sca.loginWithButtonClick(browser, getButtonByName(page, "Sign into Web Banking"));
  await waitForText(page, "Sign out");

  await page.context().storageState({ path: storagePath });
});
