import { Future, Result } from "@bloodyowl/boxed";
import { Client, ClientContext, ClientError } from "@bloodyowl/graphql-client";
import { ToastStack } from "@swan-io/shared-business/src/components/ToastStack";
import { hideToast, useToasts } from "@swan-io/shared-business/src/state/toasts";
import { render } from "@testing-library/react";
import { GraphQLError } from "graphql";
import { ReactElement } from "react";
import { afterEach } from "vitest";
import partnerSchemaConfig from "../../../../../scripts/graphql/dist/partner-schema-config.json";

type Handler = (variables: Record<string, unknown>) => Result<unknown, ClientError>;

export type MockHandlers = Record<string, Handler>;

const missingHandlers = new Set<string>();

// An operation without a handler would only render the error view, letting a test pass for the
// wrong reason: fail the test instead
afterEach(() => {
  const operationNames = [...missingHandlers];
  missingHandlers.clear();

  if (operationNames.length > 0) {
    throw new Error(`No mock handler for operation(s): ${operationNames.join(", ")}`);
  }
});

type SchemaConfig = ConstructorParameters<typeof Client>[0]["schemaConfig"];

// A fake backend: answers each GraphQL operation (by name) with its handler. Handlers should
// respond from the variables they receive, so tests assert what the user sees, never the requests.
// Pass the schema config of the client the screen uses, so fragments on unions match
export const createMockClient = (
  handlers: MockHandlers,
  schemaConfig: SchemaConfig = partnerSchemaConfig,
) =>
  new Client({
    url: "/mock",
    schemaConfig,
    makeRequest: ({ operationName, variables }) => {
      const handler = Object.hasOwn(handlers, operationName) ? handlers[operationName] : undefined;

      if (handler == null) {
        missingHandlers.add(operationName);
      }

      const result =
        handler != null
          ? handler(variables)
          : Result.Error([new GraphQLError(`No mock handler for operation "${operationName}"`)]);

      // Resolve asynchronously like a real network call: useQuery's reload() relies on it
      return Future.make(resolve => {
        const timeout = setTimeout(() => resolve(result), 0);
        return () => clearTimeout(timeout);
      });
    },
  });

// Toasts live in a global store: without this, a toast shown by a test is still visible in the next
let shownToasts: { uid: string }[] = [];

const Toasts = () => {
  shownToasts = useToasts();
  return <ToastStack />;
};

afterEach(() => {
  shownToasts.forEach(({ uid }) => hideToast(uid));
  shownToasts = [];
});

type Options = {
  client: Client;
};

export const renderWithProviders = (ui: ReactElement, { client }: Options) =>
  render(
    <ClientContext.Provider value={client}>
      {ui}
      <Toasts />
    </ClientContext.Provider>,
  );
