import { Option, Result } from "@swan-io/boxed";
import {
  Client,
  ClientError,
  InvalidGraphQLResponseError,
  MakeRequest,
  parseGraphQLError,
  print,
} from "@swan-io/graphql-client";
import { Request, badStatusToError, emptyToError } from "@swan-io/request";
import { registerErrorToRequestId } from "@swan-io/shared-business/src/state/toasts";
import { GraphQLError } from "graphql";
import { customAlphabet } from "nanoid";
import { P, match } from "ts-pattern";
import partnerSchemaConfig from "../../../../scripts/graphql/dist/partner-schema-config.json";
import schemaConfig from "../../../../scripts/graphql/dist/unauthenticated-schema-config.json";
import { env } from "./env";
import { locale } from "./i18n";
import { projectConfiguration } from "./projectId";

const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
const nanoid = customAlphabet(alphabet, 8);

export const errorToRequestId = new WeakMap<WeakKey, string>();
registerErrorToRequestId(errorToRequestId);

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
      "x-graphql-client-name": "onboarding",
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

export const client = new Client({
  url: `${env.BANKING_URL}/api/unauthenticated`,
  schemaConfig,
  makeRequest,
});

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
