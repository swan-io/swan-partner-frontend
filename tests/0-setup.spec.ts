import { test } from "@playwright/test";
import { saveSession } from "./utils/session";
import { createEmailAddress } from "./utils/webhook";

test("Hello world", async () => {
  const [benadyEmail, saisonEmail] = await Promise.all([
    createEmailAddress(),
    createEmailAddress(),
  ]);

  await saveSession({
    benady: { email: benadyEmail },
    saison: { email: saisonEmail },
  });
});
