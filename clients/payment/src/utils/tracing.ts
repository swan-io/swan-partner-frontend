import { Faro, getWebInstrumentations, initializeFaro } from "@grafana/faro-web-sdk";
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

    instrumentations: [...getWebInstrumentations(), new TracingInstrumentation()],
  });
}

export const logFrontendError = (exception: Error) => {
  faro?.api.pushError(exception);
};
