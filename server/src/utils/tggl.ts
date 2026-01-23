import { TgglContext, TgglLocalClient } from "tggl-client";
import { match, P } from "ts-pattern";
import { env } from "../env";

const tgglClient = new TgglLocalClient({
  apiKey: env.TGGL_SERVER_KEY,
});

export const getTgglClient = (projectId: string) => {
  return tgglClient.createClientForContext({
    environment: match({
      url: env.BANKING_URL,
    })
      .returnType<TgglContext["environment"]>()
      .with({ url: P.string.includes("local") }, () => "development")
      .with({ url: P.string.includes("master") }, () => "master")
      .with({ url: P.string.includes("preprod") }, () => "preprod")
      .otherwise(() => "prod"),
    projectId,
    environmentType: env.OAUTH_CLIENT_ID.startsWith("LIVE_") ? "live" : "sandbox",
  } as TgglContext);
};
