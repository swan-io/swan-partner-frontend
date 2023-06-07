import { test } from "@playwright/test";
import { saveSession } from "./utils/session";
import { createEmailAddress } from "./utils/webhook";

test("Hello world", async () => {
  const [companyEmail, individualEmail] = await Promise.all([
    createEmailAddress(),
    createEmailAddress(),
  ]);

  await saveSession({
    companyEmail,
    individualEmail,
  });
});
