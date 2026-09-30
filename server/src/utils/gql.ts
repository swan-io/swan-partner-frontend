import { Option } from "@bloodyowl/boxed";
import { Kind, parse, SelectionNode } from "graphql";
import { match, P } from "ts-pattern";

const getMutationSelections = (gqlQuery: string): SelectionNode[] => {
  const ast = parse(gqlQuery);
  const mutationOperations = ast.definitions.filter(
    def => def.kind === "OperationDefinition" && def.operation === "mutation",
  );
  return mutationOperations
    .flatMap(op =>
      match(op)
        .with({ selectionSet: P.select() }, selectionSet => selectionSet.selections)
        .otherwise(() => []),
    )
    .filter(selection => !(selection.kind === Kind.FIELD && selection.name.value === "__typename"));
};

export const getCalledMutations = (gqlQuery: string): string[] => {
  const mutations = getMutationSelections(gqlQuery)
    .map(selection =>
      match(selection)
        .with({ name: { value: P.select() } }, name => name)
        .otherwise(() => null),
    )
    .filter(name => name != null);

  return mutations;
};

// Returns the source `accountId` when the request only calls `initiateCreditTransfers`
// with its `input` passed as a variable targeting an account by id (as the web banking does).
// Any other shape returns `None` so that the caller keeps denying the request.
export const getCreditTransfersAccountId = (gqlQuery: string, variables: unknown): Option<string> =>
  match(getMutationSelections(gqlQuery))
    .with(
      [
        {
          kind: Kind.FIELD,
          name: { value: "initiateCreditTransfers" },
          arguments: [
            {
              name: { value: "input" },
              value: { kind: Kind.VARIABLE, name: { value: P.select() } },
            },
          ],
        },
      ],
      variableName =>
        match(variables)
          .with({ [variableName]: P.select() }, input => Option.Some(input))
          .otherwise(() => Option.None())
          .flatMap(input =>
            match(input)
              .with(
                { accountId: P.select(P.string), accountNumber: P.optional(P.nullish) },
                accountId => Option.Some(accountId),
              )
              .otherwise(() => Option.None()),
          ),
    )
    .otherwise(() => Option.None());
