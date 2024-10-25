import { Result } from "@swan-io/boxed";
import {
  Client,
  ClientError,
  InvalidGraphQLResponseError,
  parseGraphQLError,
  print,
} from "@swan-io/graphql-client";
import { Request, badStatusToError, emptyToError } from "@swan-io/request";
import { registerErrorToRequestId } from "@swan-io/shared-business/src/state/toasts";
import { GraphQLError } from "graphql";
import { customAlphabet } from "nanoid";
import { P, match } from "ts-pattern";
import schemaConfig from "../../../../scripts/graphql/dist/unauthenticated-schema-config.json";
import { env } from "./env";
const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
const nanoid = customAlphabet(alphabet, 8);

const generateTraceId = () => {
  const buffer = new Uint8Array(16);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, value => value.toString(16).padStart(2, "0")).join("");
};

const generateSpanId = () => {
  const buffer = new Uint8Array(8);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, value => value.toString(16).padStart(2, "0")).join("");
};

const traceparentVersion = "00";
const traceFlags = "01";

export const errorToRequestId = new WeakMap<WeakKey, string>();
registerErrorToRequestId(errorToRequestId);

export const client = new Client({
  url: `${env.PAYMENT_URL}/api/unauthenticated`,
  schemaConfig,
  makeRequest: ({ url, headers, operationName, document, variables }) => {
    const requestId = "req-" + nanoid();
    const traceparent = `${traceparentVersion}-${generateTraceId()}-${generateSpanId()}-${traceFlags}`;

    return Request.make({
      url,
      method: "POST",
      responseType: "json",
      headers: {
        ...headers,
        "x-swan-request-id": requestId,
        traceparent,
      },
      body: JSON.stringify({
        operationName,
        query: print(document),
        variables,
      }),
    })
      .mapOkToResult(badStatusToError)
      .mapOkToResult(emptyToError)
      .mapOkToResult(payload =>
        match(payload as unknown)
          .returnType<Result<unknown, GraphQLError[] | InvalidGraphQLResponseError>>()
          .with({ errors: P.select(P.array()) }, errors =>
            Result.Error(errors.map(parseGraphQLError)),
          )
          .with({ data: P.select(P.nonNullable) }, data => {
            return Result.Ok(data);
          })
          .otherwise(response => Result.Error(new InvalidGraphQLResponseError(response))),
      )
      .tapError(errors => {
        ClientError.forEach(errors, error => {
          try {
            navigator.sendBeacon(
              "/api/errors/report",
              JSON.stringify({
                clientRequestId: requestId,
                clientErrorName: error.name,
                clientErrorMessage: error.message,
              }),
            );
          } catch {}

          errorToRequestId.set(error, requestId);
        });
      });
  },
});
