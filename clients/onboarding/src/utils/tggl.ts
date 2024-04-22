import { Option } from "@swan-io/boxed";
import { isNotNullishOrEmpty } from "@swan-io/lake/src/utils/nullish";
import { lowerCase } from "@swan-io/lake/src/utils/string";
import { useMemo } from "react";
import { atom, useAtomWithSelector } from "react-atomic-state";
import { TgglFlags as RawFlags, TgglClient, TgglContext } from "tggl-client";
import { P, match } from "ts-pattern";
import { env } from "./env";
import { projectConfiguration } from "./projectId";

type Flags = {
  // Enforce boolean to avoid Option<true> situations
  [K in keyof RawFlags]: RawFlags[K] extends true ? boolean : RawFlags[K];
};

let savedContext: Partial<TgglContext> = {};
const flagsAtom = atom<Partial<Flags>>({});

const client = isNotNullishOrEmpty(env.TGGL_API_KEY) ? new TgglClient(env.TGGL_API_KEY) : undefined;
client?.onResultChange(flagsAtom.set);

export const updateTgglContext = (context: Partial<TgglContext>) => {
  savedContext = { ...savedContext, ...context };
  void client?.setContext(savedContext);
};

export const useTgglFlag = <K extends keyof Flags>(key: K) => {
  const value = useAtomWithSelector(flagsAtom, flags => flags[key]);
  return useMemo(() => Option.fromNullable<Flags[K]>(value), [value]);
};

// Initial updateTgglContext call to fire onResultChange callback
updateTgglContext({
  environment: match({
    dev: import.meta.env.DEV,
    url: env.BANKING_URL,
  })
    .returnType<TgglContext["environment"]>()
    .with({ dev: true }, () => "development")
    .with({ url: P.string.includes("master") }, () => "master")
    .with({ url: P.string.includes("preprod") }, () => "preprod")
    .otherwise(() => "prod"),

  environmentType: lowerCase(env.SWAN_ENVIRONMENT),
  projectId: projectConfiguration
    .map<string | undefined>(config => config.projectId)
    .getOr(undefined),
});
