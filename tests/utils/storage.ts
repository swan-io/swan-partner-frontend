import { Browser, Page } from "@playwright/test";
import fs from "node:fs/promises";
import { storagePath } from "../../playwright.config";

export const openPageWithStorageState = async (browser: Browser) => {
  await fs.access(storagePath);

  const context = await browser.newContext({
    locale: "en-US",
    storageState: storagePath,
    viewport: {
      width: 1440,
      height: 900,
    },
  });

  return context.newPage();
};

export const saveStorageState = async (page: Page) => {
  await page.context().storageState({ path: storagePath });
};
