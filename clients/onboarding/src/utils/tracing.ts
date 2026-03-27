import { getWebInstrumentations, initializeFaro } from "@grafana/faro-web-sdk";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";
import { match, P } from "ts-pattern";
import { env } from "./env";

const environment = match(env.BANKING_URL)
  .with(P.string.includes("local"), () => null)
  .with(P.string.includes("master"), () => "master")
  .with(P.string.includes("preprod"), () => "preprod")
  .otherwise(() => "production");

const FARO_URL =
  "https://faro-collector-prod-eu-west-6.grafana.net/collect/84a9c35701413e068ef36259fdcb57bd";

if (environment != null) {
  initializeFaro({
    url: FARO_URL,
    app: {
      name: "onboarding",
      version: env.VERSION,
      environment,
    },

    instrumentations: [...getWebInstrumentations(), new TracingInstrumentation()],
  });
}
