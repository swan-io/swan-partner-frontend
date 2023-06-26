import { defineConfig } from "@playwright/test";
import path from "pathe";
import { env } from "./tests/utils/env";

const seconds = (value: number) => value * 1000;
const minutes = (value: number) => value * seconds(60);

export const testDir = path.join(__dirname, "tests");
export const testResultsDir = path.join(testDir, "results");

const outputDir = path.join(testResultsDir, "output");
const reportDir = path.join(testResultsDir, "report");

export const sessionPath = path.join(testResultsDir, "session.json");
export const storagePath = path.join(testResultsDir, "storage");

export default defineConfig({
  globalSetup: path.join(testDir, "global-setup"),
  globalTeardown: path.join(testDir, "global-teardown"),

  forbidOnly: env.CI,
  maxFailures: 1,
  workers: 1,
  preserveOutput: "always",
  timeout: minutes(5),

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

  webServer: {
    command: "yarn dev-e2e",
    url: env.BANKING_URL,
    reuseExistingServer: false, // TODO: use !env.CI
    stderr: "pipe",
    stdout: "ignore",
  },
});
