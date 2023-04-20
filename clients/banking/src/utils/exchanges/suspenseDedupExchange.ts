import { isNotNullish, isNullish } from "@swan-io/lake/src/utils/nullish";
import { Exchange, Operation, OperationResult, makeOperation } from "@urql/core";
import { map, pipe, tap } from "wonka";

const RENDER_LEEWAY = 500;

export const suspenseDedupExchange: Exchange = ({ forward }) => {
  const operations = new Map<number, number>();

  const processIncomingOperation = (operation: Operation): Operation => {
    if (operation.kind !== "query" || operation.context.requestPolicy !== "network-only") {
      return operation;
    }

    const currentTime = new Date().getTime();
    const lastOccurrence = operations.get(operation.key);

    if (isNotNullish(lastOccurrence) && currentTime - lastOccurrence <= RENDER_LEEWAY) {
      return makeOperation(operation.kind, operation, {
        ...operation.context,
        requestPolicy: "cache-only",
      });
    }

    return operation;
  };

  const processIncomingResults = ({ operation }: OperationResult): void => {
    const { meta } = operation.context;
    const currentTime = new Date().getTime();
    const lastOccurrence = operations.get(operation.key);

    if (isNullish(lastOccurrence) || currentTime - lastOccurrence > RENDER_LEEWAY) {
      operations.set(operation.key, currentTime);
    }

    if (isNotNullish(meta) && meta.cacheOutcome !== "miss") {
      operations.delete(operation.key);
    }
  };

  return ops$ => {
    return pipe(forward(pipe(ops$, map(processIncomingOperation))), tap(processIncomingResults));
  };
};
