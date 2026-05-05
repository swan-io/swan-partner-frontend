import { Future, Option, Result } from "@swan-io/boxed";
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
import { getLocation } from "@zoontek/chicane";
import { GraphQLError } from "graphql";
import { customAlphabet } from "nanoid";
import { P, match } from "ts-pattern";
import partnerSchemaConfig from "../../../../scripts/graphql/dist/partner-schema-config.json";
import unauthenticatedSchemaConfig from "../../../../scripts/graphql/dist/unauthenticated-schema-config.json";
import { env } from "./env";
import { locale } from "./i18n";
import { projectConfiguration } from "./projectId";
import { Router } from "./routes";

const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
const nanoid = customAlphabet(alphabet, 8);

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

  return Request.make({
    url,
    method: "POST",
    type: "json",
    headers: {
      ...headers,
      "accept-language": locale.language,
      "x-swan-request-id": requestId,
      // Used for reporting in GraphQL federation
      "x-graphql-client-name": "banking",
      "x-graphql-client-version": env.VERSION,
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
    .otherwise(() => "/api/partner"),
  makeRequest,
  schemaConfig: partnerSchemaConfig,
});

export const partnerAdminClient = new Client({
  url: match(projectConfiguration)
    .with(
      Option.P.Some({ projectId: P.select(), mode: "MultiProject" }),
      projectId => `/api/projects/${projectId}/partner-admin`,
    )
    .otherwise(() => "/api/partner-admin"),
  makeRequest,
  schemaConfig: partnerSchemaConfig,
});

export const unauthenticatedClient = new Client({
  url: "/api/unauthenticated",
  makeRequest,
  schemaConfig: unauthenticatedSchemaConfig,
});
