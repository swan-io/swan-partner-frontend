import { test } from "@playwright/test";
import { CreateSandboxUserDocument, EndorseSandboxUserDocument } from "./graphql/partner-admin";
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

  const [createBenady, createSaison] = await Promise.all([
    requestApi({
      query: CreateSandboxUserDocument,
      as: "user",
      variables: {
        firstName: "Nicolas",
        lastName: "Benady",
      },
    }).then(response => response.createSandboxUser),

    requestApi({
      query: CreateSandboxUserDocument,
      as: "user",
      variables: {
        firstName: "Nicolas",
        lastName: "Saison",
      },
    }).then(response => response.createSandboxUser),
  ]);

  assertTypename(createBenady, "CreateSandboxUserSuccessPayload");
  assertTypename(createSaison, "CreateSandboxUserSuccessPayload");

  await saveSession({
    benady: { id: createBenady.sandboxUser.id },
    saison: { id: createSaison.sandboxUser.id },
  });

  await requestApi({
    query: EndorseSandboxUserDocument,
    as: "user",
    variables: {
      id: createBenady.sandboxUser.id,
    },
  });
});
