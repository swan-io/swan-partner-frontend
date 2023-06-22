import { test } from "@playwright/test";
import { CreateSandboxUserDocument } from "./graphql/partner-admin";
import { getApiRequester } from "./utils/api";
import { assertTypename } from "./utils/functions";
import { sca } from "./utils/sca";
import { saveSession } from "./utils/session";
import { getProjectAccessToken } from "./utils/tokens";
import { createEmailAddress } from "./utils/webhook";

test("Setup", async ({ browser, request }) => {
  const requestApi = getApiRequester(request);

  const [projectAccessToken, userTokens, benadyEmail, saisonEmail] = await Promise.all([
    getProjectAccessToken(),
    sca.login(browser),
    createEmailAddress(),
    createEmailAddress(),
  ]);

  await saveSession({
    project: { accessToken: projectAccessToken },
    user: userTokens,
    benady: { email: benadyEmail },
    saison: { email: saisonEmail },
  });

  const [createBenadySandboxUser, createSaisonSandboxUser] = await Promise.all([
    requestApi({
      query: CreateSandboxUserDocument,
      as: "user",
      variables: {
        input: {
          autoConsent: true,
          birthDate: "01/01/1970",
          firstName: "Nicolas",
          identificationStatus: "Uninitiated",
          lastName: "Benady",
          nationalityCCA3: "FRA",
        },
      },
    }).then(response => response.createSandboxUser),

    requestApi({
      query: CreateSandboxUserDocument,
      as: "user",
      variables: {
        input: {
          autoConsent: true,
          birthDate: "01/01/1970",
          firstName: "Nicolas",
          identificationStatus: "Uninitiated",
          lastName: "Saison",
          nationalityCCA3: "FRA",
        },
      },
    }).then(response => response.createSandboxUser),
  ]);

  assertTypename(createBenadySandboxUser, "CreateSandboxUserSuccessPayload");
  assertTypename(createSaisonSandboxUser, "CreateSandboxUserSuccessPayload");

  await saveSession({
    benady: { id: createBenadySandboxUser.sandboxUser.id },
    saison: { id: createSaisonSandboxUser.sandboxUser.id },
  });
});
