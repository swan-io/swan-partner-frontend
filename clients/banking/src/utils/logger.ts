import { captureException, init } from "@sentry/react";
import { P, match } from "ts-pattern";
import { env } from "./env";
import { isCombinedError } from "./urql";

export { setUser as setSentryUser } from "@sentry/react";

export const initSentry = () => {
  init({
    enabled: import.meta.env.PROD && env.IS_SWAN_MODE,
    release: env.VERSION,
    dsn: "https://7c5c2f093c5f4fe497f727d2bbdb104c@o427297.ingest.sentry.io/5371150",
    normalizeDepth: 5,

    environment: match({
      dev: import.meta.env.DEV,
      url: env.BANKING_URL,
    })
      .with({ dev: true }, () => "dev")
      .with({ url: P.string.includes("master") }, () => "master")
      .with({ url: P.string.includes("preprod") }, () => "preprod")
      .otherwise(() => "prod"),
  });
};

export const logFrontendError = (exception: unknown, extra?: Record<string, unknown>) => {
  if (!isCombinedError(exception)) {
    captureException(exception, {
      extra,
      tags: { scope: "frontend" },
    });
  }
};
