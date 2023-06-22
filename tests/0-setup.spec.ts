import { test } from "@playwright/test";
import { CreateSandboxUserDocument } from "./graphql/partner-admin";
import { getApiAccessToken, getApiRequester } from "./utils/api";
import { saveSession } from "./utils/session";
import { createEmailAddress } from "./utils/webhook";

test("Setup", async ({ request }) => {
  const requestApi = getApiRequester(request);

  const [accessToken, benadyEmail, saisonEmail] = await Promise.all([
    getApiAccessToken(),
    createEmailAddress(),
    createEmailAddress(),
  ]);

  const [x, y] = await Promise.all([
    requestApi({
      query: CreateSandboxUserDocument,
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
    }),

    requestApi({
      query: CreateSandboxUserDocument,
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
    }),
  ]);

  console.log({ x, y });

  await saveSession({
    accessToken,
    benady: { email: benadyEmail },
    saison: { email: saisonEmail },
  });

  // TODO: Create sandbox users here

  // await page.goto(env.BANKING_URL);
  // await page.pause();
});
