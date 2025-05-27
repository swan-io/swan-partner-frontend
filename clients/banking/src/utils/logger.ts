import { captureException, init } from "@sentry/browser";
import { P, match } from "ts-pattern";
import { env } from "./env";

export { setUser as setSentryUser } from "@sentry/browser";

export const initSentry = () => {
  init({
   enabled: import.meta.env.PROD,
    release: env.VERSION,
    dsn: "https://7b550bf832bde04f0ae26426ce623163@o122726.ingest.us.sentry.io/4509388867371008",
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
