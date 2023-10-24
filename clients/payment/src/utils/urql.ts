import { cacheExchange } from "@urql/exchange-graphcache";
import { Client, CombinedError, Operation, errorExchange, fetchExchange } from "urql";
import schema from "../graphql/introspection.json";
import { GraphCacheConfig } from "../graphql/unauthenticated";
import { env } from "./env";
import { requestIdExchange } from "./exchanges/requestIdExchange";
import { suspenseDedupExchange } from "./exchanges/suspenseDedupExchange";
import { logBackendError } from "./logger";

export const isCombinedError = (error: unknown): error is CombinedError =>
  error instanceof CombinedError;

const unauthenticatedCache = cacheExchange<GraphCacheConfig>({
  schema: schema as NonNullable<GraphCacheConfig["schema"]>,
});

const onError = (error: CombinedError, operation: Operation) => {
  logBackendError(error, operation);
};

export const unauthenticatedClient = new Client({
  url: `${env.BANKING_URL}/api/unauthenticated`,
  requestPolicy: "network-only",
  suspense: true,
  exchanges: [
    suspenseDedupExchange,
    unauthenticatedCache,
    requestIdExchange,
    errorExchange({ onError }),
    fetchExchange,
  ],
});
