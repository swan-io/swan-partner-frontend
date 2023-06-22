import { test } from "@playwright/test";
import { env } from "./utils/env";
import { saveSession } from "./utils/session";
import { createEmailAddress } from "./utils/webhook";

test("Hello world", async ({ page }) => {
  const [benadyEmail, saisonEmail] = await Promise.all([
    createEmailAddress(),
    createEmailAddress(),
  ]);

  await saveSession({
    benady: { email: benadyEmail },
    saison: { email: saisonEmail },
  });

  await page.goto(env.BANKING_URL);
  await page.pause();
});
