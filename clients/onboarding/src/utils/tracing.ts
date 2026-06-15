import { Faro, getWebInstrumentations, initializeFaro, LogLevel } from "@grafana/faro-web-sdk";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";
import { subscribeToLocation } from "@swan-io/chicane";
import { match, P } from "ts-pattern";
import { env } from "./env";
import { posthogLogger } from "./logger";

let faro: Faro | null = null;

const environment = match(env.BANKING_URL)
  .with(P.string.includes("local"), () => null)
  .with(P.string.includes("master"), () => "master")
  .with(P.string.includes("preprod"), () => "preprod")
  .otherwise(() => "production");

const FARO_URL =
  "https://faro-collector-prod-eu-west-6.grafana.net/collect/84a9c35701413e068ef36259fdcb57bd";

if (environment != null) {
  faro = initializeFaro({
    url: FARO_URL,
    app: {
      name: "onboarding",
      version: env.VERSION,
      environment,
    },
    sessionTracking: {
      enabled: true,
      persistent: true,
    },

    instrumentations: [
      ...getWebInstrumentations({
        // disable capture console to control logs we send to Faro with logger.info/warn/error
        // this avoid to send info and warn triggered by 3rd party scripts which are not actionable for us
        captureConsole: false,
      }),
      new TracingInstrumentation(),
    ],
  });
}

subscribeToLocation(location => {
  console.log("Location changed", location);
  const pathname = location.path
    .map(segment => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        segment,
      );
      return isUuid ? "<id>" : segment;
    })
    .join("/");

  logger.event("pageview", { pathname });
});

export const logger = {
  event: (name: string, properties?: Record<string, string>) => {
    console.log("EVENT", name, properties);
    faro?.api.pushEvent(name, properties);

    // Don't send pageview to posthog because their sdk automatically captures pageview
    if (name !== "pageview") {
      posthogLogger.event(name, properties);
    }
  },
  info: (message: string, context?: Record<string, string>) => {
    console.log("INFO", message, context);
    faro?.api.pushLog([message], { level: LogLevel.INFO, context });
  },

  warn: (message: string, context?: Record<string, string>) => {
    console.warn("WARN", message, context);
    faro?.api.pushLog([message], { level: LogLevel.WARN, context });
  },

  error: (error: unknown, context?: Record<string, string>) => {
    console.error("ERROR", error, context);

    match(error)
      .with(P.instanceOf(Error), error => {
        faro?.api.pushError(error, { context });
      })
      .with(P.array(P.instanceOf(Error)), errors => {
        errors.forEach(error => {
          faro?.api.pushError(error, { context });
        });
      })
      .with({ __typename: P.string, message: P.string }, ({ __typename, message }) => {
        const error = new Error(`${__typename}: ${message}`);
        faro?.api.pushError(error, { context });
      })
      .otherwise(error => {
        const err = new Error(`Unknown error format: ${JSON.stringify(error)}`);
        faro?.api.pushError(err, { context });
      });
  },
};
