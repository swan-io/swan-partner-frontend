import { test } from "@playwright/test";
import { env } from "./utils/env";
import { waitForText } from "./utils/selectors";

test("Onboarding", async ({ page }) => {
  await page.goto(`${env.ONBOARDING_URL}/onboarding/individual/start`);
  await waitForText(page, "NOT IN THIS PAGE");
  // await page.pause();
});
