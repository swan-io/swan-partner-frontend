import { isNotNullish, isNullish } from "@swan-io/lake/src/utils/nullish";
import { cacheExchange } from "@urql/exchange-graphcache";
import { Except, SetRequired } from "type-fest";
import {
  AnyVariables,
  Client,
  CombinedError,
  OperationResult,
  UseQueryArgs,
  UseQueryResponse,
  UseQueryState,
  errorExchange,
  fetchExchange,
  useQuery,
} from "urql";
import schema from "../graphql/introspection.json";
import { GraphCacheConfig } from "../graphql/unauthenticated";
import { env } from "./env";
import { requestIdExchange } from "./exchanges/requestIdExchange";
import { suspenseDedupExchange } from "./exchanges/suspenseDedupExchange";
import { logBackendError } from "./logger";

const unauthenticatedCache = cacheExchange<GraphCacheConfig>({
  schema: schema as NonNullable<GraphCacheConfig["schema"]>,

  keys: {
    AddressInfo: _data => null,
    OnboardingCompanyAccountHolderInfo: _data => null,
    OnboardingIndividualAccountHolderInfo: _data => null,
    OnboardingInvalidStatusInfo: _data => null,
    OnboardingValidStatusInfo: _data => null,
    ValidationError: _data => null,
  },
});

export const unauthenticatedClient = new Client({
  url: `${env.BANKING_URL}/api/unauthenticated`,
  requestPolicy: "network-only",
  suspense: true,
  exchanges: [
    suspenseDedupExchange,
    unauthenticatedCache,
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
