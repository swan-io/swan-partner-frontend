import { lowerCase } from "@swan-io/lake/src/utils/string";
import { createFlagsProvider, FlagClient } from "@swan-io/shared-business/src/utils/flags";
import { match, P } from "ts-pattern";
import { FlagContext, flagDefaults, Flags } from "../../../../common/flags";
import { env } from "./env";
import { projectConfiguration } from "./projectId";

const initialContext: Partial<FlagContext> = {
  environment: match({
    dev: import.meta.env.DEV,
    url: env.BANKING_URL,
  })
    .returnType<FlagContext["environment"]>()
    .with({ dev: true }, () => "development")
    .with({ url: P.string.includes("master") }, () => "master")
    .with({ url: P.string.includes("preprod") }, () => "preprod")
    .otherwise(() => "prod"),

  environmentType: lowerCase(env.APP_TYPE),
  projectId: projectConfiguration
    .map<string | undefined>(config => config.projectId)
    .getOr(undefined),
};

export const flagsClient = new FlagClient<Flags, FlagContext>("/api/flags", initialContext);

export const { FlagsProvider, useFlag } = createFlagsProvider(flagsClient, flagDefaults);
