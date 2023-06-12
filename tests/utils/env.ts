import dotenv from "dotenv";
import { boolean, string, validate } from "valienv";

dotenv.config();

const CI = process.env.CI === String(true);

const e2eEnv = Object.fromEntries(
  Object.entries(process.env)
    .filter(([key]) => key.startsWith("E2E_"))
    .map(([key, value]) => [key.replace("E2E_", ""), value]),
);

export const env = validate({
  env: {
    ...e2eEnv,
    CI: String(CI),
  },
  validators: {
    CI: boolean,

    PHONE_NUMBER: string,
    PASSCODE: string,
    TEST_KEY: string,

    TWILIO_ACCOUNT_ID: string,
    TWILIO_AUTH_TOKEN: string,
    WEBHOOK_SITE_API_KEY: string,
  },
});
