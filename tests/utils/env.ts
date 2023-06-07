import dotenv from "dotenv";
import { boolean, string, validate } from "valienv";

dotenv.config();

const CI = process.env.CI === String(true);

export const env = validate({
  env: {
    ...process.env,
    CI: String(CI),
  },
  validators: {
    CI: boolean,

    E2E_PHONE_NUMBER: string,
    E2E_PASSCODE: string,
    E2E_TEST_KEY: string,

    TWILIO_ACCOUNT_ID: string,
    TWILIO_AUTH_TOKEN: string,
    WEBHOOK_API_KEY: string,
    WEBHOOK_API_URL: string,
  },
});
