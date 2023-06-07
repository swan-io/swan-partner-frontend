import { Browser, chromium, devices, Page } from "@playwright/test";
import { REDIRECT_URI } from "./constants";
import { env } from "./env";
import { resolveAfter } from "./functions";
import { clickOnButton, waitForText } from "./selectors";
import { getLastMessageURL } from "./twilio";

const injectE2ETestKey = (page: Page) =>
  page.evaluate(E2E_TEST_KEY => {
    window.__E2E_TEST_KEY_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = E2E_TEST_KEY;
    return Promise.resolve();
  }, env.E2E_TEST_KEY);

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
      await resolveAfter(20000);
    }

    await route.continue();
  });

  await page.goto(url);
  await injectE2ETestKey(page);

  // The page is loaded, unleash the POST requests
  await page.unroute("**/*");

  return page;
};

const fillPasscode = async (page: Page) => {
  const input = page.locator("input:not([readonly])");
  await input.waitFor();
  await input.fill(env.E2E_PASSCODE);
};

const waitForConfirm = async (page: Page) => {
  await waitForText(page, "Done");
  await waitForText(page, "You can now close this page.");
};

const consent = async (consentUrl: string) => {
  const browser = await chromium.launch();
  const startDate = new Date();

  const page = await openPage(browser, "desktop", consentUrl);
  const url = await getLastMessageURL(startDate);
  const mobile = await openPage(browser, "mobile", url);

  await clickOnButton(mobile, "Confirm");
  await fillPasscode(mobile);
  await waitForConfirm(mobile);

  await mobile.close();
  await page.waitForURL(value => value.origin === REDIRECT_URI);
  await page.close();
};

export const sca = {
  consent,
  fillPasscode,
  injectE2ETestKey,
  openPage,
  waitForConfirm,
};
