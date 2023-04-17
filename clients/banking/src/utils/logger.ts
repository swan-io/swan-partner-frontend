import { print as printQuery } from "@0no-co/graphql.web";
import { captureException /*, init*/ } from "@sentry/react";
import { isNotNullish, isNullish } from "@swan-io/lake/src/utils/nullish";
import { CombinedError, Operation, OperationContext } from "urql";
// import { env } from "./env";

export { setUser as setSentryUser } from "@sentry/react";

// const FORCE_DEV_LOGGING = false;

const ENABLED = false;
// // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
// (process.env.NODE_ENV === "production" || FORCE_DEV_LOGGING) &&
// env.SENTRY_ENV !== "" &&
// env.SENTRY_DSN !== "";

export const initSentry = () => {
  // if (ENABLED) {
  //   init({
  //     release: __SWAN_ENV_VERSION__,
  //     dsn: env.SENTRY_DSN,
  //     environment: env.SENTRY_ENV,
  //     normalizeDepth: 5,
  //   });
  // }
};

const getOperationContextHeaders = (context: OperationContext): Record<string, string> => {
  const { headers } =
    typeof context.fetchOptions === "function"
      ? context.fetchOptions()
      : context.fetchOptions ?? {};

  if (isNullish(headers)) {
    return {};
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  return headers;
};

export const logFrontendError = (exception: unknown, extra?: Record<string, unknown>) => {
  if (ENABLED && !(exception instanceof CombinedError)) {
    captureException(exception, {
      extra,
      tags: { scope: "frontend" },
    });
  }
};

export const logBackendError = (
  { graphQLErrors }: CombinedError,
  { context, query, variables }: Operation,
) => {
  if (!ENABLED) {
    return;
  }

  const headers = getOperationContextHeaders(context);
  const existingHeaders = Object.keys(headers).filter(key => isNotNullish(headers[key]));
  const requestId = headers["x-request-id"];
  const hasMultipleErrors = graphQLErrors.length > 1;

  graphQLErrors.forEach(error => {
    if (
      hasMultipleErrors &&
      error.message.startsWith("Cannot return null for non-nullable field")
    ) {
      return;
    }

    if (isNotNullish(requestId)) {
      // Mutate the error message to prepend the requestId
      error.message = `${requestId} - ${error.message}`;
    }

    captureException(error, {
      tags: {
        scope: "backend",
        endpoint: context.url,
      },
      extra: {
        headers: existingHeaders,
        query: printQuery(query),
        requestPolicy: context.requestPolicy,
        suspense: context.suspense,
        variables, // eslint-disable-line @typescript-eslint/no-unsafe-assignment
      },
    });
  });
};
