import { Browser, devices, Locator, Page } from "@playwright/test";
import { REDIRECT_URI } from "./constants";
import { env } from "./env";
import { assertIsDefined, wait } from "./functions";
import { clickOnButton, getByText, waitForText } from "./selectors";
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
  if (await getByText(page, "Prove your identity in the Sandbox").isVisible()) {
    await clickOnButton(page, "Next");
  }

  await waitForText(page, "Done");
  await waitForText(page, "You can now close this page.");
};

const loginUsingButtonClick = async (browser: Browser, button: Locator) => {
  const [popup] = await Promise.all([button.page().waitForEvent("popup"), button.click()]);
  await injectTestKey(popup);

  const input = popup.locator('[type="tel"]');
  await input.waitFor();
  await input.fill(env.PHONE_NUMBER);

  const startDate = new Date();
  await clickOnButton(popup, "Next");

  const url = await getLastMessageURL(startDate);
  const mobile = await openPage(browser, "mobile", url);

  await clickOnButton(mobile, "Confirm");
  await fillPasscode(mobile);
  await waitForConfirm(mobile);

  await mobile.close();
  await popup.waitForEvent("close");
};

const loginUsingAuthLink = async (browser: Browser) => {
  const authLink = getUserAuthLink();
  const startDate = new Date();

  const page = await openPage(browser, "desktop", authLink);
  const url = await getLastMessageURL(startDate);
  const mobile = await openPage(browser, "mobile", url);

  await clickOnButton(mobile, "Confirm");
  await fillPasscode(mobile);
  await waitForConfirm(mobile);

  await mobile.close();
  await page.waitForURL(value => value.origin === REDIRECT_URI);

  const code = new URL(page.url()).searchParams.get("code");
  assertIsDefined(code);

  const tokens = await getUserTokens(code);
  await page.close();

  return tokens;
};

const consent = async (browser: Browser, startDate: Date) => {
  const url = await getLastMessageURL(startDate);
  const mobile = await openPage(browser, "mobile", url);

  await clickOnButton(mobile, "Confirm");
  await fillPasscode(mobile);
  await waitForConfirm(mobile);

  await mobile.close();
};

export const sca = {
  loginUsingAuthLink,
  loginUsingButtonClick,
  consent,
};
