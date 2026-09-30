import { Option } from "@bloodyowl/boxed";
import { FieldNode, Kind, OperationTypeNode, parse, SelectionNode } from "graphql";
import { match, P } from "ts-pattern";

// Returns the top-level fields of every mutation operation,
// resolving inline fragments and fragment spreads so that none of them can hide a mutation
const getMutationFields = (gqlQuery: string): FieldNode[] => {
  const ast = parse(gqlQuery);

  const fragments = new Map(
    ast.definitions
      .filter(def => def.kind === Kind.FRAGMENT_DEFINITION)
      .map(fragment => [fragment.name.value, fragment]),
  );

  const resolveFields = (
    selections: readonly SelectionNode[],
    visitedFragments: Set<string>,
  ): FieldNode[] =>
    selections.flatMap(selection =>
      match(selection)
        .with({ kind: Kind.FIELD }, field => [field])
        .with({ kind: Kind.INLINE_FRAGMENT }, fragment =>
          resolveFields(fragment.selectionSet.selections, visitedFragments),
        )
        .with({ kind: Kind.FRAGMENT_SPREAD }, spread => {
          const fragmentName = spread.name.value;
          const fragment = fragments.get(fragmentName);
          // cyclic fragments are invalid and will be rejected by the API
          if (fragment == null || visitedFragments.has(fragmentName)) {
            return [];
          }
          return resolveFields(
            fragment.selectionSet.selections,
            new Set([...visitedFragments, fragmentName]),
          );
        })
        .exhaustive(),
    );

  return ast.definitions
    .flatMap(def =>
      match(def)
        .with({ kind: Kind.OPERATION_DEFINITION, operation: OperationTypeNode.MUTATION }, op =>
          resolveFields(op.selectionSet.selections, new Set()),
        )
        .otherwise(() => []),
    )
    .filter(field => field.name.value !== "__typename");
};

export const getCalledMutations = (gqlQuery: string): string[] =>
  getMutationFields(gqlQuery).map(field => field.name.value);

// Returns the source `accountId` when the request only calls `initiateCreditTransfers`
// with its `input` passed as a variable targeting an account by id (as the web banking does).
// Any other shape returns `None` so that the caller keeps denying the request.
export const getCreditTransfersAccountId = (gqlQuery: string, variables: unknown): Option<string> =>
  match(getMutationFields(gqlQuery))
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
