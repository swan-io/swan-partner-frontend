import { execSync } from "node:child_process";
import { Validator } from "valienv";

const buffer: Validator<Buffer> = value => Buffer.from(value, "hex");

const url: Validator<string> = value => {
  try {
    new URL(value);
    return value;
  } catch {} // eslint-disable-line no-empty
};

const hex = execSync("./node_modules/@fastify/secure-session/genkey.js").toString("hex");

export const env = {
  NODE_ENV: "development",
  LOG_LEVEL: "info",
  PARTNER_API_URL: "https://api.swan.io/sandbox-partner/graphql",
  UNAUTHENTICATED_API_URL: "https://api.swan.io/sandbox-unauthenticated/graphql",
  OAUTH_SERVER_URL: "https://oauth.swan.io",
  OAUTH_CLIENT_ID: "SANDBOX_70307799-74d4-44e9-880a-b09d196704d9",
  OAUTH_CLIENT_SECRET: "aX2GsVZNATkPB1hUH8kq0iQ4zf",
  COOKIE_KEY: hex,
  BANKING_URL: "https://ifzu1i-43227.csb.app",
  ONBOARDING_URL: "https://ifzu1i-43227.csb.app",
  CLIENT_GOOGLE_MAPS_API_KEY: "YOUR_GOOGLE_MAPS_API_KEY",
  CLIENT_BANKING_URL: "https://ifzu1i-43227.csb.app",
};
/*
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
*/
