import { Faro, getWebInstrumentations, initializeFaro, LogLevel } from "@grafana/faro-web-sdk";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";
import { match, P } from "ts-pattern";
import { env } from "./env";
import { setPostHogUser } from "./logger";
import { updateTgglContext } from "./tggl";

let faro: Faro | null = null;

const environment = match(env.BANKING_URL)
  .with(P.string.includes("local"), () => null)
  .with(P.string.includes("master"), () => "master")
  .with(P.string.includes("preprod"), () => "preprod")
  .otherwise(() => "production");

const FARO_URL =
  "https://faro-collector-prod-eu-west-6.grafana.net/collect/aba3b58c6a5e67946d2b01d80209268b";

if (environment != null) {
  faro = initializeFaro({
    url: FARO_URL,
    app: {
      name: "banking",
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

type User = {
  id: string;
  firstName: string | undefined;
  lastName: string | undefined;
  phoneNumber: string | undefined;
};

export const setTrackingUser = (user: User) => {
  faro?.api.setUser({ id: user.id });
  setPostHogUser(user);
  updateTgglContext({ userId: user.id });
};

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
