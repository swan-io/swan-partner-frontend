import { captureException, init } from "@sentry/browser";
import { P, match } from "ts-pattern";
import { env } from "./env";

export const initSentry = () => {
  init({
    enabled: import.meta.env.PROD && env.IS_SWAN_MODE,
    release: env.VERSION,
    dsn: "TODO",
    normalizeDepth: 5,

    environment: match({
      dev: import.meta.env.DEV,
      url: env.PAYMENT_URL,
    })
      .with({ dev: true }, () => "dev")
      .with({ url: P.string.includes("master") }, () => "master")
      .with({ url: P.string.includes("preprod") }, () => "preprod")
      .otherwise(() => "prod"),
  });
};

export const logFrontendError = (exception: Error, extra?: Record<string, unknown>) => {
  captureException(exception, {
    extra,
    tags: { scope: "frontend" },
  });
};
