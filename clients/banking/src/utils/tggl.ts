import { lowerCase } from "@swan-io/lake/src/utils/string";
import { TgglClient, TgglContext } from "react-tggl-client";
import { P, match } from "ts-pattern";
import { env } from "./env";
import { projectConfiguration } from "./projectId";

import { Buffer } from "node:buffer";
globalThis.Buffer = Buffer;

export const tgglClient = new TgglClient({
  apiKey: env.TGGL_API_KEY,
  initialContext: {
    environment: match({
      dev: import.meta.env.DEV,
      url: env.BANKING_URL,
    })
      .returnType<TgglContext["environment"]>()
      .with({ dev: true }, () => "development")
      .with({ url: P.string.includes("master") }, () => "master")
      .with({ url: P.string.includes("preprod") }, () => "preprod")
      .otherwise(() => "prod"),

    environmentType: lowerCase(env.APP_TYPE),
    projectId: projectConfiguration
      .map<string | undefined>(config => config.projectId)
      .getOr(undefined),
  },
});
