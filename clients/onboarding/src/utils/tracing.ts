import { Faro, getWebInstrumentations, initializeFaro, LogLevel } from "@grafana/faro-web-sdk";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";
import { match, P } from "ts-pattern";
import { env } from "./env";

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

    instrumentations: [...getWebInstrumentations(), new TracingInstrumentation()],
  });
}

type Context = {
  level?: LogLevel;
  tag?: string;
  extra?: Record<string, string>;
};

export const logFrontendError = (exception: Error, context?: Context) => {
  faro?.api.pushError(exception, {
    context: {
      ...(context?.level != null ? { level: context.level } : null),
      ...(context?.tag != null ? { tag: context.tag } : null),
      ...context?.extra,
    },
  });
};
