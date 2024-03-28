import { Client, CombinedError, fetchExchange } from "urql";
import { env } from "./env";
import { requestIdExchange } from "./exchanges/requestIdExchange";
import { suspenseDedupExchange } from "./exchanges/suspenseDedupExchange";

export const isCombinedError = (error: unknown): error is CombinedError =>
  error instanceof CombinedError;

export const unauthenticatedClient = new Client({
  url: `${env.PAYMENT_URL}/api/unauthenticated`,
  requestPolicy: "network-only",
  suspense: true,
  exchanges: [suspenseDedupExchange, requestIdExchange, fetchExchange],
});
