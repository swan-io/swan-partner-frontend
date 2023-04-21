import { Exchange, Operation, OperationResult, makeOperation } from "@urql/core";
import { map, pipe, tap } from "wonka";

const RENDER_LEEWAY = 500;

/**
 * Because we use react suspense and network-only request policy, network requests are
 * fired twice: one at initial component render: suspense throw a promise, go up
 * in the react tree to display a loader, then render the app with data, reexecuting
 * the urql useQuery hook.
 *
 * This might be solve with the future `use` hook: https://github.com/reactjs/rfcs/pull/229
 */
export const suspenseDedupExchange: Exchange = ({ forward }) => {
  const operations = new Map<number, number>();

  const processIncomingOperation = (operation: Operation): Operation => {
    if (operation.kind !== "query" || operation.context.requestPolicy !== "network-only") {
      return operation;
    }

    if (new Date().getTime() - (operations.get(operation.key) ?? 0) <= RENDER_LEEWAY) {
      return makeOperation(operation.kind, operation, {
        ...operation.context,
        requestPolicy: "cache-only",
      });
    }

    return operation;
  };

  const processIncomingResults = ({ operation }: OperationResult): void => {
    if (operation.context.requestPolicy === "network-only") {
      operations.set(operation.key, new Date().getTime());
    }
  };

  return ops$ => {
    return pipe(forward(pipe(ops$, map(processIncomingOperation))), tap(processIncomingResults));
  };
};
