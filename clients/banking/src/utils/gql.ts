import { Future, Option, Result } from "@swan-io/boxed";
import { getLocation } from "@swan-io/chicane";
import {
  Client,
  ClientError,
  InvalidGraphQLResponseError,
  MakeRequest,
  parseGraphQLError,
  print,
} from "@swan-io/graphql-client";
import { isNullish } from "@swan-io/lake/src/utils/nullish";
import { Request, badStatusToError, emptyToError } from "@swan-io/request";
import { registerErrorToRequestId } from "@swan-io/shared-business/src/state/toasts";
import { GraphQLError } from "graphql";
import { customAlphabet } from "nanoid";
import { P, match } from "ts-pattern";
import partnerSchemaConfig from "../../../../scripts/graphql/dist/partner-schema-config.json";
import unauthenticatedSchemaConfig from "../../../../scripts/graphql/dist/unauthenticated-schema-config.json";
import { projectConfiguration } from "./projectId";
import { Router } from "./routes";

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

const isUnauthorizedResponse = (response: unknown) => {
  const value = response as { status?: number; statusCode?: number } | undefined;
  return value?.status === 401 || value?.statusCode === 401;
};

const isUnauthorizedLikeString = (value: string) => {
  const lowerCased = value.toLowerCase();
  return lowerCased.includes("unauthenticated") || lowerCased.includes("unauthorized");
};

export const filterOutUnauthorizedError = (operationName: string, clientError: ClientError) => {
  if (
    isNullish(Router.getRoute(["ProjectLogin"])) && // We are not on the project login page
    operationName !== "AuthStatus" && // The session expire didn't occured after a simple logged in check
    ClientError.toArray(clientError).some(error =>
      match(error)
        .with({ status: 401 }, () => true)
        .with({ extensions: { response: P.select() } }, res => isUnauthorizedResponse(res))
        .with({ message: P.select(P.string) }, message => isUnauthorizedLikeString(message))
        .otherwise(() => false),
    )
  ) {
    // never resolve, this way we never trigger an error screen
    return Future.make<Result<unknown, ClientError>>(() => {
      window.location.replace(
        Router.ProjectLogin({ sessionExpired: "true", redirectTo: getLocation().toString() }),
      );
    });
  } else {
    return Future.value(Result.Error(clientError));
  }
};

const makeRequest: MakeRequest = ({ url, headers, operationName, document, variables }) => {
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
    .flatMapError(error => filterOutUnauthorizedError(operationName, error))
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
};

export const partnerClient = new Client({
  url: match(projectConfiguration)
    .with(
      Option.P.Some({ projectId: P.select(), mode: "MultiProject" }),
      projectId => `/api/projects/${projectId}/partner`,
    )
    .otherwise(() => `/api/partner`),
  makeRequest,
  schemaConfig: partnerSchemaConfig,
});

export const partnerAdminClient = new Client({
  url: match(projectConfiguration)
    .with(
      Option.P.Some({ projectId: P.select(), mode: "MultiProject" }),
      projectId => `/api/projects/${projectId}/partner-admin`,
    )
    .otherwise(() => `/api/partner-admin`),
  makeRequest,
  schemaConfig: partnerSchemaConfig,
});

export const unauthenticatedClient = new Client({
  url: `/api/unauthenticated`,
  makeRequest,
  schemaConfig: unauthenticatedSchemaConfig,
});
