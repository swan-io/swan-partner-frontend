import { TgglLocalClient } from "tggl-client";
import { match, P } from "ts-pattern";
import { FlagContext, flagDefaults, Flags } from "../common/flags";
import { env } from "../env";

/**
 * TgglLocalClient fetches the Tggl config from the Tggl server and caches it in memory.
 * Making possible to evaluate flags without making a network request each time.
 * The Tggl config is reloaded every 5 seconds in background to keep flags up to date when updating them in the Tggl dashboard.
 */
const client = new TgglLocalClient({
  apiKey: env.TGGL_SERVER_KEY,
  pollingIntervalMs: 5_000, // reload Tggl config every 5 seconds in background
});

const commonFlagContext: Partial<FlagContext> = {
  environment: match(env.BANKING_URL)
    .returnType<FlagContext["environment"]>()
    .with(P.string.includes("local"), () => "development")
    .with(P.string.includes("master"), () => "master")
    .with(P.string.includes("preprod"), () => "preprod")
    .otherwise(() => "prod"),
  environmentType: env.OAUTH_CLIENT_ID.startsWith("LIVE_") ? "live" : "sandbox",
};

export const getFlagContext = (projectId: string): Partial<FlagContext> => {
  return {
    projectId,
    ...commonFlagContext,
  };
};

export const evaluateFlags = (context: Partial<FlagContext>): Flags => {
  const flags: Record<string, unknown> = client.getAll({ ...context, ...commonFlagContext });

  // Ensure only allowed flags are returned, and apply defaults for missing flags
  const filteredFlags = Object.entries(flagDefaults).map(([key, defaultValue]) => {
    const value = flags[key] ?? defaultValue;
    return [key, value];
  });

  return Object.fromEntries(filteredFlags);
};

export const evaluateFlag = <K extends keyof Flags>(
  flagName: K,
  context: Partial<FlagContext>,
): Flags[K] => {
  return client.get(context, flagName, flagDefaults[flagName]);
};
