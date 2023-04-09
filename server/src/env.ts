import { oneOf, string, validate, Validator } from "valienv";

const buffer: Validator<Buffer> = value => Buffer.from(value, "hex");

export const url: Validator<string> = value => {
  try {
    new URL(value);
    return value;
  } catch {} // eslint-disable-line no-empty
};

export const env = validate({
  env: process.env,
  validators: {
    NODE_ENV: oneOf("development", "production", "test"),
    LOG_LEVEL: oneOf("fatal", "error", "warn", "info", "debug", "trace", "silent"),
    PARTNER_API_URL: url,
    UNAUTHENTICATED_API_URL: url,
    OAUTH_SERVER_URL: url,
    OAUTH_CLIENT_ID: string,
    OAUTH_CLIENT_SECRET: string,
    COOKIE_KEY: buffer,

    BANKING_URL: url,
    ONBOARDING_URL: url,
  },
});
