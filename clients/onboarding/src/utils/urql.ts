import { isNotNullish, isNullish } from "@swan-io/lake/src/utils/nullish";
import { cacheExchange } from "@urql/exchange-graphcache";
import { IntrospectionQuery } from "graphql";
import { Except, SetRequired } from "type-fest";
import {
  AnyVariables,
  Client,
  CombinedError,
  dedupExchange,
  errorExchange,
  fetchExchange,
  OperationResult,
  useQuery,
  UseQueryArgs,
  UseQueryResponse,
  UseQueryState,
} from "urql";
import { GraphCacheConfig } from "../graphql/graphcache";
import schema from "../graphql/introspection.json";
import { env } from "./env";
import { requestIdExchange } from "./exchanges/requestIdExchange";
import { logBackendError } from "./logger";

const cache = cacheExchange<GraphCacheConfig>({
  schema: schema as unknown as IntrospectionQuery,
  keys: {
    AddressInfo: _data => null,
    OnboardingCompanyAccountHolderInfo: _data => null,
    OnboardingIndividualAccountHolderInfo: _data => null,
    OnboardingInvalidStatusInfo: _data => null,
    OnboardingValidStatusInfo: _data => null,
    ValidationError: _data => null,
  },
});

export const urql = new Client({
  fetchOptions: () => ({ credentials: "include" }),
  requestPolicy: "network-only",
  suspense: true,
  url: `${env.BANKING_URL}/api/unauthenticated`,
  exchanges: [
    dedupExchange,
    cache,
    requestIdExchange,
    errorExchange({ onError: logBackendError }),
    fetchExchange,
  ],
});

export const parseOperationResult = <T>({ error, data }: OperationResult<T>): T => {
  if (isNotNullish(error)) {
    throw error;
  }

  if (isNullish(data)) {
    throw new CombinedError({
      networkError: new Error("No Content"),
    });
  }

  return data;
};

export const useQueryWithErrorBoundary = <
  Data = unknown,
  Variables extends AnyVariables = AnyVariables,
>(
  options: UseQueryArgs<Variables, Data>,
): [
  SetRequired<Except<UseQueryState<Data, Variables>, "fetching" | "error">, "data">,
  UseQueryResponse[1],
] => {
  const [{ fetching, data, error, ...rest }, reexecuteQuery] = useQuery<Data, Variables>(options);

  if (isNotNullish(error)) {
    throw error;
  }

  if (isNullish(data)) {
    throw new CombinedError({
      networkError: new Error("No Content"),
    });
  }

  return [{ data, ...rest }, reexecuteQuery];
};
