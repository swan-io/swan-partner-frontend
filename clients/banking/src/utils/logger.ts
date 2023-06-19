import { print as printQuery } from "@0no-co/graphql.web";
import { captureException, init } from "@sentry/react";
import { isNotNullish, isNullish } from "@swan-io/lake/src/utils/nullish";
import { CombinedError, Operation, OperationContext } from "urql";
import { env } from "./env";

export { setUser as setSentryUser } from "@sentry/react";

const FORCE_DEV_LOGGING = false;

const ENABLED = env.IS_SWAN_MODE && (process.env.NODE_ENV === "production" || FORCE_DEV_LOGGING);

export const initSentry = () => {
  if (ENABLED) {
    init({
      release: env.VERSION,
      dsn: "https://7c5c2f093c5f4fe497f727d2bbdb104c@o427297.ingest.sentry.io/5371150",
      environment: env.BANKING_URL.includes("preprod")
        ? "preprod"
        : env.BANKING_URL.includes("master")
        ? "master"
        : "prod",
      normalizeDepth: 5,
    });
  }
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

export const logBackendError = (error: CombinedError, { context, query, variables }: Operation) => {
  if (!ENABLED || (error.graphQLErrors.length === 0 && isNotNullish(error.networkError))) {
    return;
  }

  const headers = getOperationContextHeaders(context);
  const existingHeaders = Object.keys(headers).filter(key => isNotNullish(headers[key]));
  const requestId = headers["x-request-id"];

  const graphQLErrors = error.graphQLErrors.filter(({ message }) => {
    const lowerCased = message.toLowerCase();

    return (
      !lowerCased.includes("unauthenticated") &&
      !lowerCased.includes("unauthorized") &&
      !lowerCased.includes("cannot return null for non-nullable field")
    );
  });

  graphQLErrors.forEach(({ message }) => {
    // Update the error message to prepend the requestId
    const error = new Error(isNotNullish(requestId) ? `${requestId} - ${message}` : message);
    error.name = "GraphQLError";

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
        variables,
      },
    });
  });
};
