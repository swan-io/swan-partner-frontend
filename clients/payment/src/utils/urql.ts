import { Client, CombinedError, Operation, errorExchange, fetchExchange } from "urql";
import { env } from "./env";
import { requestIdExchange } from "./exchanges/requestIdExchange";
import { suspenseDedupExchange } from "./exchanges/suspenseDedupExchange";
import { logBackendError } from "./logger";

export const isCombinedError = (error: unknown): error is CombinedError =>
  error instanceof CombinedError;

const onError = (error: CombinedError, operation: Operation) => {
  logBackendError(error, operation);
};

export const unauthenticatedClient = new Client({
  url: `${env.PAYMENT_URL}/api/unauthenticated`,
  requestPolicy: "network-only",
  suspense: true,
  exchanges: [suspenseDedupExchange, requestIdExchange, errorExchange({ onError }), fetchExchange],
});
