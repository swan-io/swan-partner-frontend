import { Validator, oneOf, string, url, validate } from "valienv";

const buffer: Validator<Buffer> = (value = "") => Buffer.from(value, "hex");

export const env = validate({
  env: process.env,
  validators: {
    NODE_ENV: oneOf("development", "production", "test"),
    LOG_LEVEL: oneOf("fatal", "error", "warn", "info", "debug", "trace", "silent"),

    PARTNER_API_URL: url,
    PARTNER_ADMIN_API_URL: url,
    UNAUTHENTICATED_API_URL: url,

    OAUTH_SERVER_URL: url,
    OAUTH_CLIENT_ID: string,
    OAUTH_CLIENT_SECRET: string,

    COOKIE_KEY: buffer,

    BANKING_URL: url,
    ONBOARDING_URL: url,
    PAYMENT_URL: url,
  },
});
