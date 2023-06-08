import { PlaywrightTestConfig } from "@playwright/test";
import path from "pathe";
import { env } from "./tests/utils/env";
import { minutes, seconds } from "./tests/utils/functions";

export const testDir = path.join(__dirname, "tests");
export const testResultsDir = path.join(testDir, "results");

const outputDir = path.join(testResultsDir, "output");
const reportDir = path.join(testResultsDir, "report");

export const sessionPath = path.join(testResultsDir, "session.json");
export const storagePath = path.join(testResultsDir, "storage");

const config: PlaywrightTestConfig = {
  globalSetup: path.join(testDir, "global-setup"),
  globalTeardown: path.join(testDir, "global-teardown"),

  forbidOnly: env.CI,
  maxFailures: 1,
  preserveOutput: "always",
  timeout: minutes(5),
  workers: 1,

  testDir,
  outputDir,

  reporter: [["line"], ["html", { outputFolder: reportDir }]],

  expect: {
    timeout: seconds(20),
  },

  use: {
    headless: env.CI,
    browserName: "chromium",
    trace: "on",
    locale: "en-US",
    navigationTimeout: seconds(20),
    actionTimeout: seconds(20),
    viewport: {
      width: 1440,
      height: 900,
    },
  },
};

export default config;
