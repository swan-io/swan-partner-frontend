import { Faro, getWebInstrumentations, initializeFaro, LogLevel } from "@grafana/faro-web-sdk";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";
import { match, P } from "ts-pattern";
import { env } from "./env";

let faro: Faro | null = null;

const environment = match(env.PAYMENT_URL)
  .with(P.string.includes("local"), () => null)
  .with(P.string.includes("master"), () => "master")
  .with(P.string.includes("preprod"), () => "preprod")
  .otherwise(() => "production");

const FARO_URL =
  "https://faro-collector-prod-eu-west-6.grafana.net/collect/d992bd1eafe72642724e993ba05f6df6";

if (environment != null) {
  faro = initializeFaro({
    url: FARO_URL,
    app: {
      name: "payment",
      version: env.VERSION,
      environment,
    },
    sessionTracking: {
      enabled: true,
      persistent: true,
    },

    instrumentations: [...getWebInstrumentations(), new TracingInstrumentation()],
  });
}

export const logger = {
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
