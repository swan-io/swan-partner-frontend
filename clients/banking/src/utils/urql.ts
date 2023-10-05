import { Option } from "@swan-io/boxed";
import { isNullish } from "@swan-io/lake/src/utils/nullish";
import { CombinedError, Operation } from "@urql/core";
import { cacheExchange } from "@urql/exchange-graphcache";
import { relayPagination } from "@urql/exchange-graphcache/extras";
import { P, match } from "ts-pattern";
import { Client, errorExchange, fetchExchange } from "urql";
import idLessObjects from "../../../../scripts/graphql/dist/partner-idless-objects.json";
import schema from "../graphql/introspection.json";
import { GraphCacheConfig } from "../graphql/partner";
import { requestIdExchange } from "./exchanges/requestIdExchange";
import { suspenseDedupExchange } from "./exchanges/suspenseDedupExchange";
import { logBackendError } from "./logger";
import { projectConfiguration } from "./projectId";
import { Router } from "./routes";

export const isCombinedError = (error: unknown): error is CombinedError =>
  error instanceof CombinedError;

const isUnauthorizedResponse = (response: unknown) => {
  const value = response as { status?: number; statusCode?: number } | undefined;
  return value?.status === 401 || value?.statusCode === 401;
};

const isUnauthorizedLikeString = (value: string) => {
  const lowerCased = value.toLowerCase();
  return lowerCased.includes("unauthenticated") || lowerCased.includes("unauthorized");
};

export const isUnauthorizedError = (error: unknown) => {
  if (!isCombinedError(error)) {
    return false;
  }

  const { graphQLErrors, message } = error;
  const response = error.response as unknown;

  return (
    isUnauthorizedResponse(response) ||
    isUnauthorizedLikeString(message) ||
    graphQLErrors.some(
      ({ extensions, message }) =>
        isUnauthorizedResponse(extensions.response) || isUnauthorizedLikeString(message),
    )
  );
};

const onError = (error: CombinedError, operation: Operation) => {
  if (isUnauthorizedError(error)) {
    if (isNullish(Router.getRoute(["ProjectLogin"]))) {
      window.location.replace(Router.ProjectLogin({ sessionExpired: "true" }));
    }
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
