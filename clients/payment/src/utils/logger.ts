import posthog, { SeverityLevel } from "posthog-js";
import { env } from "./env";

export const initPostHog = () => {
  if (import.meta.env.PROD && env.IS_SWAN_MODE) {
    const token =
      import.meta.env.DEV ||
      env.PAYMENT_URL.includes("master") ||
      env.PAYMENT_URL.includes("preprod")
        ? "phc_6u4uUv6Mp2a9mw7gOMEH8CiS4UEDlUHGuWlkz2OAYQe"
        : "phc_y7DlMezh1CgfrVIvkO2fkZMbJcbMziXCZvrPPWR2X8";

    posthog.init(token, {
      api_host: "https://eu.i.posthog.com",
      defaults: "2025-05-24",
    });
  }
};

type Context = Partial<{
  level: SeverityLevel;
  tags: Record<string, string>;
  extra: Record<string, unknown>;
}>;

export const logFrontendError = (exception: Error, { extra, level, tags }: Context = {}) => {
  posthog.captureException(exception, { extra, level, tags });
};
