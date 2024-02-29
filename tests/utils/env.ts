import dotenv from "dotenv";
import path from "pathe";
import { boolean, string, url, validate } from "valienv";

dotenv.config({
  path: path.resolve(__dirname, "../../.env.e2e"),
});

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

    TWILIO_ACCOUNT_ID: string,
    TWILIO_AUTH_TOKEN: string,
    WEBHOOK_SITE_API_KEY: string,
  },
});
