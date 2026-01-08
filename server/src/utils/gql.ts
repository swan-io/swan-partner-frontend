import { parse } from "graphql";
import { match, P } from "ts-pattern";

export const getCalledMutations = (gqlQuery: string): string[] => {
  const ast = parse(gqlQuery);
  const mutationOperations = ast.definitions.filter(
    def => def.kind === "OperationDefinition" && def.operation === "mutation",
  );
  const mutations = mutationOperations
    .flatMap(op =>
      match(op)
        .with({ selectionSet: P.select() }, selectionSet => selectionSet.selections)
        .otherwise(() => []),
    )
    .map(selection =>
      match(selection)
        .with({ name: { value: P.select() } }, name => name)
        .otherwise(() => null),
    )
    .filter(name => name != null)
    .filter(name => name !== "__typename");

  return mutations;
};
