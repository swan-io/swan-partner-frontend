import dotenv from "dotenv";
import path from "pathe";
import { Validator, boolean, string, validate } from "valienv";

dotenv.config({
  path: path.resolve(__dirname, "../../.env.e2e"),
});

const url: Validator<string> = (value = "") => {
  try {
    new URL(value);
    return value;
  } catch {} // eslint-disable-line no-empty
};

export const env = validate({
  env: {
    ...process.env,
    CI: String(process.env.CI === "true"),
  },
  validators: {
    CI: boolean,

    PARTNER_ADMIN_API_URL: url,
    PARTNER_API_URL: url,

    OAUTH_SERVER_URL: url,
    OAUTH_CLIENT_ID: string,
    OAUTH_CLIENT_SECRET: string,

    BANKING_URL: url,
    ONBOARDING_URL: url,
    PAYMENT_URL: url,

    TEST_KEY: string,

    PHONE_NUMBER: string,
    PASSCODE: string,

    SANDBOX_USER_BENADY_ID: string,
    SANDBOX_USER_SAISON_ID: string,

    TWILIO_ACCOUNT_ID: string,
    TWILIO_AUTH_TOKEN: string,
    WEBHOOK_SITE_API_KEY: string,
  },
});
