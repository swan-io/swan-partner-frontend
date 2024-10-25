import { PlaywrightTestConfig, defineConfig, devices } from "@playwright/test";
import path from "pathe";
import { env } from "./tests/utils/env";

const seconds = (value: number) => value * 1000;
const minutes = (value: number) => value * seconds(60);

export const testDir = path.join(__dirname, "tests");
export const testResultsDir = path.join(testDir, "results");

const outputDir = path.join(testResultsDir, "output");
const reportDir = path.join(testResultsDir, "report");

export const storagePath = path.join(testResultsDir, "storage.json");
export const sessionPath = path.join(testResultsDir, "session.json");

const useOptions: PlaywrightTestConfig["use"] = {
  ...devices["Desktop Chrome"],
  headless: env.CI,
  locale: "en-US",
  actionTimeout: seconds(20),
  navigationTimeout: seconds(20),
  trace: "on",
  viewport: {
    width: 1440,
    height: 900,
  },
};

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

  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      use: useOptions,
    },
    {
      name: "onboarding",
      dependencies: ["setup"],
      testMatch: /.*\.onboarding\.ts/,
      use: useOptions,
    },
    {
      name: "banking",
      dependencies: ["setup"],
      testMatch: /.*\.banking\.ts/,
      use: {
        ...useOptions,
        storageState: storagePath,
      },
    },
  ],

  webServer: {
    command: "pnpm dev-e2e",
    url: env.BANKING_URL,
    reuseExistingServer: !env.CI,
    stderr: "pipe",
    stdout: "ignore",
  },
});
