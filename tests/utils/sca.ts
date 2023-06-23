import { Browser, devices, Page } from "@playwright/test";
import { REDIRECT_URI } from "./constants";
import { env } from "./env";
import { assertIsDefined, wait } from "./functions";
import { clickOnButton, waitForText } from "./selectors";
import { getUserAuthLink, getUserTokens } from "./tokens";
import { getLastMessageURL } from "./twilio";

const injectTestKey = (page: Page) =>
  page.evaluate(TEST_KEY => {
    window.__E2E_TEST_KEY_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = TEST_KEY;
    return Promise.resolve();
  }, env.TEST_KEY);

const openPage = async (browser: Browser, type: "desktop" | "mobile", url: string) => {
  const context = await browser.newContext({
    ...(type === "mobile" && devices["Pixel 4"]),
    locale: "en-US",
  });

  const page = await context.newPage();

  // Throttle network so E2E test key can be injected before any request
  // We throttle API calls only, not GETs are they are used to load the page (*.js, *.css)
  await page.route("**/*", async (route, request) => {
    const method = request.method().toUpperCase();

    if (method === "POST") {
      // It's OK to have a huge leeway since unroute will be called before
      await wait(20000);
    }

    await route.continue();
  });

  await page.goto(url);
  await injectTestKey(page);

  // The page is loaded, unleash the POST requests
  await page.unroute("**/*");

  return page;
};

const fillPasscode = async (page: Page) => {
  const input = page.locator("input:not([readonly])");
  await input.waitFor();
  await input.fill(env.PASSCODE);
};

const waitForConfirm = async (page: Page) => {
  await waitForText(page, "Done");
  await waitForText(page, "You can now close this page.");
};

const waitForPostKycConfirm = async (page: Page) => {
  await waitForText(page, "Prove your identity in the Sandbox");
  await clickOnButton(page, "Next");

  await waitForConfirm(page);
};

const waitForAnyConfirm = async (page: Page) => {
  await Promise.race([waitForPostKycConfirm(page), waitForConfirm(page)]);
};

const login = async (browser: Browser) => {
  const authLink = getUserAuthLink();
  const startDate = new Date();

  const page = await openPage(browser, "desktop", authLink);
  const url = await getLastMessageURL({ startDate });
  const mobile = await openPage(browser, "mobile", url);

  await clickOnButton(mobile, "Confirm");
  await fillPasscode(mobile);
  await waitForAnyConfirm(mobile);

  await mobile.close();
  await page.waitForURL(value => value.origin === REDIRECT_URI);

  const code = new URL(page.url()).searchParams.get("code");
  assertIsDefined(code);

  const tokens = await getUserTokens(code);
  await page.close();

  return tokens;
};

const consent = async (browser: Browser, consentUrl: string) => {
  const startDate = new Date();

  const page = await openPage(browser, "desktop", consentUrl);
  const url = await getLastMessageURL({ startDate });
  const mobile = await openPage(browser, "mobile", url);

  await clickOnButton(mobile, "Confirm");
  await fillPasscode(mobile);
  await waitForAnyConfirm(mobile);

  await mobile.close();
  await page.waitForURL(value => value.origin === REDIRECT_URI);
  await page.close();
};

export const sca = {
  login,
  consent,
};
