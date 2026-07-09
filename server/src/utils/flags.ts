import { Result } from "@swan-io/boxed";
import { FastifyBaseLogger } from "fastify";
import { match, P } from "ts-pattern";
import { FlagContext, flagDefaults, Flags } from "../common/flags";
import { env } from "../env";

export const getFlagContext = (projectId: string): Partial<FlagContext> => {
  return {
    environment: match({
      url: env.BANKING_URL,
    })
      .returnType<FlagContext["environment"]>()
      .with({ url: P.string.includes("local") }, () => "development")
      .with({ url: P.string.includes("master") }, () => "master")
      .with({ url: P.string.includes("preprod") }, () => "preprod")
      .otherwise(() => "prod"),
    projectId,
    environmentType: env.OAUTH_CLIENT_ID.startsWith("LIVE_") ? "live" : "sandbox",
  };
};

export const evaluateFlags = async (
  context: Partial<FlagContext>,
  log: FastifyBaseLogger,
): Promise<Flags> => {
  const flagsResult = await Result.fromPromise(
    fetch("https://api.tggl.io/flags", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tggl-api-key": env.TGGL_SERVER_KEY,
      },
      body: JSON.stringify(context),
    }).then(async res => {
      if (!res.ok) {
        const text = await res.text();
        log.error(`Failed to fetch flags from TGGL API: ${res.status} - ${text}`);
        throw new Error(`Failed to fetch flags from TGGL API: ${res.status}`);
      } else {
        return res.json();
      }
    }),
  );

  const flagsData = flagsResult.toOption().getOr({});

  // Ensure only allowed flags are returned, and apply defaults for missing flags
  const flagsResponse = Object.entries(flagDefaults).map(([key, defaultValue]) => {
    const value = flagsData[key] ?? defaultValue;
    return [key, value];
  });

  return Object.fromEntries(flagsResponse);
};

export const evaluateFlag = async <K extends keyof Flags>(
  flagName: K,
  context: Partial<FlagContext>,
  log: FastifyBaseLogger,
): Promise<Flags[K]> => {
  const flags = await evaluateFlags(context, log);
  return flags[flagName];
};
