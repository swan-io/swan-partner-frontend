import { Faro, getWebInstrumentations, initializeFaro } from "@grafana/faro-web-sdk";
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
  faro?.api.setUser({
    id: user.id,
  });

  setPostHogUser(user);
  updateTgglContext({ userId: user.id });
};
