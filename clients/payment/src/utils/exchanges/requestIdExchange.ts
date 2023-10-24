// https://github.com/FormidableLabs/urql/blob/a01563329ceb1c40305d6170a64bd69ac2bb4645/docs/common-questions.md

import { isNotNullish, isNullish } from "@swan-io/lake/src/utils/nullish";
import { Exchange, makeOperation } from "@urql/core";
import { customAlphabet } from "nanoid";
import { OperationContext } from "urql";
import { fromValue, map, mergeMap, pipe } from "wonka";

const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
const nanoid = customAlphabet(alphabet, 8);

const unwrapFetchOptions = (context: OperationContext): RequestInit =>
  typeof context.fetchOptions === "function" ? context.fetchOptions() : context.fetchOptions ?? {};

const unwrapHeaders = (headers?: HeadersInit): Record<string, string> => {
  if (isNullish(headers)) {
    return {};
  }

  const isHeaders = headers instanceof Headers;
  const isArray = Array.isArray(headers);

  if (!isArray && !isHeaders) {
    return headers;
  }

  return (isArray ? headers : [...headers.entries()]).reduce((acc, [key, value]) => {
    return isNullish(key) || isNullish(value) ? acc : { ...acc, [key]: value };
  }, {});
};

export const requestIdExchange: Exchange =
  ({ forward }) =>
  ops$ => {
    return pipe(
      ops$,
      mergeMap(operation => {
        const requestId = "req-" + nanoid();
        const fetchOptions = unwrapFetchOptions(operation.context);

        const finalOptions = {
          ...fetchOptions,
          headers: {
            ...unwrapHeaders(fetchOptions.headers),
            "x-request-id": requestId,
          },
        };

        return pipe(
          fromValue(finalOptions),
          map(fetchOptions => {
            return makeOperation(operation.kind, operation, {
              ...operation.context,
              fetchOptions,
            });
          }),
        );
      }),
      forward,
      mergeMap(result => {
        return pipe(
          fromValue(result),
          map(result => {
            // Mutate the fetch output to add back requestId in CombinedError
            if (isNotNullish(result.error)) {
              const fetchOptions = unwrapFetchOptions(result.operation.context);
              const headers = unwrapHeaders(fetchOptions.headers);
              const requestId = headers["x-request-id"];

              if (isNotNullish(requestId)) {
                result.error.requestId = requestId;
              }
            }

            return result;
          }),
        );
      }),
    );
  };
