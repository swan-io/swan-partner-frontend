import { createFlagsProvider, FlagClient } from "@swan-io/shared-business/src/utils/flags";
import { FlagContext, flagDefaults, Flags } from "../../../../common/flags";
import { projectConfiguration } from "./projectId";

const initialContext: Partial<FlagContext> = {
  projectId: projectConfiguration
    .map<string | undefined>(config => config.projectId)
    .getOr(undefined),
};

export const flagsClient = new FlagClient<Flags, FlagContext>("/api/flags", initialContext);

export const { FlagsProvider, useFlag } = createFlagsProvider(flagsClient, flagDefaults);
