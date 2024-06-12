import { captureException, init } from "@sentry/browser";
import { P, match } from "ts-pattern";
import { env } from "./env";

export const initSentry = () => {
  init({
    enabled: import.meta.env.PROD && env.IS_SWAN_MODE,
    release: env.VERSION,
    dsn: "https://632023ecffdc437984c7a53bbb3aa7a6@o427297.ingest.sentry.io/5454043",
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

export const logFrontendError = (exception: Error, extra?: Record<string, unknown>) => {
  captureException(exception, {
    extra,
    tags: { scope: "frontend" },
  });
};
