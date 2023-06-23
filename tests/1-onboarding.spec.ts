import { test } from "@playwright/test";
import { env } from "./utils/env";

test("Onboarding", async ({ page }) => {
  await page.goto(`${env.ONBOARDING_URL}/onboarding/individual/start`);
  await page.pause();
});
