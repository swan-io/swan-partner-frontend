import { Browser, devices, expect, Locator, Page } from "@playwright/test";
import { REDIRECT_URI } from "./constants";
import { env } from "./env";
import { assertIsDefined } from "./functions";
import { clickOnButton, getByText, waitForText } from "./selectors";
import { getUserAuthLink, getUserTokens } from "./tokens";
import { getLastMessageURL } from "./twilio";

const openPage = async (browser: Browser, type: "desktop" | "mobile", url: string) => {
  const context = await browser.newContext({
    ...(type === "mobile" && devices["Pixel 4"]),
    locale: "en-US",
  });

  await context.addInitScript({
    content: `window.__E2E_TEST_KEY_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = ${JSON.stringify(
      env.TEST_KEY,
    )}`,
  });

  const page = await context.newPage();

  await page.goto(url);

  return page;
};

const fillPasscode = async (page: Page) => {
  const input = page.locator("input:not([readonly])");
  await input.waitFor();
  await input.fill(env.PASSCODE);
};

const waitForConfirm = async (page: Page) => {
  const sandboxTitle = getByText(page, "Prove your identity in the Sandbox");
  const confirmTitle = getByText(page, "Done");

  await expect(sandboxTitle.or(confirmTitle)).toBeVisible();

  if (await sandboxTitle.isVisible()) {
    await clickOnButton(page, "Next");
  }

  await waitForText(page, "Done");
  await waitForText(page, "You can now close this page.");
};

const loginWithButtonClick = async (browser: Browser, button: Locator) => {
  await button
    .page()
    .context()
    .addInitScript({
      content: `window.__E2E_TEST_KEY_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = ${JSON.stringify(
        env.TEST_KEY,
      )}`,
    });

  const popupEventPromise = button.page().waitForEvent("popup");

  await button.click();

  const popup = await popupEventPromise;
  await popup.waitForLoadState();

  const input = popup.locator('[type="tel"]');
  await input.waitFor();
  await input.fill(env.PHONE_NUMBER);

  const startDate = new Date();
  await clickOnButton(popup, "Continue");

  const url = await getLastMessageURL(startDate);
  const mobile = await openPage(browser, "mobile", url);

  await clickOnButton(mobile, "Confirm");
  await fillPasscode(mobile);
  await waitForConfirm(mobile);

  await mobile.close();
  await popup.waitForEvent("close");
};

const loginWithAuthLink = async (browser: Browser) => {
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
  loginWithAuthLink,
  loginWithButtonClick,
  consent,
};
