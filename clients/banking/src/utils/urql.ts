import { Option } from "@swan-io/boxed";
import { getLocation } from "@swan-io/chicane";
import { last } from "@swan-io/lake/src/utils/array";
import { isNotNullish, isNullish } from "@swan-io/lake/src/utils/nullish";
import { CombinedError, Operation, OperationResult } from "@urql/core";
import { cacheExchange } from "@urql/exchange-graphcache";
import { relayPagination } from "@urql/exchange-graphcache/extras";
import { P, match } from "ts-pattern";
import { Except, SetRequired } from "type-fest";
import {
  AnyVariables,
  Client,
  UseQueryArgs,
  UseQueryResponse,
  UseQueryState,
  errorExchange,
  fetchExchange,
  useQuery,
} from "urql";
import idLessObjects from "../../../../scripts/graphql/dist/partner-idless-objects.json";
import schema from "../graphql/introspection.json";
import { GraphCacheConfig } from "../graphql/partner";
import { requestIdExchange } from "./exchanges/requestIdExchange";
import { suspenseDedupExchange } from "./exchanges/suspenseDedupExchange";
import { logBackendError } from "./logger";
import { projectConfiguration } from "./projectId";
import { Router } from "./routes";

const onError = (error: CombinedError, operation: Operation) => {
  const response = error.response as Partial<Response> | undefined;

  const is401 =
    response?.status === 401 ||
    error.graphQLErrors.some(error => error.message === "401: Unauthorized");

  if (is401) {
    const { path } = getLocation();

    if (last(path) === "login") {
      return;
    }

    Router.push("ProjectLogin");
  } else {
    logBackendError(error, operation);
  }
};

const partnerCache = cacheExchange<GraphCacheConfig>({
  schema: schema as NonNullable<GraphCacheConfig["schema"]>,

  keys: {
    ...Object.fromEntries(idLessObjects.map(item => [item, (_: unknown) => null])),
    ValidIban: ({ iban }) => iban ?? null,
  },

  resolvers: {
    Query: {
      accounts: relayPagination({ mergeMode: "inwards" }),
      accountMemberships: relayPagination({ mergeMode: "inwards" }),
      cards: relayPagination({ mergeMode: "inwards" }),
    },
    AccountMembership: {
      cards: relayPagination({ mergeMode: "inwards" }),
    },
    Account: {
      invoices: relayPagination({ mergeMode: "inwards" }),
      memberships: relayPagination({ mergeMode: "inwards" }),
      statements: relayPagination({ mergeMode: "inwards" }),
      // TODO Uncomment for transfert section revamp
      // standingOrders: relayPagination({ mergeMode: "inwards" }),
      transactions: relayPagination({ mergeMode: "inwards" }),
      virtualIbanEntries: relayPagination({ mergeMode: "inwards" }),
    },
    Card: {
      transactions: relayPagination({ mergeMode: "inwards" }),
    },
    StandingOrder: {
      payments: relayPagination({ mergeMode: "inwards" }),
    },
    User: {
      accountMemberships: relayPagination({ mergeMode: "inwards" }),
    },
  },
});

export const partnerClient = new Client({
  url: match(projectConfiguration)
    .with(
      Option.P.Some({ projectId: P.select(), mode: "MultiProject" }),
      projectId => `/api/projects/${projectId}/partner`,
    )
    .otherwise(() => `/api/partner`),

  requestPolicy: "network-only",
  suspense: true,
  fetchOptions: { credentials: "include" },
  exchanges: [
    suspenseDedupExchange,
    partnerCache,
    requestIdExchange,
    errorExchange({ onError }),
    fetchExchange,
  ],
});

export const unauthenticatedClient = new Client({
  url: "/api/unauthenticated",
  requestPolicy: "network-only",
  exchanges: [requestIdExchange, errorExchange({ onError }), fetchExchange],
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
